import type { SupabaseClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

import type { ItineraryPreferences } from '../../../../types';

import { geocode } from '../../../../lib/geocoding';
import { createAdvancedItineraryPrompt } from '../../../../lib/prompts/itineraryPrompt';
import { getSecret, primeGlobalSecret } from '../../../../lib/secrets';

export const prerender = false;

const preferencesSchema = z.object({
  interests: z.array(z.string()),
  travelStyle: z.enum(['Relaxed', 'Balanced', 'Intense']),
  budget: z.string(),
  language: z.string().min(2),
  adultsCount: z.number().int().min(1).max(20).optional(),
  kidsCount: z.number().int().min(0).max(20).optional(),
  kidsAges: z.array(z.number().int().min(0).max(17)).optional(),
  hotelNameOrUrl: z.string().max(300).optional(),
  maxTravelDistanceKm: z.number().int().min(1).max(500).optional(),
});

// Lazy init so we can validate presence of key inside handler (better error reporting)
let genAI: GoogleGenerativeAI | null = null;
async function getGenAI(runtimeEnv?: Record<string, string | undefined>) {
  if (!genAI) {
    // Use the same pattern as packing endpoint for consistent key resolution
    const key = await getSecret('GEMINI_API_KEY', {
      runtimeEnv,
      kv: undefined,
    });
    if (!key) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }
    primeGlobalSecret('GEMINI_API_KEY', key);
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
  'gemini-2.0-flash-lite',
].filter(Boolean) as string[];

let resolvedModel: string | null = null; // cache the first working model for subsequent requests

function withTimeout<T>(p: Promise<T>, ms: number, label = 'Timeout'): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

async function generateWithFallback(genAIInstance: GoogleGenerativeAI, prompt: string) {
  if (resolvedModel) {
    // eslint-disable-next-line no-console
    console.log('[itinerary-ai] Using cached model', resolvedModel);
    const model = genAIInstance.getGenerativeModel({ model: resolvedModel });
    return {
      modelName: resolvedModel,
      result: await withTimeout(model.generateContent(prompt), 120000, 'ModelTimeout'),
    };
  }
  let lastError: unknown = null;
  for (const candidate of MODEL_CANDIDATES) {
    try {
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Trying model', candidate);
      const model = genAIInstance.getGenerativeModel({ model: candidate });

      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Model instance created, starting generation with timeout 120s...');
      const startTime = Date.now();

      const result = await withTimeout(model.generateContent(prompt), 120000, 'ModelTimeout');

      const endTime = Date.now();
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Model generation completed in', endTime - startTime, 'ms');

      resolvedModel = candidate; // cache on first success
      return { modelName: candidate, result };
    } catch (e: unknown) {
      lastError = e;
      const errorMessage = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn('[itinerary-ai] Model failed', candidate, errorMessage);
      continue;
    }
  }
  throw new Error(
    'AllModelsFailed: ' +
      MODEL_CANDIDATES.join(', ') +
      ' lastError=' +
      (lastError instanceof Error ? lastError.message : lastError)
  );
}

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { tripId } = params;
  const { supabase } = locals;

  if (!tripId) {
    return json({ error: 'Trip ID is required' }, 400);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // 1. Validate user preferences from request body (with safe JSON parse)
  let preferences: ItineraryPreferences;
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      return json({ error: 'InvalidJSON', details: 'Request body is not valid JSON' }, 400);
    }
    preferences = preferencesSchema.parse(body);
  } catch (e) {
    const error = e as { issues?: unknown; message: string };
    return json({ error: 'ValidationError', details: error.issues ?? error.message }, 400);
  }

  // 2. Verify trip ownership and get trip details
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('destination, start_date, end_date, budget, lodging, lodging_lat, lodging_lon')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single();

  if (tripError || !trip) {
    return json({ error: 'Trip not found or you do not have access.' }, 404);
  }

  // 3. Determine final budget and create final preferences object
  const finalBudget = trip.budget ? String(trip.budget) : preferences.budget;
  const finalPreferences: ItineraryPreferences & { lodgingCoords?: { lat: number; lon: number } } = {
    ...preferences,
    budget: finalBudget,
  };

  // If lodging info present, attempt geocode (fire & forget but await with timeout)
  if (preferences.hotelNameOrUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const geo = await geocode(
        `${preferences.hotelNameOrUrl} ${preferences?.interests?.length ? '' : trip.destination}`
      );
      clearTimeout(timeout);
      if (geo) {
        finalPreferences.lodgingCoords = { lat: geo.lat, lon: geo.lon };
        // If trip doesn't yet have lodging stored, update it (best-effort, non-blocking)
        if (!trip.lodging) {
          supabase
            .from('trips')
            .update({ lodging: preferences.hotelNameOrUrl, lodging_lat: geo.lat, lodging_lon: geo.lon })
            .eq('id', tripId)
            .then((r) => {
              if (r.error) console.warn('[itinerary] failed to backfill lodging on trip', r.error.message);
            });
        }
      }
    } catch (e) {
      console.warn('[itinerary] geocode failed', e);
    }
  }

  try {
    // 4. Create a record in itinerary table (single canonical lowercase name)
    const tableToUse = 'generateditineraries';

    const { data: itineraryRecord, error: insertError } = await supabase
      .from(tableToUse)
      .insert({
        trip_id: tripId,
        preferences_json: finalPreferences,
        status: 'GENERATING',
      })
      .select('id')
      .single();

    if (insertError || !itineraryRecord) {
      console.error('generateditineraries insert error', insertError);
      return json(
        { error: 'InsertFailed', details: insertError?.message, hint: insertError?.hint, code: insertError?.code },
        500
      );
    }

    const itineraryId = itineraryRecord.id;

    // 5. Asynchronously generate itinerary
    generateItinerary({
      itineraryId,
      trip,
      preferences: finalPreferences,
      supabase,
      language: finalPreferences.language,
      tableName: tableToUse,
      runtimeEnv: locals.runtime?.env,
    }).catch((err) => {
      console.error('generateItinerary top-level rejection', err);
    });

    // Immediately return a response to the client
    return json({ message: 'Itinerary generation started.', itineraryId }, 202);
  } catch (err: any) {
    const msg = err?.message || String(err);
    return json({ error: 'UnhandledServerError', details: msg }, 500);
  }
};

