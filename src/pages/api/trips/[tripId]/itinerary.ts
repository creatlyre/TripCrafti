import type { APIRoute } from "astro";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdvancedItineraryPrompt } from "../../../../lib/prompts/itineraryPrompt";
import type { ItineraryPreferences } from "../../../../types";

export const prerender = false;

const preferencesSchema = z.object({
  interests: z.array(z.string()),
  travelStyle: z.enum(["Relaxed", "Balanced", "Intense"]),
  budget: z.string(),
  language: z.string().min(2),
});

// Lazy init so we can validate presence of key inside handler (better error reporting)
let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI) {
    const key = import.meta.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// Ordered list of candidate model names. You can override the first one with GEMINI_MODEL env var.
// We'll try them in order until one succeeds. This mitigates naming differences across SDK versions.
const MODEL_CANDIDATES = [
  import.meta.env.GEMINI_MODEL as string | undefined,
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
].filter(Boolean) as string[];

let resolvedModel: string | null = null; // cache the first working model for subsequent requests

function withTimeout<T>(p: Promise<T>, ms: number, label = 'Timeout'): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); });
  });
}

async function generateWithFallback(genAIInstance: GoogleGenerativeAI, prompt: string) {
  if (resolvedModel) {
    console.log('[itinerary-ai] Using cached model', resolvedModel);
    const model = genAIInstance.getGenerativeModel({ model: resolvedModel });
    return { modelName: resolvedModel, result: await withTimeout(model.generateContent(prompt), 60000, 'ModelTimeout') };
  }
  let lastError: any = null;
  for (const candidate of MODEL_CANDIDATES) {
    try {
      console.log('[itinerary-ai] Trying model', candidate);
      const model = genAIInstance.getGenerativeModel({ model: candidate });
      const result = await withTimeout(model.generateContent(prompt), 60000, 'ModelTimeout');
      resolvedModel = candidate; // cache on first success
      return { modelName: candidate, result };
    } catch (e: any) {
      lastError = e;
      console.warn('[itinerary-ai] Model failed', candidate, e?.message || e);
      continue;
    }
  }
  throw new Error('AllModelsFailed: ' + MODEL_CANDIDATES.join(', ') + ' lastError=' + (lastError?.message || lastError));
}

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : init.status,
    headers: { "content-type": "application/json" },
    ...(typeof init === "object" ? init : {}),
  });
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { tripId } = params;
  const { supabase } = locals;

  if (!tripId) {
    return json({ error: "Trip ID is required" }, 400);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  // 1. Validate user preferences from request body (with safe JSON parse)
  let preferences: ItineraryPreferences;
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      return json({ error: "InvalidJSON", details: "Request body is not valid JSON" }, 400);
    }
    preferences = preferencesSchema.parse(body);
  } catch (e) {
    const error = e as { issues?: unknown; message: string };
    return json({ error: "ValidationError", details: error.issues ?? error.message }, 400);
  }

  // 2. Verify trip ownership and get trip details
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("destination, start_date, end_date, budget")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .single();

  if (tripError || !trip) {
    return json({ error: "Trip not found or you do not have access." }, 404);
  }

  // 3. Determine final budget and create final preferences object
  const finalBudget = trip.budget ? String(trip.budget) : preferences.budget;
  const finalPreferences: ItineraryPreferences = {
    ...preferences,
    budget: finalBudget,
  };

  try {
  // 4. Create a record in itinerary table (single canonical lowercase name)
  const tableToUse = "generateditineraries";

    const { data: itineraryRecord, error: insertError } = await supabase
      .from(tableToUse)
      .insert({
        trip_id: tripId,
        preferences_json: finalPreferences,
        status: "GENERATING",
      })
      .select("id")
      .single();

    if (insertError || !itineraryRecord) {
      console.error("generateditineraries insert error", insertError);
      return json({ error: "InsertFailed", details: insertError?.message, hint: insertError?.hint, code: insertError?.code }, 500);
    }

    const itineraryId = itineraryRecord.id;

    // 5. Asynchronously generate itinerary
    generateItinerary({
      itineraryId,
      trip,
      preferences: finalPreferences,
      supabase,
      language: finalPreferences.language,
      tableName: tableToUse
    })
      .catch(err => {
        console.error("generateItinerary top-level rejection", err);
      });

    // Immediately return a response to the client
    return json({ message: "Itinerary generation started.", itineraryId }, 202);
  } catch (err: any) {
    const msg = err?.message || String(err);
    return json({ error: "UnhandledServerError", details: msg }, 500);
  }
};

interface GenerateArgs {
  itineraryId: string;
  trip: { destination: string; start_date: string; end_date: string };
  preferences: ItineraryPreferences;
  supabase: SupabaseClient;
  language: string;
  tableName: string;
}

async function generateItinerary({ itineraryId, trip, preferences, supabase, language, tableName }: GenerateArgs) {
  try {
  const genAIInstance = getGenAI();
  const prompt = createAdvancedItineraryPrompt(trip, preferences, language);

  console.time('[itinerary-ai] total_generation');
  const { modelName, result } = await generateWithFallback(genAIInstance, prompt);
  const response = await result.response;
  console.log('[itinerary-ai] Model success', modelName);
    const text = response.text();

    // Clean the response to get valid JSON
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let generatedPlan: any = null;
    try {
      generatedPlan = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("Failed to parse model JSON response", { raw: text.slice(0, 400) });
      throw new Error("ModelReturnedInvalidJSON");
    }

    // Basic token estimation (SDK may expose usage metrics in future; placeholder logic)
    // We'll approximate: input tokens ~ prompt length / 4, output tokens ~ response text length / 4
    const inputTokens = Math.round(prompt.length / 4);
    const thoughtTokens = Math.round(text.length / 4);

    const updateOk = await supabase
      .from(tableName)
      .update({
        generated_plan_json: generatedPlan,
        status: "COMPLETED",
        input_tokens: inputTokens,
        thought_tokens: thoughtTokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itineraryId);
    console.timeEnd('[itinerary-ai] total_generation');
    if (updateOk.error) {
      console.error('[itinerary-ai] Failed to update itinerary after generation', updateOk.error);
    }

  } catch (error) {
    console.error("Error generating itinerary:", error);
    const failUpdate = await supabase
      .from(tableName)
      .update({
        status: "FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", itineraryId);
    if (failUpdate.error) {
      console.error('[itinerary-ai] Failed to mark FAILED', failUpdate.error);
    }
  }
}
