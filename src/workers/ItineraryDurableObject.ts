import type { SupabaseClient } from '@supabase/supabase-js';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

import type { ItineraryPreferences } from '../types';

import { createAdvancedItineraryPrompt } from '../lib/prompts/itineraryPrompt';

export interface ItineraryGenerationRequest {
  itineraryId: string;
  tripId: string;
  trip: {
    destination: string;
    start_date: string;
    end_date: string;
    budget?: number;
    lodging?: string;
    lodging_lat?: number;
    lodging_lon?: number;
  };
  preferences: ItineraryPreferences & { lodgingCoords?: { lat: number; lon: number } };
  language: string;
  tableName: string;
  userId: string;
}

// Cloudflare Workers types
interface DurableObjectState {
  storage: DurableObjectStorage;
  waitUntil(promise: Promise<any>): void;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  setAlarm(scheduledTime: number): Promise<void>;
  deleteAlarm(): Promise<void>;
  getAlarm(): Promise<number | null>;
}

export interface Env {
  SECRETS: KVNamespace;
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

const MODEL_CANDIDATES = [
  'gemini-2.5-flash', // Fastest and most reliable for production
  'gemini-2.5-pro', // Most powerful but slowest, try last
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
].filter(Boolean) as string[];

export class ItineraryDurableObject {
  private supabase: SupabaseClient | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private ctx: DurableObjectState,
    private env: Env
  ) {}

