import type { APIRoute } from 'astro';
import { createItineraryShareLink } from '@/lib/services/itineraryShare';
import { getDictionary } from '@/lib/i18n';

export const prerender = false;

// POST - create a new share link for the itinerary (trip owner only)
export const POST: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  const tripId = params.tripId;

  if (!tripId) {
    return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  }

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // 1. Verify ownership of the trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, user_id')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  }

  if (trip.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  // 2. Parse optional body for expiration
  let body: { expiresInHours?: number; lang?: string } = {};
  try {
    body = (await request.json()) || {};
  } catch {
    // Ignore empty body
  }
  const { expiresInHours, lang = 'en' } = body;
  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600 * 1000) : null;

  try {
    // 3. Create the share link
    const link = await createItineraryShareLink(supabase, {
      tripId,
      userId: user.id,
      expiresAt,
    });

    const shareUrl = `${new URL(request.url).origin}/share/itinerary/${link.share_token}`;

    // 4. Return the successful response
    return new Response(
      JSON.stringify({
        shareUrl,
        message: getDictionary(lang === 'en' ? 'en' : 'pl').itineraryView?.share?.title ?? 'Share Itinerary',
      }),
      { status: 201 }
    );
  } catch (e) {
    const error = e as Error;
    console.error('Failed to create itinerary share link:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};