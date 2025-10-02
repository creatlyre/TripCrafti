import type { APIRoute } from 'astro';

import { z } from 'zod';

import { convertAmount } from '@/lib/fx';

export const prerender = false;

const updateExpenseSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  is_prepaid: z.boolean().optional(),
  expense_date: z.string().datetime().optional(),
});

// DELETE /api/trips/:tripId/expenses/:expenseId
// Optional GET for single expense (could be useful for future editing UI)
export const GET: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  const expenseId = params.expenseId;
  if (!tripId || !expenseId) return new Response(JSON.stringify({ error: 'Missing identifiers' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Verify expense belongs to user via join on trip
  const { data: expense, error } = await supabase
    .from('expenses')
    .select('*, trips!inner(user_id), budget_categories(*)')
    .eq('id', expenseId)
    .eq('trip_id', tripId)
    .single();
  if (error || !expense) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (expense.trips.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const result: any = {
    ...expense,
    category: expense.budget_categories,
    budget_categories: undefined,
    trips: undefined,
  };
  return new Response(JSON.stringify({ expense: result }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  const expenseId = params.expenseId;
  if (!tripId || !expenseId) return new Response(JSON.stringify({ error: 'Missing identifiers' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Ownership check – ensure expense belongs to trip owned by user
  const { data: trip } = await supabase.from('trips').select('id, user_id').eq('id', tripId).single();
  if (!trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId).eq('trip_id', tripId);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ success: true, id: expenseId }), { status: 200 });
};

// PUT /api/trips/:tripId/expenses/:expenseId
export const PUT: APIRoute = async ({ params, locals, request }) => {
  const tripId = params.tripId;
  const expenseId = params.expenseId;
  if (!tripId || !expenseId) return new Response(JSON.stringify({ error: 'Missing identifiers' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success)
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }), { status: 422 });
  if (Object.keys(parsed.data).length === 0)
    return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });

  // Ownership via trip join
  const { data: trip } = await supabase.from('trips').select('id, user_id, currency').eq('id', tripId).single();
  if (!trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const updatePayload: any = {};
  const d = parsed.data;
  if (d.category_id !== undefined) updatePayload.category_id = d.category_id;
  if (d.description !== undefined) updatePayload.description = d.description;
  if (d.amount !== undefined) updatePayload.amount = d.amount;
  if (d.currency !== undefined) updatePayload.currency = d.currency;
  if (d.is_prepaid !== undefined) updatePayload.is_prepaid = d.is_prepaid;
  if (d.expense_date !== undefined) updatePayload.expense_date = d.expense_date;

  // FX placeholder (Phase 3). Recalculate amount_in_home_currency if amount or currency changed.
  if (d.amount !== undefined || d.currency !== undefined) {
    const amount = d.amount ?? undefined;
    const currency = d.currency ?? undefined;
    if (amount != null) {
      const effectiveFrom =
        currency ||
        (d.currency ? d.currency : undefined) ||
        d.currency ||
        updatePayload.currency ||
        d.currency ||
        d.currency; // ensure variable exists
      const fromCur = currency || updatePayload.currency || d.currency || '' || '';
      const srcCurrency = fromCur || d.currency || (updatePayload.currency as string) || '';
      const targetCurrency = trip.currency;
      if (targetCurrency && srcCurrency && targetCurrency !== srcCurrency) {
        const { value } = await convertAmount(amount, srcCurrency, targetCurrency);
        updatePayload.amount_in_home_currency = value;
      } else if (targetCurrency) {
        updatePayload.amount_in_home_currency = amount;
      }
    }
  }

  const { data: updated, error } = await supabase
    .from('expenses')
    .update(updatePayload)
    .eq('id', expenseId)
    .eq('trip_id', tripId)
    .select('*, budget_categories(*)')
    .single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!updated) return new Response(JSON.stringify({ error: 'Expense not found' }), { status: 404 });
  const result: any = { ...updated, category: updated.budget_categories, budget_categories: undefined };
  return new Response(JSON.stringify({ expense: result }), { status: 200 });
};
