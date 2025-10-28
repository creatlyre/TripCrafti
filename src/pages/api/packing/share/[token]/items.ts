import type { SupabaseClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

import { getShareLinkByToken } from '@/lib/services/packingShare';

export const prerender = false;

interface LocalsWithService {
  supabase: SupabaseClient;
  supabaseService?: SupabaseClient;
}

function getClient(locals: unknown): SupabaseClient {
  const { supabase, supabaseService } = locals as LocalsWithService;
  return supabaseService || supabase;
}

// POST add item
export const POST: APIRoute = async (context) => {
  const { params, locals, request } = context;
  const client = getClient(locals);
  const token = params.token;
  if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });

  let body: { name?: string; qty?: string; category?: string; notes?: string; optional?: boolean } = {};
  try {
    body = (await request.json()) || {};
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const link = await getShareLinkByToken(client, token);
  if (!link) return new Response(JSON.stringify({ error: 'Invalid or expired link' }), { status: 404 });
  if (!link.can_modify) return new Response(JSON.stringify({ error: 'Read-only link' }), { status: 403 });
  if (!body.name || !body.category) {
    return new Response(JSON.stringify({ error: 'Missing name/category' }), { status: 400 });
  }

  const { data: listRow, error: listError } = await client
    .from('packing_lists')
    .select('id, trip_id')
    .eq('trip_id', link.trip_id)
    .single();
  if (listError || !listRow) return new Response(JSON.stringify({ error: 'List not found' }), { status: 404 });

  // Owner user id to satisfy NOT NULL user_id (service role required)
  const { data: tripOwnerRow } = await client.from('trips').select('user_id').eq('id', link.trip_id).single();
  const ownerUserId = tripOwnerRow?.user_id;

  const insertPayload = {
    list_id: listRow.id,
    user_id: ownerUserId,
    name: body.name,
    qty: body.qty || '1',
    category: body.category,
    notes: body.notes || null,
    optional: body.optional ?? false,
  };

  const { data: inserted, error: insertErr } = await client
    .from('packing_items')
    .insert(insertPayload)
    .select('id, name, qty, category, packed, optional, notes')
    .single();
  if (insertErr || !inserted) return new Response(JSON.stringify({ error: 'Insert failed' }), { status: 500 });
  return new Response(JSON.stringify({ item: inserted }), { status: 201 });
};

// PATCH update/toggle fields (no delete)
export const PATCH: APIRoute = async (context) => {
  const { params, locals, request } = context;
  const client = getClient(locals);
  const token = params.token;
  if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });

  // Parse body first to allow id fallback
  let body: {
    id?: number;
    name?: string;
    qty?: string;
    category?: string;
    packed?: boolean;
    notes?: string;
    optional?: boolean;
  } = {};
  try {
    body = (await request.json()) || {};
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const url = new URL(request.url);
  const idStr = url.searchParams.get('id') || (body.id != null ? String(body.id) : null);
  if (!idStr) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  const id = Number(idStr);
  if (Number.isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });

  const link = await getShareLinkByToken(client, token);
  if (!link) return new Response(JSON.stringify({ error: 'Invalid or expired link' }), { status: 404 });
  if (!link.can_modify) return new Response(JSON.stringify({ error: 'Read-only link' }), { status: 403 });

  // Ensure the item belongs to the list for this trip
  const { data: listRow } = await client.from('packing_lists').select('id').eq('trip_id', link.trip_id).single();
  if (!listRow) return new Response(JSON.stringify({ error: 'List not found' }), { status: 404 });

  const { data: itemRow } = await client.from('packing_items').select('id, list_id').eq('id', id).single();
  if (!itemRow || itemRow.list_id !== listRow.id) {
    return new Response(JSON.stringify({ error: 'Item not in list' }), { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {};
  (['name', 'qty', 'category', 'packed', 'notes', 'optional'] as const).forEach((k) => {
    const v = body[k];
    if (v !== undefined) updatePayload[k] = v;
  });
  if (Object.keys(updatePayload).length === 0) {
    return new Response(JSON.stringify({ error: 'No updatable fields provided' }), { status: 400 });
  }

  const { error: updErr, data } = await client
    .from('packing_items')
    .update(updatePayload)
    .eq('id', id)
    .select('id, name, qty, category, packed, optional, notes')
    .single();
  if (updErr || !data) return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500 });
  return new Response(JSON.stringify({ item: data }), { status: 200 });
};
