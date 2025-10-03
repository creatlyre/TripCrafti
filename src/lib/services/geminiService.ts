import { GoogleGenerativeAI } from '@google/generative-ai';

import type {
  AIPackingListResponse,
  GenerateDetails,
  PackingItem,
  PackingListMeta,
  ValidationResult,
  ChecklistItem,
  CategorizationResult,
} from '@/types';

import { logDebug, logError } from '@/lib/log';

// (types import moved above to satisfy lint ordering)

// This service should only be called from server-side code (e.g., API routes)
// Use static env access so Vite can statically replace it; then fallback to process.env in test / node contexts.
const resolvedApiKey = import.meta.env.GEMINI_API_KEY;
const resolvedModel = import.meta.env.GEMINI_MODEL || 'gemini-2.5-flash';

let ai: GoogleGenerativeAI | null = null;
const getModel = () => {
  if (!resolvedApiKey) {
    throw new Error('Gemini API Key (GEMINI_API_KEY) is not configured.');
  }
  if (!ai) {
    logDebug('Initializing Gemini client', { model: resolvedModel });
    ai = new GoogleGenerativeAI(resolvedApiKey);
  }
  return ai.getGenerativeModel({ model: resolvedModel });
};

const getGeneratePrompt = (details: GenerateDetails, language: string): string => {
  const {
    destination,
    days,
    adults,
    childrenAges,
    season,
    transport,
    accommodation,
    activities,
    special,
    region,
    travelStyle,
  } = details;

  return `
<persona>
You are "TripCrafti Packing Architect", a specialized AI module. Your sole purpose is to create optimized packing lists. You are guided by three overarching principles:
1.  **Smart Minimalism:** Every item must have a justification. Prefer multi-functional items. Avoid unnecessary "just-in-case" items.
2.  **No Critical Failures:** Documents, medication, and key items for safety and health are non-negotiable and cannot be missed.
3.  **Context is King:** The list must be perfectly tailored to the data from <InputData>. Every choice stems directly from this data.
Your responses must be consistent and logic-based, not based on random creativity.
</persona>

<language>${language}</language>

<critical_language_rule>
ALL text fields (item names, categories, notes, checklist tasks, archetype, archetype_reasoning) MUST be in the specified language: ${language}. Mixing languages, transliterations, or leaving Anglicisms is not allowed (unless a given name is a global standard, e.g., "Powerbank"). If the model is unsure of a translation, it must choose the most common form in the ${language}. Violation of this rule = critical failure.
</critical_language_rule>

<InputData>
  <Destination>${destination}</Destination>
  <Region>${region || 'unspecified'}</Region>
  <TravelStyle>${travelStyle || 'unspecified'}</TravelStyle>
  <Duration days="${days}"/>
  <Travelers adults="${adults}" childrenAges="${childrenAges || 'none'}"/>
  <Season>${season}</Season>
  <Transport>${transport}</Transport>
  <Accommodation>${accommodation}</Accommodation>
  <Activities>${activities || 'none'}</Activities>
  <SpecialNeeds>${special || 'none'}</SpecialNeeds>
</InputData>

<Task>
  <Step name="InputValidationAndAssumption">
    0. Analyze <InputData>. If you find contradictions (e.g., summer season and 'skiing' as an activity) or extreme ambiguities, identify the issue, choose the most likely scenario, and record your assumption. This assumption MUST be included in the 'archetype_reasoning' field in the final JSON.
  </Step>
  <Step name="ArchetypeDefinition">
    1. Based on all data from the <InputData> section, internally define one "Travel Archetype" and a one-sentence justification for this choice. Example archetypes: "Luxury City Break", "Family All-Inclusive Resort Vacation", "Backpacking Adventure in SE Asia", "Business Trip", "Hut-to-Hut Mountain Trek".
  </Step>
  <Step name="DraftGeneration">
    2. Based on the Travel Archetype and all rules from the <Rules> section, generate a draft list of items in memory.
  </Step>
  <Step name="ApplyExclusions">
    3. Analyze the draft list and apply the rules from the <ExclusionRules> section to remove unnecessary items.
  </Step>
  <Step name="SelfCritiqueAndCorrection">
    4. Analyze the list after exclusions for compliance with every rule in the <AutoCorrectionRules> section. Implement required corrections. This step is mandatory.
  </Step>
  <Step name="FinalizeJSON">
    5. Generate the final JSON object compliant with the schema in <OutputSchema>. The output must contain ONLY a syntactically correct JSON object, with no additional text, explanations, or markdown formatting.
  </Step>
</Task>

<Rules>
  <Rule id="item_structure">
    Each item in the list must have the format: { "name": string, "qty": number | string, "notes"?: string, "category": string, "optional"?: boolean }.
  </Rule>

  <Rule id="category_structure">
    Group items into fixed categories: "Documents & Finances", "Clothes", "Footwear", "Hygiene & Cosmetics", "First-Aid Kit", "Electronics", "Kids" (if applicable), "Special Activities", "On the Go (Carry-on)", "Other". Additionally, generate a task list under "Before Departure (Checklist)".
  </Rule>

  <Rule id="clothing_ratios">
    For the 'Clothes' category, apply the following formulas (rounding up to the nearest integer). This rule has a lower priority than 'laundry_assumption'.
    - underwear_qty = days + 1
    - socks_qty = days
    - tshirts_qty = CEIL(days * 0.8)
    - long_trousers_qty = CEIL(days / 3)
    - shorts_qty (only summer/tropics) = CEIL(days / 2)
  </Rule>

  <Rule id="laundry_assumption">
    IF (days > 10) AND (accommodation is NOT 'campsite' AND accommodation is NOT 'mountain hut'):
      SET laundry_cycle = 7; // Assume laundry is done every 7 days.
      underwear_qty = laundry_cycle + 2;
      socks_qty = laundry_cycle + 1;
      tshirts_qty = CEIL(laundry_cycle * 0.8);
      ADD to "Before Departure (Checklist)": { "task": "Plan where and when you will do laundry", "done": false };
      ADD to "Other": { "name": "Laundry detergent sheets", "qty": "2-3", "notes": "In case of hand washing or machine use", "category": "Other", "optional": true };
    ENDIF
  </Rule>

  <Rule id="clothing_modifiers">
    Apply the following modifiers to clothing quantities:
    - IF (any child_age < 4): base_clothing_qty *= 1.3;
    - IF (TravelArchetype includes "trekking" OR "backpacking"): prefer quick-drying clothes (synthetic/merino), add 'quick-drying' to the notes.
  </Rule>

  <Rule id="first_aid_kit_module">
    The First-Aid Kit must always include: basic wound care (plasters, gauze, antiseptic), painkillers/fever reducers, stomach ache medicine, and personal prescription drugs (as a placeholder: 'Personal prescription medication').
    <Condition check="region" includes="Southeast Asia,South America,Sub-Saharan Africa">
      ADD: High-DEET insect repellent, oral rehydration salts (electrolytes), probiotics.
    </Condition>
    <Condition check="activities" includes="trekking,hiking,mountains">
      ADD: Blister plasters, emergency blanket (space blanket), pain-relief/warming ointment.
    </Condition>
    <Condition check="childrenAges" exists="true">
      ADD: Digital thermometer, antihistamines for children, insect bite relief cream.
    </Condition>
  </Rule>

  <Rule id="electronics_module">
    Default: 1x power bank per family, 1x multi-port charger (e.g., GaN) with appropriate cables.
    <Condition check="special" includes="remote work">
      ADD: Laptop, laptop charger, noise-cancelling headphones, portable laptop stand.
    </Condition>
    <Condition check="region" is_different_than="Europe/EU">
      ADD: Travel adapter (type corresponding to the region), add socket type to notes if known.
    </Condition>
  </Rule>

  <Rule id="activity_specific_modules">
    <Condition check="activities" includes="beach,swimming,snorkeling">
      ADD: Swimsuit, UV sunscreen (min. SPF 30, 50 for kids), hat/cap, sunglasses, quick-drying towel.
      ADD (optional): Water shoes, waterproof bag.
    </Condition>
    <Condition check="activities" includes="trekking,hiking,mountains">
      ADD: Thermal underwear (if season != summer), fleece/mid-layer jacket, softshell/rain jacket (outer layer), hat and gloves (depending on season), headlamp, add ICE number to phone (add to checklist).
    </Condition>
  </Rule>

  <Rule id="cultural_nuances">
    <Condition check="region" includes="Middle East,South Asia">
      ADD: Lightweight scarf/shawl (for women), long, breathable trousers/skirt. In notes, add: 'For modest dress when visiting places of worship'.
    </Condition>
  </Rule>

  <Rule id="buy_on_arrival_strategy">
    For trips > 7 days to urbanized regions, for items that are easily available and bulky (e.g., shower gel, shampoo, sunscreen, diapers), add a suggestion in the "notes" field: 'Consider buying at destination to save space.'.
  </Rule>

  <Rule id="language_enforcement">
    Every string (in the name, notes, category, task, archetype fields) must be in ${language}. If other languages appear in the input data, normalize them to ${language}.
  </Rule>
</Rules>

<ExclusionRules>
  <Rule id="hotel_amenities">
    IF (accommodation CONTAINS 'hotel' AND NOT (accommodation CONTAINS 'cheap' OR accommodation CONTAINS 'hostel' OR accommodation CONTAINS 'motel')):
      REMOVE 'Towel', 'Shower Gel', 'Shampoo', 'Soap', 'Hairdryer' FROM list.
      ADD to "Before Departure (Checklist)": { "task": "Confirm available amenities at the hotel (toiletries, towels)", "done": false }.
    ENDIF
  </Rule>
  <Rule id="carry_on_only">
    IF (transport CONTAINS 'plane' AND special CONTAINS 'carry-on only'):
      PRIORITIZE multi-functional solid cosmetics (e.g., shampoo bar).
      FOR each liquid in 'Hygiene & Cosmetics': ensure notes includes 'Mini version / up to 100ml'.
    ENDIF
  </Rule>
</ExclusionRules>

<ExecutionPlan>
Before generating the final JSON, follow the steps in the <Task> section EXACTLY. Conduct an internal step-by-step analysis. Your final response must ONLY contain the JSON object.
</ExecutionPlan>

<AutoCorrectionRules>
  <Check id="duplicate_items">
    Before finalizing, remove duplicate item names (case-insensitive), merging their quantities or notes.
  </Check>
  <Check id="toddler_essentials">
    IF (any child_age < 3) AND (list LACKS 'Wet wipes' OR list LACKS 'Diapers' OR list LACKS 'Barrier cream'): ADD missing items. Diaper quantity = days * 5.
  </Check>
  <Check id="shoe_count">
    IF (days < 8) AND (count(category='Footwear') > 3 per person): Reduce the quantity by combining the functionality of shoes. E.g., instead of hiking boots and sneakers, suggest 'approach shoes'. Update the notes accordingly.
  </Check>
  <Check id="airline_liquids">
    IF (transport CONTAINS 'plane' OR 'flight'): Check the 'Hygiene & Cosmetics' category. For all liquids, add to notes: 'Must be in containers up to 100ml or packed in checked luggage'.
  </Check>
  <Check id="leave_space">
    In the 'Other' category, add the item: { "name": "Free space in luggage", "qty": "approx. 10-15%", "notes": "For shopping and souvenirs", "category": "Other", "optional": true }.
  </Check>
  <Check id="language_final_check">
    As the absolute final step before outputting the JSON, meticulously review every single generated string ('name', 'notes', 'category', 'task', 'archetype', 'archetype_reasoning'). Confirm that 100% of the text complies with the <critical_language_rule> and is in the target language: ${language}. If any stray words from another language are found, correct them immediately. This is a mandatory final quality gate.
  </Check>
</AutoCorrectionRules>

<OutputSchema>
{
  "meta": {
    "destination": "string",
    "days": "number",
    "people": { "adults": "number", "children": "number" },
    "season": "string",
    "archetype": "string",
    "archetype_reasoning": "string"
  },
  "checklist": [
    { "task": "Scan documents (passport, visa) and save to the cloud", "done": false },
    { "task": "Notify your bank about traveling abroad", "done": false }
  ],
  "items": [
    { "name": "Passport", "qty": 1, "category": "Documents & Finances", "notes": "Check expiration date!", "optional": false }
  ]
}
</OutputSchema>
`;
};