interface GenerateArgs {
  itineraryId: string;
  trip: { destination: string; start_date: string; end_date: string };
  preferences: ItineraryPreferences;
  supabase: SupabaseClient;
  language: string;
  tableName: string;
  runtimeEnv?: Record<string, string | undefined>;
}

async function generateItinerary({
  itineraryId,
  trip,
  preferences,
  supabase,
  language,
  tableName,
  runtimeEnv,
}: GenerateArgs) {
  try {
    console.log('[itinerary-ai] Starting generation for itinerary:', itineraryId);
    console.log('[itinerary-ai] Trip details:', {
      destination: trip.destination,
      dates: `${trip.start_date} to ${trip.end_date}`,
    });
    console.log('[itinerary-ai] Preferences:', {
      interests: preferences.interests?.length || 0,
      travelStyle: preferences.travelStyle,
      budget: preferences.budget,
      language: preferences.language,
    });

    const genAIInstance = await getGenAI(runtimeEnv);
    console.log('[itinerary-ai] GenAI instance created successfully');

    const prompt = createAdvancedItineraryPrompt(trip, preferences, language);
    console.log('[itinerary-ai] Prompt created, length:', prompt.length, 'characters');

    console.time('[itinerary-ai] total_generation');
    console.log('[itinerary-ai] Starting model generation...');

    const { modelName, result } = await generateWithFallback(genAIInstance, prompt);
    console.log('[itinerary-ai] Model generation completed with:', modelName);

    console.log('[itinerary-ai] Extracting response...');
    const response = await result.response;
    console.log('[itinerary-ai] Response extracted, getting text...');

    const text = response.text();
    console.log('[itinerary-ai] Text extracted, length:', text.length, 'characters');

    // Clean the response to get valid JSON
    // eslint-disable-next-line no-console
    console.log('[itinerary-ai] Cleaning response text...');
    const jsonString = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // eslint-disable-next-line no-console
    console.log('[itinerary-ai] Cleaned JSON string length:', jsonString.length);

    let generatedPlan: unknown = null;
    try {
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Parsing JSON...');
      generatedPlan = JSON.parse(jsonString);
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] JSON parsed successfully');
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed to parse model JSON response', { raw: text.slice(0, 400) });
      throw new Error('ModelReturnedInvalidJSON');
    }

    // Prefer official usage metadata if available; fall back to rough estimates.
    // Gemini SDK (>= mid 2025) returns usageMetadata with token counts including thoughts.
    // Example structure:
    // result.response.candidates[0]. ... AND result.response.usageMetadata = {
    //   promptTokenCount, candidatesTokenCount, totalTokenCount, thoughtsTokenCount }
    // eslint-disable-next-line no-console
    console.log('[itinerary-ai] Calculating token usage...');
    let inputTokens = 0;
    let thoughtTokens = 0;
    try {
      interface GeminiUsageMeta {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
        thoughtsTokenCount?: number; // newer field
        prompt_tokens?: number; // legacy fallback
      }
      const usage =
        (result as unknown as { response?: { usageMetadata?: GeminiUsageMeta } })?.response?.usageMetadata ||
        (response as unknown as { usageMetadata?: GeminiUsageMeta })?.usageMetadata;
      if (usage) {
        inputTokens = usage.promptTokenCount ?? usage.prompt_tokens ?? 0;
        thoughtTokens = usage.thoughtsTokenCount ?? usage.candidatesTokenCount ?? 0;
        // eslint-disable-next-line no-console
        console.log('[itinerary-ai] Using official token counts:', { inputTokens, thoughtTokens });
      } else {
        inputTokens = Math.round(prompt.length / 4);
        thoughtTokens = Math.round(text.length / 4);
        // eslint-disable-next-line no-console
        console.log('[itinerary-ai] Using estimated token counts:', { inputTokens, thoughtTokens });
      }
    } catch {
      inputTokens = Math.round(prompt.length / 4);
      thoughtTokens = Math.round(text.length / 4);
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Using fallback token counts:', { inputTokens, thoughtTokens });
    }

    // eslint-disable-next-line no-console
    console.log('[itinerary-ai] Updating database record...');
    const updateOk = await supabase
      .from(tableName)
      .update({
        generated_plan_json: generatedPlan,
        status: 'COMPLETED',
        input_tokens: inputTokens,
        thought_tokens: thoughtTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itineraryId);

    // eslint-disable-next-line no-console
    console.timeEnd('[itinerary-ai] total_generation');

    if (updateOk.error) {
      // eslint-disable-next-line no-console
      console.error('[itinerary-ai] Failed to update itinerary after generation', updateOk.error);
    } else {
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Successfully completed itinerary generation for:', itineraryId);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[itinerary-ai] Error generating itinerary for:', itineraryId);
    // eslint-disable-next-line no-console
    console.error('[itinerary-ai] Error details:', error);

    // eslint-disable-next-line no-console
    console.log('[itinerary-ai] Updating status to FAILED...');
    const failUpdate = await supabase
      .from(tableName)
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itineraryId);
    if (failUpdate.error) {
      // eslint-disable-next-line no-console
      console.error('[itinerary-ai] Failed to mark FAILED', failUpdate.error);
    } else {
      // eslint-disable-next-line no-console
      console.log('[itinerary-ai] Successfully marked itinerary as FAILED:', itineraryId);
    }
  }
}
