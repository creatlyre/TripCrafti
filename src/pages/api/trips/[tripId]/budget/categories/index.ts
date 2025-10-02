import type { APIRoute } from 'astro';

import { z } from 'zod';

// Ensure this route is not pre-rendered
export const prerender = false;

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  planned_amount: z.number().nonnegative(),
  icon_name: z.string().trim().max(50).optional().nullable(),
});

const bulkCreateSchema = z.object({
  categories: z.array(createCategorySchema).min(1).max(50),
});

export const GET: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  if (!tripId) {
    return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  }

  const supabase = locals.supabase;
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  }

  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Verify trip ownership (defense in depth beyond RLS)
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, user_id, currency, budget, start_date, end_date')
    .eq('id', tripId)
    .single();

  if (tripError || !trip) {
    return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  }
  if (trip.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { data: categories, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ categories }), { status: 200 });
};

export const POST: APIRoute = async ({ request, params, locals }) => {
  const tripId = params.tripId;
  if (!tripId) {
    return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  }
  const supabase = locals.supabase;
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // Determine if single or bulk create
  let mode: 'single' | 'bulk' = 'single';
  let categoriesPayload: z.infer<typeof createCategorySchema>[] = [];

  if (Array.isArray(body)) {
    // Accept raw array for backward simplicity
    const arrParse = z.array(createCategorySchema).safeParse(body);
    if (!arrParse.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: arrParse.error.issues }), {
        status: 422,
      });
    }
    mode = 'bulk';
    categoriesPayload = arrParse.data;
  } else if (body && typeof body === 'object' && 'categories' in body) {
    const bulkParse = bulkCreateSchema.safeParse(body);
    if (!bulkParse.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: bulkParse.error.issues }), {
        status: 422,
      });
    }
    mode = 'bulk';
    categoriesPayload = bulkParse.data.categories;
  } else {
    const singleParse = createCategorySchema.safeParse(body);
    if (!singleParse.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: singleParse.error.issues }), {
        status: 422,
      });
    }
    categoriesPayload = [singleParse.data];
  }

  // Validate trip belongs to user (optional extra)
  const { data: trip, error: tripError } = await supabase.from('trips').select('id, user_id').eq('id', tripId).single();
  if (tripError || !trip) {
    return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  }
  if (trip.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const insertRows = categoriesPayload.map((c) => ({
    trip_id: tripId,
    name: c.name,
    planned_amount: c.planned_amount,
    icon_name: c.icon_name ?? null,
  }));

  const { data: inserted, error } = await supabase.from('budget_categories').insert(insertRows).select('*');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (mode === 'single') {
    return new Response(JSON.stringify({ category: inserted?.[0] }), { status: 201 });
  }
  return new Response(JSON.stringify({ categories: inserted }), { status: 201 });
};
