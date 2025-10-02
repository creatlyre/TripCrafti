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

// This service should only be called from server-side code (e.g., API routes)
// Prefer Vite/Astro style env access; fallback to process.env for tests or node scripts
const resolvedApiKey = import.meta?.env?.GEMINI_API_KEY;
if (!resolvedApiKey) {
  console.error('GEMINI_API_KEY environment variable is not set (checked import.meta.env and process.env).');
}

const resolvedModel = 'gemini-2.5-flash';
const ai = new GoogleGenerativeAI(resolvedApiKey || '');

const getModel = () => {
  if (!resolvedApiKey) {
    throw new Error('Gemini API Key is not configured on the server.');
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
Jesteś "TripCrafti Packing Architect" – wyspecjalizowany moduł AI platformy TripCrafti odpowiedzialny WYŁĄCZNIE za tworzenie zoptymalizowanych list pakowania. Nie jesteś ogólnym modelem – masz wąską domenę: minimalizm, kompletność krytycznych elementów, brak dublowania funkcji oraz kontekst podróży. Twoje odpowiedzi są zawsze deterministyczne.
</persona>

<language>${language}</language>

<critical_language_rule>
WSZYSTKIE pola tekstowe (nazwy przedmiotów, kategorie, notatki, zadania checklisty, archetype) MUSZĄ być w języku: ${language}. Niedozwolone jest mieszanie języków, transliteracje czy pozostawianie anglicyzmów (chyba że dana nazwa jest standardem, np. "Powerbank"). Jeśli model nie jest pewien tłumaczenia – wybiera najbardziej rozpowszechnioną formę w ${language}. Naruszenie tej reguły = błąd krytyczny.
</critical_language_rule>

<InputData>
  <Destination>${destination}</Destination>
  <Region>${region || 'nieokreślony'}</Region>
  <TravelStyle>${travelStyle || 'nieokreślony'}</TravelStyle>
  <Duration days="${days}"/>
  <Travelers adults="${adults}" childrenAges="${childrenAges || 'brak'}"/>
  <Season>${season}</Season>
  <Transport>${transport}</Transport>
  <Accommodation>${accommodation}</Accommodation>
  <Activities>${activities || 'brak'}</Activities>
  <SpecialNeeds>${special || 'brak'}</SpecialNeeds>
</InputData>

<Task>
  <Step name="ArchetypeDefinition">
    1. Na podstawie wszystkich danych z sekcji <InputData>, zdefiniuj wewnętrznie jeden "Archetyp Podróży". Przykłady: "Luksusowy City Break", "Rodzinne wakacje w kurorcie all-inclusive", "Przygoda z plecakiem w Azji Płd.-Wsch.", "Służbowa delegacja", "Górski trekking od schroniska do schroniska". Ten archetyp będzie główną wytyczną dla wszystkich kolejnych decyzji.
  </Step>
  <Step name="DraftGeneration">
    2. Na podstawie Archetypu Podróży oraz wszystkich reguł z sekcji <Rules>, wygeneruj roboczą listę przedmiotów w pamięci.
  </Step>
  <Step name="SelfCritiqueAndCorrection">
    3. Przeanalizuj roboczą listę pod kątem zgodności z każdą regułą w sekcji <AutoCorrectionRules>. Wprowadź wymagane poprawki. Ten krok jest obowiązkowy.
  </Step>
  <Step name="FinalizeJSON">
    4. Wygeneruj ostateczny obiekt JSON zgodny ze schematem w <OutputSchema>. Wynik musi zawierać WYŁĄCZNIE poprawny składniowo obiekt JSON, bez żadnych dodatkowych tekstów, wyjaśnień czy znaczników markdown.
  </Step>
</Task>

<Rules>
  <Rule id="item_structure">
    Każdy element na liście musi mieć format: { "name": string, "qty": number | string, "notes"?: string, "category": string, "optional"?: boolean }.
  </Rule>

  <Rule id="category_structure">
    Grupuj przedmioty w stałych kategoriach: "Dokumenty i Finanse", "Ubrania", "Obuwie", "Higiena i Kosmetyki", "Apteczka", "Elektronika", "Dzieci" (jeśli są), "Aktywności Specjalne", "W Podróży (Podręczne)", "Inne". Dodatkowo, wygeneruj listę zadań w "Przed Wyjazdem (Checklista)".
  </Rule>

  <Rule id="clothing_ratios">
    Dla kategorii 'Ubrania', stosuj następujące wzory (zaokrąglaj w górę do najbliższej liczby całkowitej):
    - bielizna_qty = days + 1
    - skarpety_qty = days
    - koszulki_tshirty_qty = CEIL(days * 0.8)
    - spodnie_dlugie_qty = CEIL(days / 3)
    - spodnie_krotkie_qty (tylko lato/tropiki) = CEIL(days / 2)
  </Rule>

  <Rule id="clothing_modifiers">
    Zastosuj następujące modyfikatory do ilości ubrań:
    - IF (any child_age < 4): base_clothing_qty *= 1.3;
    - IF (ArchetypPodróży zawiera "trekking" OR "przygoda z plecakiem"): preferuj odzież szybkoschnącą (syntetyczną/merino), dodaj do notatek 'szybkoschnące'.
  </Rule>

  <Rule id="first_aid_kit_module">
    Apteczka musi zawsze zawierać: podstawowe środki opatrunkowe (plastry, gaza, środek do dezynfekcji), leki przeciwbólowe/przeciwgorączkowe, leki na problemy żołądkowe, osobiste leki na receptę (jako placeholder: 'Leki na receptę').
    <Condition check="region" includes="Azja Południowo-Wschodnia,Ameryka Południowa,Afryka Subsaharyjska">
      ADD: Repelent z wysoką zawartością DEET, doustne sole nawadniające (elektrolity), probiotyki.
    </Condition>
    <Condition check="activities" includes="trekking,wędrówka,góry">
      ADD: Plastry na pęcherze, folia NRC, maść przeciwbólowa/rozgrzewająca.
    </Condition>
    <Condition check="childrenAges" exists="true">
      ADD: Termometr cyfrowy, leki przeciwhistaminowe dla dzieci, środek na ukąszenia.
    </Condition>
  </Rule>

  <Rule id="electronics_module">
    Domyślnie: 1x powerbank na rodzinę, 1x ładowarka wieloportowa (np. GaN) z odpowiednimi kablami.
    <Condition check="special" includes="praca zdalna,remote work">
      ADD: Laptop, zasilacz do laptopa, słuchawki z redukcją szumów, przenośna podstawka pod laptopa.
    </Condition>
    <Condition check="region" is_different_than="Europa/UE">
      ADD: Adapter do gniazdek (typ zgodny z regionem), dodaj w notes typ gniazdka jeśli znany.
    </Condition>
  </Rule>

  <Rule id="activity_specific_modules">
    <Condition check="activities" includes="plaża,pływanie,snorkeling">
      ADD: Strój kąpielowy, krem z filtrem UV (min. SPF 30, dla dzieci 50), nakrycie głowy, okulary przeciwsłoneczne, ręcznik szybkoschnący.
      ADD (optional): Buty do wody, worek wodoodporny.
    </Condition>
    <Condition check="activities" includes="trekking,wędrówka,góry">
      ADD: Bielizna termiczna (jeśli sezon != lato), bluza/polar (warstwa środkowa), kurtka softshell/przeciwdeszczowa (warstwa zewnętrzna), czapka i rękawiczki (zależnie od sezonu), latarka czołowa, numer ICE w telefonie (dodaj do checklisty).
    </Condition>
  </Rule>

  <Rule id="cultural_nuances">
    <Condition check="region" includes="Bliski Wschód,Azja Południowa">
      ADD: Lekka chusta/szal (dla kobiet), długie, przewiewne spodnie/spódnica. W notes dodaj: 'Skromny ubiór do zwiedzania miejsc kultu'.
    </Condition>
  </Rule>

  <Rule id="buy_on_arrival_strategy">
    Dla podróży > 7 dni do zurbanizowanych regionów, dla przedmiotów łatwo dostępnych i zajmujących dużo miejsca (np. żel pod prysznic, szampon, krem do opalania, pieluchy), dodaj w polu "notes" sugestię: 'Rozważ zakup na miejscu, aby oszczędzić miejsce.'.
  </Rule>
  <Rule id="language_enforcement">
    Każdy string (zarówno w polu name, notes, category, task, archetype) musi być w ${language}. Jeśli w danych wejściowych pojawiły się inne języki – znormalizuj do ${language}.
  </Rule>
</Rules>

<AutoCorrectionRules>
  <Check id="duplicate_items">
    Przed finalizacją, usuń duplikaty nazw (case-insensitive), łącząc ich ilości lub notatki.
  </Check>
  <Check id="toddler_essentials">
    IF (any child_age < 3) AND (list LACKS 'Mokre chusteczki' OR list LACKS 'Pieluchy' OR list LACKS 'Krem ochronny'): ADD missing items. Ilość pieluch = dni * 5.
  </Check>
  <Check id="shoe_count">
    IF (days < 8) AND (count(category='Obuwie') > 3 per person): Zredukuj ilość, łącząc funkcjonalność butów. Np. zamiast butów trekkingowych i adidasów, zaproponuj jedne 'buty podejściowe'. Zaktualizuj notatki.
  </Check>
  <Check id="airline_liquids">
    IF (transport CONTAINS 'samolot' OR 'lot'): Sprawdź kategorię 'Higiena i Kosmetyki'. Dla wszystkich płynów, dodaj w notes: 'Pojemność do 100ml lub nadaj w bagażu rejestrowanym'.
  </Check>
  <Check id="leave_space">
    W kategorii 'Inne', dodaj pozycję: { "name": "Wolne miejsce w bagażu", "qty": "ok. 10-15%", "notes": "Na zakupy i pamiątki", "category": "Inne", "optional": true }.
  </Check>
</AutoCorrectionRules>

<OutputSchema>
{
  "meta": {
    "destination": "string",
    "days": "number",
    "people": { "adults": "number", "children": "number" },
    "season": "string",
    "archetype": "string"
  },
  "checklist": [
    { "task": "Zeskanuj dokumenty (paszport, wiza) i zapisz w chmurze", "done": false },
    { "task": "Powiadom bank o wyjeździe za granicę", "done": false }
  ],
  "items": [
    { "name": "Paszport", "qty": 1, "category": "Dokumenty i Finanse", "notes": "Sprawdź datę ważności!", "optional": false }
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
): Promise<{ meta: PackingListMeta; items: PackingItem[]; checklist: ChecklistItem[] }> => {
  try {
    const model = getModel();
    const chosenLanguage = language || details.language || 'Polish';
    const result = await model.generateContent(getGeneratePrompt(details, chosenLanguage));

    const response = result.response;
    const jsonText = response.text();
    const parsedList: AIPackingListResponse = JSON.parse(jsonText);

    const itemsWithClientProps = parsedList.items.map((item, index) => ({
      ...item,
      id: Date.now() + index,
      packed: false,
    }));

    const checklistWithClientProps = (parsedList.checklist || []).map((task, index) => ({
      ...task,
      id: Date.now() + 10000 + index,
    }));

    return { meta: parsedList.meta, items: itemsWithClientProps, checklist: checklistWithClientProps };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Błąd podczas generowania listy przez Gemini:', error);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Błąd podczas sprawdzania listy przez Gemini:', error);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Błąd podczas kategoryzacji listy przez Gemini:', error);
    }
    throw new Error('Nie udało się skategoryzować listy. Spróbuj ponownie.');
  }
};
