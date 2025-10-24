import type { APIRoute } from 'astro';

import { z } from 'zod';

export const prerender = false;

const statusSchema = z.object({
  itineraryId: z.string().uuid(),
});

// Types for Durable Object
interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {}

interface DurableObjectStub {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase } = locals;

  // Get itinerary ID from query parameters
  const itineraryId = url.searchParams.get('itineraryId');

  if (!itineraryId) {
    return json({ error: 'Missing itineraryId parameter' }, 400);
  }

  try {
    statusSchema.parse({ itineraryId });
  } catch {
    return json({ error: 'Invalid itineraryId format' }, 400);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  try {
    // Get the itinerary status - include trip ownership check
    const { data: itinerary, error } = await supabase
      .from('generateditineraries')
      .select(
        `
        id,
        status,
        generated_plan_json,
        input_tokens,
        thought_tokens,
        created_at,
        updated_at,
        trips!inner(user_id)
      `
      )
      .eq('id', itineraryId)
      .eq('trips.user_id', user.id)
      .single();

    if (error || !itinerary) {
      return json({ error: 'Itinerary not found or access denied' }, 404);
    }

    // If status is still GENERATING, try to get more detailed status from Durable Object
    let durableObjectProgress = null;
    if (itinerary.status === 'GENERATING') {
      try {
        const runtimeEnv = locals.runtime?.env as Record<string, unknown>;
        const durableObjectNamespace = runtimeEnv?.ITINERARY_GENERATOR as DurableObjectNamespace | undefined;

        if (durableObjectNamespace) {
          const durableObjectId = durableObjectNamespace.idFromName(itineraryId);
          const durableObjectStub = durableObjectNamespace.get(durableObjectId);

          const doResponse = await durableObjectStub.fetch('https://itinerary-do/status', {
            method: 'GET',
          });

          if (doResponse.ok) {
            durableObjectProgress = await doResponse.json();
          }
        }
      } catch (doError) {
        // eslint-disable-next-line no-console
        console.warn('[status] Failed to get Durable Object status:', doError);
        // Continue with database status only
      }
    }

    // Return status with progress information
    const response = {
      id: itinerary.id,
      status: itinerary.status,
      createdAt: itinerary.created_at,
      updatedAt: itinerary.updated_at,
      ...(durableObjectProgress && {
        progress: durableObjectProgress.progress,
        durableObjectStatus: durableObjectProgress.status,
        startedAt: durableObjectProgress.startedAt,
        duration: durableObjectProgress.duration,
      }),
      ...(itinerary.status === 'COMPLETED' && {
        generatedPlan: itinerary.generated_plan_json,
        inputTokens: itinerary.input_tokens,
        thoughtTokens: itinerary.thought_tokens,
      }),
    };

    return json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: 'Failed to get itinerary status', details: msg }, 500);
  }
};
