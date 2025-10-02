import type { APIRoute } from 'astro';

import { getDictionary, type Lang } from '@/lib/i18n';
import { createPackingShareLink } from '@/lib/services/packingShare';

export const prerender = false;

// POST - create a new share link for packing list (trip owner only)
export const POST: APIRoute = async ({ params, locals, request }) => {
  const supabase = locals.supabase; // assume injected
  // Assuming middleware attaches authenticated user onto locals (augment Locals type in middleware if needed)
  let user: { id: string } | undefined = (locals as unknown as { user?: { id: string } }).user;
  if (!user) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) user = { id: data.user.id };
    } catch {
      /* ignore */
    }
  }
  const tripId = params.tripId;
  if (!tripId) {
    return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  }
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Verify ownership of trip
  const { data: trip, error: tripError } = await supabase.from('trips').select('id, user_id').eq('id', tripId).single();
  if (tripError || !trip) {
    return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  }
  if (trip.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  let body: { expiresInHours?: number; canModify?: boolean; lang?: string } = {};
  try {
    body = (await request.json()) || {};
  } catch {
    /* ignore empty body */
  }
  const { expiresInHours, canModify = true, lang = 'pl' } = body;
  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600 * 1000) : null;

  try {
    const link = await createPackingShareLink(supabase, { tripId, expiresAt, canModify });
    const safeLang: Lang = lang === 'en' ? 'en' : 'pl';
    const dict = getDictionary(safeLang);
    return new Response(
      JSON.stringify({
        token: link.token,
        expires_at: link.expires_at,
        can_modify: link.can_modify,
        url: `${new URL(request.url).origin}/packing/share/${link.token}`,
        message: dict ? dict.packing?.header?.title : 'Packing List',
      }),
      { status: 201 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
};