const getValidatePrompt = (currentList: PackingItem[], changes: object): string => {
  return `
<Persona>
Jesteś precyzyjnym i doświadczonym AI, ekspertem od optymalizacji list podróżnych. Twoim celem jest nie tylko walidacja, ale proaktywne doradztwo. Analizujesz listę i zmiany, aby uczynić ją mądrzejszą, lżejszą i lepiej dopasowaną do realnych potrzeb podróżnika. Twoje sugestie są konstruktywne, logiczne i zawsze poparte rzeczowym uzasadnieniem.
</Persona>

<InputData>
  <PackingList>
    ${JSON.stringify({ items: currentList }, null, 2)}
  </PackingList>
  <UserChanges>
    ${JSON.stringify(changes, null, 2)}
  </UserChanges>
</InputData>

<Task>
  <Step name="AnalyzeChanges">
    1. Przeanalizuj zmiany użytkownika w <UserChanges>, aby zrozumieć jego intencje i nowy kontekst podróży.
  </Step>
  <Step name="AnalyzeListForIssues">
    2. Przeanalizuj listę w <PackingList> w nowym kontekście. Zastosuj <ValidationRules>, aby zidentyfikować braki (missing), nadmiar (remove) lub potrzebę korekty (adjust).
  </Step>
  <Step name="AnalyzeListForSynergies">
    3. Przejdź na wyższy poziom analizy. Zastosuj <OptimizationRules>, aby znaleźć możliwości synergii, czyli zastąpienia kilku przedmiotów jednym, wielofunkcyjnym. Przewiduj też niewypowiedziane potrzeby.
  </Step>
  <Step name="FinalizeJSON">
    4. Wygeneruj ostateczny obiekt JSON zgodny ze schematem w <OutputSchema>. Zadbaj o to, by każda sugestia miała jasne i logiczne uzasadnienie. Wynik musi zawierać WYŁĄCZNIE poprawny składniowo obiekt JSON.
  </Step>
</Task>

<ValidationRules>
  <Rule id="critical_omissions">
    Sprawdź, czy na liście znajdują się elementy krytyczne, biorąc pod uwagę kontekst (dokumenty, leki, sprzęt specyficzny dla aktywności jak trekking czy plażowanie). Jeśli czegoś brakuje, dodaj to do sekcji "missing".
  </Rule>
  <Rule id="redundancy_check">
    Zidentyfikuj przedmioty, które są ewidentnie zbędne, zduplikowane lub nadmiarowe (np. 3 pary eleganckich butów na 4-dniowy wyjazd w góry). Dodaj je do sekcji "remove".
  </Rule>
  <Rule id="quantity_and_notes_adjustment">
    Sprawdź, czy ilości i notatki są adekwatne. Przykłady:
    - IF transport to 'samolot' AND płyn > 100ml: SUGGEST adjust notes to 'do 100ml lub bagaż rejestrowany'.
    - IF nocleg w 'hotel' AND na liście jest 'ręcznik': SUGGEST adjust notes to 'sprawdź, czy hotel zapewnia'.
    Dodaj takie pozycje do sekcji "adjust".
  </Rule>
</ValidationRules>

<OptimizationRules>
  <Rule id="synergy_and_multifunction">
    Przeanalizuj listę pod kątem przedmiotów o podobnych lub nakładających się funkcjach. Jeśli znajdziesz takie, zaproponuj ich zastąpienie jednym, wielofunkcyjnym przedmiotem.
    Przykład: IF lista zawiera 'ręcznik plażowy' AND 'szalik' AND 'koc do samolotu', SUGGEST 'replace' z 'chustą podróżną (np. peshtemal)', uzasadniając oszczędnością miejsca i wszechstronnością.
  </Rule>
  <Rule id="unspoken_needs_prediction">
    Przewiduj problemy, zanim się pojawią, analizując całą listę.
    Przykład 1: IF lista zawiera dużo elektroniki (laptop, telefon, aparat) AND podróż jest długa (np. długi lot), SUGGEST 'missing' 'powerbank o dużej pojemności'.
    Przykład 2: IF cel to 'tropiki' AND na liście jest dużo ubrań bawełnianych, SUGGEST 'adjust' na 'odzież szybkoschnącą', wyjaśniając problem z schnięciem bawełny w wilgotnym klimacie.
  </Rule>
</OptimizationRules>

<OutputSchema>
{
  "missing": [
    {
      "name": "string",
      "category": "string",
      "reason": "string // Uzasadnij, dlaczego ten przedmiot jest krytyczny w danym kontekście."
    }
  ],
  "remove": [
    {
      "name": "string",
      "reason": "string // Uzasadnij, dlaczego ten przedmiot jest zbędny lub nadmiarowy."
    }
  ],
  "adjust": [
    {
      "name": "string",
      "field": "qty | notes | category",
      "current": "string | number",
      "suggested": "string | number",
      "reason": "string // Wyjaśnij powód sugerowanej korekty."
    }
  ],
  "replace": [
    {
      "items_to_remove": ["string"],
      "suggested_item": {
        "name": "string",
        "category": "string"
      },
      "reason": "string // Wyjaśnij korzyści płynące z zamiany, np. oszczędność miejsca, wagi, wszechstronność."
    }
  ]
}
</OutputSchema>
`;
};

