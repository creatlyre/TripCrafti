import type { APIRoute } from 'astro';
import { getFxRate } from '@/lib/fx';

export const prerender = false;

/*
  POST /api/trips/:tripId/expenses/recalc-fx
  Recalculates amount_in_home_currency & fx metadata for expenses where:
    - expense.currency != trip.currency
    - AND (fx_rate IS NULL OR fx_source='fallback' OR amount_in_home_currency = amount)
  Returns summary of updated rows.
*/
export const POST: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  if (!tripId) return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: trip } = await supabase
    .from('trips')
    .select('id, user_id, currency')
    .eq('id', tripId)
    .single();
  if (!trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  if (!trip.currency) return new Response(JSON.stringify({ error: 'Trip has no base currency' }), { status: 400 });

  // Fetch candidate expenses
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('id, amount, currency, amount_in_home_currency, fx_rate, fx_source, fx_warning')
    .eq('trip_id', tripId);
  if (expErr) return new Response(JSON.stringify({ error: expErr.message }), { status: 500 });

  const toUpdate = (expenses || []).filter(e =>
    e.currency && e.currency !== trip.currency && (
      e.fx_rate == null || e.fx_source === 'fallback' || Number(e.amount_in_home_currency) === Number(e.amount)
    )
  );

  const updates: any[] = [];
  for (const row of toUpdate) {
    try {
      const { rate, source, warning } = await getFxRate(row.currency, trip.currency);
      if (!rate || rate <= 0) continue;
      const converted = source === 'identity' ? row.amount : Number((Number(row.amount) * rate).toFixed(2));
      updates.push({
        id: row.id,
        amount_in_home_currency: converted,
        fx_rate: source === 'identity' ? null : rate,
        fx_source: source,
        fx_warning: warning || null
      });
    } catch (e) {
      // ignore individual failure
    }
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ updated: 0, message: 'No expenses needed recalculation' }), { status: 200 });
  }

  // Batch update
  // Supabase upsert by primary key (id) requires full row? We'll do individual updates sequentially to keep logic simple.
  let success = 0; const failures: string[] = [];
  for (const u of updates) {
    const { error: upErr } = await supabase.from('expenses').update({
      amount_in_home_currency: u.amount_in_home_currency,
      fx_rate: u.fx_rate,
      fx_source: u.fx_source,
      fx_warning: u.fx_warning
    }).eq('id', u.id);
    if (upErr) failures.push(`${u.id}:${upErr.message}`); else success++;
  }

  return new Response(JSON.stringify({ updated: success, failed: failures.length, failures }), { status: 200 });
};
