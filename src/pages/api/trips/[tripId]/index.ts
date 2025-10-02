import type { APIRoute } from 'astro';

import { z } from 'zod';

export const prerender = false;

function json(data: any, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase } = locals;
  const { tripId } = params;

  if (!tripId) return json({ error: 'TripIdRequired' }, 400);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // Ensure trip belongs to user (and exists)
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, user_id')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single();

  if (tripError || !trip) {
    return json({ error: 'NotFoundOrForbidden' }, 404);
  }

  // Deleting trip will cascade to generated itineraries due to FK ON DELETE CASCADE
  const {
    error: delError,
    status,
    statusText,
  } = await supabase.from('trips').delete().eq('id', tripId).eq('user_id', user.id);
  if (delError) {
    return json({ error: 'DeleteFailed', details: delError.message, status, statusText }, 500);
  }

  // Re-check existence (defensive) - if still present, RLS might block
  const { data: stillThere } = await supabase.from('trips').select('id').eq('id', tripId).maybeSingle();
  if (stillThere) {
    return json({ error: 'DeleteNotApplied', hint: 'Check RLS DELETE policy on trips table.' }, 403);
  }

  return json({ success: true, deleted: true });
};
