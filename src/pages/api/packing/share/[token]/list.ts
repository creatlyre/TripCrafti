import type { APIRoute } from 'astro';

import { getShareLinkByToken } from '@/lib/services/packingShare';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // Allow optional service-level supabase client injection (augment Locals in middleware if formalizing)
  const supabase = (locals as any).supabaseService || locals.supabase; // eslint-disable-line @typescript-eslint/no-explicit-any
  const token = params.token;
  if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });

  try {
    const link = await getShareLinkByToken(supabase, token);
    if (!link) return new Response(JSON.stringify({ error: 'Invalid or expired link' }), { status: 404 });

    // Fetch packing list
    const { data: listRow, error: listError } = await supabase
      .from('packing_lists')
      .select('id, trip_id, categories, list_meta')
      .eq('trip_id', link.trip_id)
      .single();
    if (listError || !listRow) return new Response(JSON.stringify({ error: 'List not found' }), { status: 404 });

    const { data: items, error: itemsError } = await supabase
      .from('packing_items')
      .select('id, name, qty, category, packed, optional, notes, created_at')
      .eq('list_id', listRow.id)
      .order('id');
    if (itemsError) return new Response(JSON.stringify({ error: 'Items fetch failed' }), { status: 500 });

    const { data: checklist, error: checklistError } = await supabase
      .from('checklist_items')
      .select('id, task, done, created_at')
      .eq('list_id', listRow.id)
      .order('id');
    if (checklistError) return new Response(JSON.stringify({ error: 'Checklist fetch failed' }), { status: 500 });

    return new Response(
      JSON.stringify({
        link: { token: link.token, can_modify: link.can_modify, expires_at: link.expires_at },
        list: listRow,
        items: items || [],
        checklist: checklist || [],
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
};
