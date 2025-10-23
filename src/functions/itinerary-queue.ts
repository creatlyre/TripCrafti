import type { MessageBatch } from '@cloudflare/workers-types';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

import type { ItineraryPreferences } from '../types';

import { createAdvancedItineraryPrompt } from '../lib/prompts/itineraryPrompt';
import { getSecret, primeGlobalSecret } from '../lib/secrets';

interface QueueMessage {
  itineraryId: string;
  tripId: string;
  trip: { destination: string; start_date: string; end_date: string };
  preferences: ItineraryPreferences;
  language: string;
  tableName: string;
}

interface Env {
  SECRETS: unknown; // KV namespace
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_ANON_KEY: string;
  GEMINI_API_KEY?: string;
  [key: string]: string | unknown | undefined; // Index signature for compatibility
}

// Lazy init so we can validate presence of key inside handler (better error reporting)
let genAI: GoogleGenerativeAI | null = null;
async function getGenAI(env: Env) {
  if (!genAI) {
    const key = await getSecret('GEMINI_API_KEY', {
      runtimeEnv: env as Record<string, string | undefined>,
      kv: env.SECRETS as { get: (key: string) => Promise<string | null> },
    });
    if (!key) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }
    primeGlobalSecret('GEMINI_API_KEY', key);
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// Ordered list of candidate model names. Prioritize faster models for queue processing.
const MODEL_CANDIDATES = [
  'gemini-2.5-flash', // Fastest model first
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro', // Most powerful but slowest, try last
];

let resolvedModel: string | null = null; // cache the first working model for subsequent requests

function withTimeout<T>(p: Promise<T>, ms: number, label = 'Timeout'): Promise<T> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-console
    console.log(`[queue-worker] Setting timeout for ${label}: ${ms}ms`);

    const t = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(`[queue-worker] TIMEOUT: ${label} exceeded ${ms}ms`);
      reject(new Error(`${label} (${ms}ms)`));
    }, ms);

    p.then((v) => {
      // eslint-disable-next-line no-console
      console.log(`[queue-worker] ${label} completed successfully`);
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(`[queue-worker] ${label} failed:`, e);
      clearTimeout(t);
      reject(e);
    });
  });
}