  private async initializeSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      console.log('[ItineraryDO] Initializing Supabase client...');
      const serviceRoleKey = await this.env.SECRETS.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceRoleKey) {
        console.error('[ItineraryDO] SUPABASE_SERVICE_ROLE_KEY not found in secrets');
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in secrets');
      }
      console.log('[ItineraryDO] Supabase service role key found, creating client');

      this.supabase = createClient(this.env.PUBLIC_SUPABASE_URL, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('[ItineraryDO] Supabase client initialized successfully');
    }
    return this.supabase;
  }

  private async initializeGenAI(): Promise<GoogleGenerativeAI> {
    if (!this.genAI) {
      console.log('[ItineraryDO] Initializing Google AI client...');
      const geminiKey = await this.env.SECRETS.get('GEMINI_API_KEY');
      if (!geminiKey) {
        console.error('[ItineraryDO] GEMINI_API_KEY not found in secrets');
        throw new Error('GEMINI_API_KEY not found in secrets');
      }
      console.log('[ItineraryDO] Gemini API key found, creating AI client');
      this.genAI = new GoogleGenerativeAI(geminiKey);
      console.log('[ItineraryDO] Google AI client initialized successfully');
    }
    return this.genAI;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/generate') {
      return this.handleGenerateRequest(request);
    }

    if (request.method === 'GET' && url.pathname === '/status') {
      return this.handleStatusRequest();
    }

    return new Response('Method not allowed', { status: 405 });
  }

  private async handleGenerateRequest(request: Request): Promise<Response> {
    try {
      const data: ItineraryGenerationRequest = await request.json();

      // Store the generation request and set status to GENERATING
      await this.ctx.storage.put('generation_request', data);
      await this.ctx.storage.put('status', 'GENERATING');
      await this.ctx.storage.put('started_at', Date.now());
      await this.ctx.storage.put('progress', 'Initializing AI generation...');

      // Set an alarm to check for timeout (5 minutes)
      await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);

      // Start generation in background
      this.ctx.waitUntil(this.generateItinerary(data));

      return new Response(
        JSON.stringify({
          message: 'Generation started',
          itineraryId: data.itineraryId,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('[ItineraryDO] Error handling generate request:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to start generation',
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  private async handleStatusRequest(): Promise<Response> {
    try {
      const status = (await this.ctx.storage.get('status')) || 'UNKNOWN';
      const progress = (await this.ctx.storage.get('progress')) || '';
      const startedAt = await this.ctx.storage.get('started_at');
      const completedAt = await this.ctx.storage.get('completed_at');
      const error = await this.ctx.storage.get('error');

      return new Response(
        JSON.stringify({
          status,
          progress,
          startedAt,
          completedAt,
          error,
          duration: completedAt && startedAt ? (completedAt as number) - (startedAt as number) : null,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('[ItineraryDO] Error getting status:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to get status',
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  private async generateItinerary(data: ItineraryGenerationRequest): Promise<void> {
    try {
      console.log(`[ItineraryDO] Starting generation for itinerary: ${data.itineraryId}`);

      await this.ctx.storage.put('progress', 'Initializing AI client...');
      const genAI = await this.initializeGenAI();
      const supabase = await this.initializeSupabase();

      await this.ctx.storage.put('progress', 'Creating AI prompt...');
      const prompt = createAdvancedItineraryPrompt(data.trip, data.preferences, data.language);

      await this.ctx.storage.put('progress', 'Generating itinerary with AI...');
      const startTime = Date.now();

      // Try models in order until one succeeds
      let result = null;
      let modelUsed = '';

      for (const modelName of MODEL_CANDIDATES) {
        try {
          console.log(`[ItineraryDO] Trying model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent(prompt);
          modelUsed = modelName;
          break;
        } catch (modelError) {
          console.warn(`[ItineraryDO] Model ${modelName} failed:`, modelError);
          continue;
        }
      }

      if (!result) {
        throw new Error('All AI models failed to generate content');
      }

      const endTime = Date.now();
      console.log(`[ItineraryDO] AI generation completed in ${endTime - startTime}ms using ${modelUsed}`);

      await this.ctx.storage.put('progress', 'Processing AI response...');
      const response = await result.response;
      const text = response.text();

      // Clean and parse JSON response
      const jsonString = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      let generatedPlan: unknown = null;

      try {
        generatedPlan = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('[ItineraryDO] Failed to parse AI response as JSON:', parseError);
        throw new Error('AI returned invalid JSON response');
      }

      await this.ctx.storage.put('progress', 'Saving to database...');

      // Calculate token usage
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        const usage = (result as any)?.response?.usageMetadata;
        if (usage) {
          inputTokens = usage.promptTokenCount || 0;
          outputTokens = usage.candidatesTokenCount || 0;
        } else {
          // Fallback estimation
          inputTokens = Math.round(prompt.length / 4);
          outputTokens = Math.round(text.length / 4);
        }
      } catch {
        inputTokens = Math.round(prompt.length / 4);
        outputTokens = Math.round(text.length / 4);
      }

      // Update database with completed result
      const { error: updateError } = await supabase
        .from(data.tableName)
        .update({
          generated_plan_json: generatedPlan,
          status: 'COMPLETED',
          input_tokens: inputTokens,
          thought_tokens: outputTokens,
          model_used: modelUsed,
          generation_duration_ms: endTime - startTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.itineraryId);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Update internal status
      await this.ctx.storage.put('status', 'COMPLETED');
      await this.ctx.storage.put('completed_at', Date.now());
      await this.ctx.storage.put('progress', 'Generation completed successfully');

      // Clear the alarm since we completed successfully
      await this.ctx.storage.deleteAlarm();

      console.log(`[ItineraryDO] Successfully completed generation for: ${data.itineraryId}`);
    } catch (error) {
      console.error(`[ItineraryDO] Generation failed for ${data.itineraryId}:`, error);

      // Update status in storage
      await this.ctx.storage.put('status', 'FAILED');
      await this.ctx.storage.put('completed_at', Date.now());
      await this.ctx.storage.put('error', error instanceof Error ? error.message : String(error));

      try {
        // Try to update database with failed status
        const supabase = await this.initializeSupabase();
        await supabase
          .from(data.tableName)
          .update({
            status: 'FAILED',
            error_message: error instanceof Error ? error.message : String(error),
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.itineraryId);
      } catch (dbError) {
        console.error('[ItineraryDO] Failed to update database with error status:', dbError);
      }
    }
  }

  // Alarm handler for timeout management
  async alarm(): Promise<void> {
    try {
      const status = await this.ctx.storage.get('status');

      if (status === 'GENERATING') {
        console.warn('[ItineraryDO] Generation timed out, marking as failed');

        await this.ctx.storage.put('status', 'FAILED');
        await this.ctx.storage.put('completed_at', Date.now());
        await this.ctx.storage.put('error', 'Generation timed out after 5 minutes');

        // Try to update database
        try {
          const data = (await this.ctx.storage.get('generation_request')) as ItineraryGenerationRequest;
          if (data) {
            const supabase = await this.initializeSupabase();
            await supabase
              .from(data.tableName)
              .update({
                status: 'FAILED',
                error_message: 'Generation timed out',
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.itineraryId);
          }
        } catch (dbError) {
          console.error('[ItineraryDO] Failed to update database on timeout:', dbError);
        }
      }
    } catch (error) {
      console.error('[ItineraryDO] Error in alarm handler:', error);
    }
  }
}

// Export for Cloudflare Workers
export { ItineraryDurableObject as default };