export const generatePackingList = async (
  details: GenerateDetails,
  language: string
): Promise<{
  meta: PackingListMeta;
  items: PackingItem[];
  checklist: ChecklistItem[];
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; thoughtTokens?: number };
}> => {
  try {
    const model = getModel();
    const chosenLanguage = language || details.language || 'Polish';
    const result = await model.generateContent(getGeneratePrompt(details, chosenLanguage));

    const response = result.response;
    const rawText = response.text();

    // Helper: extract first valid JSON object from raw model text (handles markdown fences, extra prose)
    const extractJson = (text: string): string => {
      if (!text) throw new Error('Empty AI response');
      // Remove common markdown fences ```json ... ``` or ``` ... ```
      let cleaned = text.trim();
      const fenceRegex = /^```[a-zA-Z]*\n([\s\S]*?)```$/m;
      const fenceMatch = cleaned.match(fenceRegex);
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
      }
      // Sometimes model prepends explanation; find first '{' and attempt to parse progressively
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace === -1) throw new Error('No JSON object found in AI response');
      cleaned = cleaned.slice(firstBrace);
      // Heuristic: try to balance braces to isolate JSON object
      let depth = 0;
      let endIndex = -1;
      for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex !== -1) {
        cleaned = cleaned.slice(0, endIndex);
      }
      return cleaned;
    };

    let parsedList: AIPackingListResponse;
    try {
      const candidate = extractJson(rawText);
      parsedList = JSON.parse(candidate);
    } catch (inner) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Primary JSON extraction failed, raw text snippet:', rawText.slice(0, 500));
      }
      throw inner;
    }

    const itemsWithClientProps = parsedList.items.map((item, index) => ({
      ...item,
      id: Date.now() + index,
      packed: false,
    }));

    const checklistWithClientProps = (parsedList.checklist || []).map((task, index) => ({
      ...task,
      id: Date.now() + 10000 + index,
    }));

    // Attempt to read usage metadata (SDK may expose usageMetadata)
    // @ts-expect-error - experimental field in SDK
    const usageMeta = result?.response?.usageMetadata || result?.usageMetadata || {};
    const inputTokens = typeof usageMeta.promptTokenCount === 'number' ? usageMeta.promptTokenCount : undefined;
    const outputTokens =
      typeof usageMeta.candidatesTokenCount === 'number' ? usageMeta.candidatesTokenCount : undefined;
    const totalTokens = typeof usageMeta.totalTokenCount === 'number' ? usageMeta.totalTokenCount : undefined;
    // We don't get explicit "thought" tokens from Gemini; approximate as difference if available
    const thoughtTokens =
      typeof totalTokens === 'number' && typeof outputTokens === 'number'
        ? Math.max(totalTokens - outputTokens - (inputTokens || 0), 0)
        : undefined;

    return {
      meta: parsedList.meta,
      items: itemsWithClientProps,
      checklist: checklistWithClientProps,
      usage: { inputTokens, outputTokens, totalTokens, thoughtTokens },
    };
  } catch (error) {
    logError('Gemini generate error', error);
    throw new Error('Nie udało się wygenerować listy. Sprawdź format danych i spróbuj ponownie.');
  }
};

