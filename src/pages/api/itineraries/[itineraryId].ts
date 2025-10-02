import type { APIRoute } from 'astro';

import { z } from 'zod';

export const prerender = false;

const updateItinerarySchema = z.object({
  generated_plan_json: z.any(), // Or a more specific schema for the plan
});

function json(data: any, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { itineraryId } = params;
  const { supabase } = locals;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // 1. Validate request body
  let updatedPlan;
  try {
    updatedPlan = updateItinerarySchema.parse(await request.json());
  } catch (e: any) {
    return json({ error: 'ValidationError', details: e.issues ?? e.message }, 400);
  }

  // 2. Verify ownership of the itinerary
  const { data: itinerary, error: itineraryError } = await supabase
    .from('GeneratedItineraries')
    .select('trip_id')
    .eq('id', itineraryId)
    .single();

  if (itineraryError || !itinerary) {
    return json({ error: 'Itinerary not found.' }, 404);
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('user_id')
    .eq('id', itinerary.trip_id)
    .single();

  if (tripError || !trip || trip.user_id !== user.id) {
    return json({ error: 'You do not have access to this itinerary.' }, 403);
  }

  // 3. Update the itinerary
  const { data, error } = await supabase
    .from('GeneratedItineraries')
    .update({
      ...updatedPlan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itineraryId)
    .select()
    .single();

  if (error) {
    return json({ error: 'Failed to update itinerary', details: error.message }, 500);
  }

  return json(data);
};
