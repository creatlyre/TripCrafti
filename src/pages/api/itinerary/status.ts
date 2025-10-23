import type { APIRoute } from 'astro';

import { z } from 'zod';

export const prerender = false;

const statusSchema = z.object({
  itineraryId: z.string().uuid(),
});

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

    // Return status with progress information
    const response = {
      id: itinerary.id,
      status: itinerary.status,
      createdAt: itinerary.created_at,
      updatedAt: itinerary.updated_at,
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