export const validatePackingList = async (currentList: PackingItem[], changes: object): Promise<ValidationResult> => {
  try {
    const model = getModel();
    const result = await model.generateContent(getValidatePrompt(currentList, changes));

    const response = result.response;
    const jsonText = response.text();
    const parsedResult = JSON.parse(jsonText);

    return {
      missing: parsedResult.missing || [],
      remove: parsedResult.remove || [],
      adjust: parsedResult.adjust || [],
      replace: parsedResult.replace || [],
    };
  } catch (error) {
    logError('Gemini validate error', error);
    throw new Error('Nie udało się sprawdzić listy. Spróbuj ponownie.');
  }
};

const getRecategorizePrompt = (items: PackingItem[], categories: string[]): string => {
  return `
<Persona>
Jesteś inteligentnym asystentem do organizacji. Twoim zadaniem jest przypisanie każdej rzeczy z listy do najbardziej pasującej kategorii z podanej listy kategorii. Działaj precyzyznie.
</Persona>

<InputData>
  <AvailableCategories>
    ${JSON.stringify(categories.filter((c) => c !== 'Nieskategoryzowane'))}
  </AvailableCategories>
  <ItemsToCategorize>
    ${JSON.stringify(items.map((i) => ({ id: i.id, name: i.name, notes: i.notes || '', current_category: i.category })))}
  </ItemsToCategorize>
</InputData>

<Task>
Przeanalizuj każdy przedmiot z <ItemsToCategorize>. Dla każdego przedmiotu, wybierz jedną, najbardziej odpowiednią kategorię z <AvailableCategories>. Nie twórz nowych kategorii. Zwróć wynik jako obiekt JSON zgodny ze schematem w <OutputSchema>. Wynik musi zawierać WYŁĄCZNIE poprawny składniowo obiekt JSON.
</Task>

<OutputSchema>
{
  "categorization": [
    {
      "id": "number // ID przedmiotu",
      "category": "string // Wybrana kategoria z AvailableCategories"
    }
  ]
}
</OutputSchema>
`;
};

export const categorizePackingList = async (
  items: PackingItem[],
  categories: string[]
): Promise<CategorizationResult[]> => {
  try {
    const model = getModel();
    const result = await model.generateContent(getRecategorizePrompt(items, categories));

    const response = result.response;
    const jsonText = response.text();
    const parsedResult = JSON.parse(jsonText);

    if (!parsedResult.categorization || !Array.isArray(parsedResult.categorization)) {
      throw new Error('Invalid response structure from AI.');
    }

    return parsedResult.categorization;
  } catch (error) {
    logError('Gemini categorize error', error);
    throw new Error('Nie udało się skategoryzować listy. Spróbuj ponownie.');
  }
};
