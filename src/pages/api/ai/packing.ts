import type { APIContext } from 'astro';

import { z } from 'zod';

import type { SupabaseClientType } from '@/lib/supabase';
import type { PackingItem } from '@/types';

import { logDebug, logError } from '@/lib/log';
import { AIPackingActionSchema } from '@/lib/schemas/packingSchemas';
import { getSecret, primeGlobalSecret } from '@/lib/secrets';
import { generatePackingList, validatePackingList, categorizePackingList } from '@/lib/services/geminiService';

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  try {
    const body = await request.json();
    logDebug('/api/ai/packing request received', { keys: Object.keys(body || {}) });

    // Ensure Gemini key is available via global fallback if runtime provided it
    // Resolve Gemini key early (may seed global for downstream service lazy resolution)
    const geminiKey = await getSecret('GEMINI_API_KEY', {
      runtimeEnv: locals.runtime?.env,
      kv: undefined, // KV binding exposed separately - left undefined unless direct binding passed
    });
    primeGlobalSecret('GEMINI_API_KEY', geminiKey);

    // Validate the request body
    const validatedBody = AIPackingActionSchema.parse(body);
    const { action, payload } = validatedBody;

    logDebug('/api/ai/packing action', { action });
    switch (action) {
      case 'generate': {
        if (!payload.details) {
          return new Response(JSON.stringify({ error: 'Details are required for generate action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Determine target language: prefer explicit details.language else derive from Accept-Language header (pl/en fallback)
        const acceptLang = request.headers.get('accept-language') || '';
        const headerLang = /pl/i.test(acceptLang) ? 'Polish' : /en/i.test(acceptLang) ? 'English' : 'Polish';
        const targetLanguage = payload.details.language || headerLang;
        logDebug('Generating packing list', { targetLanguage });
        const generatedList = await generatePackingList(payload.details, targetLanguage);
        logDebug('Packing list generated', {
          items: generatedList.items.length,
          checklist: generatedList.checklist.length,
        });

        // Persist token usage if tripId provided and we have supabase in locals
        if (payload.tripId && locals?.supabase) {
          try {
            // Narrow supabase type minimally to the methods we use; avoid 'any'
            // Narrow to Supabase client (locals augmentation done in middleware)
            const supabase = locals.supabase as unknown as SupabaseClientType;
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              // Ensure trip belongs to user before updating
              const { data: tripCheck } = await supabase
                .from('trips')
                .select('id')
                .eq('id', payload.tripId)
                .eq('user_id', user.id)
                .single();
              if (tripCheck) {
                const usage = generatedList.usage || {};
                if (
                  usage.inputTokens !== undefined ||
                  usage.outputTokens !== undefined ||
                  usage.totalTokens !== undefined ||
                  usage.thoughtTokens !== undefined
                ) {
                  // Fetch existing token totals (nullable columns)
                  const { data: existingTrip } = await supabase
                    .from('trips')
                    .select(
                      'packing_ai_input_tokens, packing_ai_output_tokens, packing_ai_total_tokens, packing_ai_thought_tokens'
                    )
                    .eq('id', payload.tripId)
                    .single();

                  const currentInput = existingTrip?.packing_ai_input_tokens || 0;
                  const currentOutput = existingTrip?.packing_ai_output_tokens || 0;
                  const currentTotal = existingTrip?.packing_ai_total_tokens || 0;
                  const currentThought = existingTrip?.packing_ai_thought_tokens || 0;

                  await supabase
                    .from('trips')
                    .update({
                      packing_ai_input_tokens:
                        usage.inputTokens !== undefined ? currentInput + usage.inputTokens : currentInput,
                      packing_ai_output_tokens:
                        usage.outputTokens !== undefined ? currentOutput + usage.outputTokens : currentOutput,
                      packing_ai_total_tokens:
                        usage.totalTokens !== undefined ? currentTotal + usage.totalTokens : currentTotal,
                      packing_ai_thought_tokens:
                        usage.thoughtTokens !== undefined ? currentThought + usage.thoughtTokens : currentThought,
                    })
                    .eq('id', payload.tripId);
                }
              }
            }
          } catch (persistErr) {
            // Silently ignore persistence issues (non-blocking)
            void persistErr;
          }
        }

        return new Response(JSON.stringify(generatedList), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'validate': {
        if (!payload.currentList) {
          return new Response(JSON.stringify({ error: 'Current list is required for validate action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const normalizedCurrent: PackingItem[] = payload.currentList.map((raw: unknown, idx: number) => {
          const i = raw as Partial<PackingItem> & Record<string, unknown>;
          return {
            name: String(i.name),
            qty: typeof i.qty === 'number' || typeof i.qty === 'string' ? i.qty : '1',
            category: String(i.category || 'Inne'),
            notes: typeof i.notes === 'string' ? i.notes : undefined,
            optional: typeof i.optional === 'boolean' ? i.optional : false,
            packed: typeof i.packed === 'boolean' ? i.packed : false,
            id: typeof i.id === 'number' ? i.id : idx + 1,
          };
        });
        logDebug('Validating packing list', { count: normalizedCurrent.length });
        const validationResult = await validatePackingList(normalizedCurrent, payload.changes || {});
        return new Response(JSON.stringify(validationResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'categorize': {
        if (!payload.items || !payload.categories) {
          return new Response(JSON.stringify({ error: 'Items and categories are required for categorize action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const normalizedItems: PackingItem[] = payload.items.map((raw: unknown, idx: number) => {
          const i = raw as Partial<PackingItem> & Record<string, unknown>;
          return {
            name: String(i.name),
            qty: typeof i.qty === 'number' || typeof i.qty === 'string' ? i.qty : '1',
            category: String(i.category || 'Inne'),
            notes: typeof i.notes === 'string' ? i.notes : undefined,
            optional: typeof i.optional === 'boolean' ? i.optional : false,
            packed: typeof i.packed === 'boolean' ? i.packed : false,
            id: typeof i.id === 'number' ? i.id : idx + 1,
          };
        });
        logDebug('Categorizing packing list', {
          items: normalizedItems.length,
          categories: payload.categories.length,
        });
        const categorizationResult = await categorizePackingList(normalizedItems, payload.categories);
        return new Response(JSON.stringify(categorizationResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    logError('Error in /api/ai/packing', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'An internal server error occurred.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
