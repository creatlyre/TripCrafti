import type { APIRoute } from 'astro';

import { z } from 'zod';

export const prerender = false;

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  planned_amount: z.number().nonnegative().optional(),
  icon_name: z.string().trim().max(50).nullable().optional(),
});

// PUT /api/trips/:tripId/budget/categories/:categoryId
export const PUT: APIRoute = async ({ params, locals, request }) => {
  const tripId = params.tripId;
  const categoryId = params.categoryId;
  if (!tripId || !categoryId) return new Response(JSON.stringify({ error: 'Missing identifiers' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Parse body
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }), { status: 422 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
  }

  // Ownership check
  const { data: trip } = await supabase.from('trips').select('id, user_id').eq('id', tripId).single();
  if (!trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const updatePayload: any = {};
  if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
  if (parsed.data.planned_amount !== undefined) updatePayload.planned_amount = parsed.data.planned_amount;
  if (parsed.data.icon_name !== undefined) updatePayload.icon_name = parsed.data.icon_name ?? null;

  const { data: updated, error } = await supabase
    .from('budget_categories')
    .update(updatePayload)
    .eq('id', categoryId)
    .eq('trip_id', tripId)
    .select('*')
    .single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!updated) return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 });
  return new Response(JSON.stringify({ category: updated }), { status: 200 });
};

// DELETE /api/trips/:tripId/budget/categories/:categoryId
export const DELETE: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  const categoryId = params.categoryId;
  if (!tripId || !categoryId) return new Response(JSON.stringify({ error: 'Missing identifiers' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: trip } = await supabase.from('trips').select('id, user_id').eq('id', tripId).single();
  if (!trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // Ensure no expenses referencing this category (could rely on FK ON DELETE RESTRICT but explicit is clearer)
  const { count, error: countError } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('category_id', categoryId);
  if (countError) return new Response(JSON.stringify({ error: countError.message }), { status: 500 });
  if ((count ?? 0) > 0)
    return new Response(JSON.stringify({ error: 'Category in use', code: 'CATEGORY_IN_USE', references: count }), {
      status: 409,
    });

  const { error } = await supabase.from('budget_categories').delete().eq('id', categoryId).eq('trip_id', tripId);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true, id: categoryId }), { status: 200 });
};