async function generateWithFallback(genAIInstance: GoogleGenerativeAI, prompt: string) {
  if (resolvedModel) {
    // eslint-disable-next-line no-console
    console.log('[queue-worker] Using cached model', resolvedModel);
    const model = genAIInstance.getGenerativeModel({ model: resolvedModel });
    return {
      modelName: resolvedModel,
      result: await withTimeout(model.generateContent(prompt), 180000, 'ModelTimeout'),
    };
  }
  let lastError: unknown = null;
  for (const candidate of MODEL_CANDIDATES) {
    try {
      // eslint-disable-next-line no-console
      console.log('[queue-worker] Trying model', candidate);
      const model = genAIInstance.getGenerativeModel({ model: candidate });

      // eslint-disable-next-line no-console
      console.log('[queue-worker] Model instance created, starting generation with timeout 180s...');
      // eslint-disable-next-line no-console
      console.log('[queue-worker] About to call model.generateContent() - this is the critical step');
      
      const startTime = Date.now();

      // Use 3-minute timeout for queue processing
      const result = await withTimeout(model.generateContent(prompt), 180000, 'ModelTimeout');

      const endTime = Date.now();
      // eslint-disable-next-line no-console
      console.log('[queue-worker] model.generateContent() call completed successfully');
      // eslint-disable-next-line no-console
      console.log('[queue-worker] Model generation completed in', endTime - startTime, 'ms');

      resolvedModel = candidate; // cache on first success
      return { modelName: candidate, result };
    } catch (e: unknown) {
      lastError = e;
      const errorMessage = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn('[queue-worker] Model failed', candidate, errorMessage);
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

async function generateItinerary(message: QueueMessage, env: Env) {
  const { itineraryId, trip, preferences, language, tableName } = message;

  // Progress tracking
  let lastProgressTime = Date.now();
  const logProgress = (step: string, details?: string | Record<string, unknown>) => {
    const now = Date.now();
    const elapsed = now - lastProgressTime;
    // eslint-disable-next-line no-console
    console.log(`[queue-worker] PROGRESS [${step}] (+${elapsed}ms) for ${itineraryId}`, details || '');
    lastProgressTime = now;
  };

  // Create Supabase client
  const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);

  try {
    logProgress('INIT', 'Starting queue-based generation process');

    // eslint-disable-next-line no-console
    console.log('[queue-worker] Starting generation for itinerary:', itineraryId);
    // eslint-disable-next-line no-console
    console.log('[queue-worker] Trip details:', {
      destination: trip.destination,
      dates: `${trip.start_date} to ${trip.end_date}`,
    });
    // eslint-disable-next-line no-console
    console.log('[queue-worker] Preferences:', {
      interests: preferences.interests?.length || 0,
      travelStyle: preferences.travelStyle,
      budget: preferences.budget,
      language: preferences.language,
    });

    logProgress('GENAI_INIT', 'Creating GenAI instance');
    const genAIInstance = await getGenAI(env);
    // eslint-disable-next-line no-console
    console.log('[queue-worker] GenAI instance created successfully');

    logProgress('PROMPT_CREATE', 'Creating AI prompt');
    const prompt = createAdvancedItineraryPrompt(trip, preferences, language);
    logProgress('PROMPT_READY', `Prompt created, length: ${prompt.length} characters`);

    logProgress('AI_GENERATION_START', 'Starting model generation');
    // eslint-disable-next-line no-console
    console.time('[queue-worker] total_generation');
    // eslint-disable-next-line no-console
    console.log('[queue-worker] Starting model generation...');

    const startGenTime = Date.now();
    const { modelName, result } = await generateWithFallback(genAIInstance, prompt);
    const endGenTime = Date.now();
    logProgress('AI_GENERATION_COMPLETE', `Model ${modelName} completed in ${endGenTime - startGenTime}ms`);

    logProgress('RESPONSE_EXTRACT', 'Extracting response content');
    const response = await result.response;

    const startTextTime = Date.now();
    const text = response.text();
    const endTextTime = Date.now();
    logProgress('TEXT_EXTRACT', `Text extracted in ${endTextTime - startTextTime}ms, length: ${text.length} chars`);

    // Clean the response to get valid JSON
    logProgress('JSON_PARSE', 'Cleaning and parsing response');
    const jsonString = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let generatedPlan: unknown = null;
    try {
      generatedPlan = JSON.parse(jsonString);
      logProgress('JSON_PARSED', 'JSON parsed successfully');
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed to parse model JSON response', { raw: text.slice(0, 400) });
      throw new Error('ModelReturnedInvalidJSON');
    }

    // Calculate token usage
    logProgress('TOKEN_CALC', 'Calculating token usage');
    let inputTokens = 0;
    let thoughtTokens = 0;
    try {
      interface GeminiUsageMeta {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
        thoughtsTokenCount?: number;
        prompt_tokens?: number;
      }
      const usage =
        (result as unknown as { response?: { usageMetadata?: GeminiUsageMeta } })?.response?.usageMetadata ||
        (response as unknown as { usageMetadata?: GeminiUsageMeta })?.usageMetadata;
      if (usage) {
        inputTokens = usage.promptTokenCount ?? usage.prompt_tokens ?? 0;
        thoughtTokens = usage.thoughtsTokenCount ?? usage.candidatesTokenCount ?? 0;
      } else {
        inputTokens = Math.round(prompt.length / 4);
        thoughtTokens = Math.round(text.length / 4);
      }
    } catch {
      inputTokens = Math.round(prompt.length / 4);
      thoughtTokens = Math.round(text.length / 4);
    }

    logProgress('DB_UPDATE_START', `Generated plan size: ${JSON.stringify(generatedPlan).length} chars`);

    const startDbTime = Date.now();
    const updateResult = await supabase
      .from(tableName)
      .update({
        generated_plan_json: generatedPlan,
        status: 'COMPLETED',
        input_tokens: inputTokens,
        thought_tokens: thoughtTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itineraryId);

    const endDbTime = Date.now();
    logProgress('DB_UPDATE_COMPLETE', `Database update completed in ${endDbTime - startDbTime}ms`);

    // eslint-disable-next-line no-console
    console.timeEnd('[queue-worker] total_generation');

    if (updateResult.error) {
      // eslint-disable-next-line no-console
      console.error('[queue-worker] Failed to update itinerary after generation', updateResult.error);
      throw new Error(`Database update failed: ${updateResult.error.message}`);
    } else {
      logProgress('GENERATION_SUCCESS', 'Successfully completed itinerary generation');
      // eslint-disable-next-line no-console
      console.log('[queue-worker] Successfully completed itinerary generation for:', itineraryId);
    }
  } catch (error) {
    logProgress('GENERATION_ERROR', `Error: ${error instanceof Error ? error.message : String(error)}`);
    // eslint-disable-next-line no-console
    console.error('[queue-worker] Error generating itinerary for:', itineraryId);
    // eslint-disable-next-line no-console
    console.error('[queue-worker] Error details:', error);

    // Update status to FAILED
    const failUpdate = await supabase
      .from(tableName)
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', itineraryId);

    if (failUpdate.error) {
      // eslint-disable-next-line no-console
      console.error('[queue-worker] Failed to mark FAILED', failUpdate.error);
    } else {
      // eslint-disable-next-line no-console
      console.log('[queue-worker] Successfully marked itinerary as FAILED:', itineraryId);
    }

    throw error; // Re-throw to mark the queue message as failed
  }
}

// Queue consumer handler
export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        // eslint-disable-next-line no-console
        console.log('[queue-worker] Processing queue message:', message.id);
        await generateItinerary(message.body, env);
        // eslint-disable-next-line no-console
        console.log('[queue-worker] Successfully processed message:', message.id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[queue-worker] Failed to process message:', message.id, error);
        // The message will be retried automatically by Cloudflare Queues
        throw error;
      }
    }
  },
};