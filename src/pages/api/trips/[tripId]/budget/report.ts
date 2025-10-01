albo timport type { APIRoute } from 'astro';

export const prerender = false;

// GET /api/trips/:tripId/budget/report
// Aggregates planned vs actual per category and overall delta.
export const GET: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  if (!tripId) return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id, user_id, budget, currency, start_date, end_date')
    .eq('id', tripId)
    .single();
  if (tripErr || !trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // Categories
  const { data: categories, error: catErr } = await supabase
    .from('budget_categories')
    .select('id, name, planned_amount')
    .eq('trip_id', tripId);
  if (catErr) return new Response(JSON.stringify({ error: catErr.message }), { status: 500 });

  // Expenses with category join
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('amount_in_home_currency, is_prepaid, category_id')
    .eq('trip_id', tripId);
  if (expErr) return new Response(JSON.stringify({ error: expErr.message }), { status: 500 });

  const byCategory: Record<string, { planned: number; spent: number; name: string }> = {};
  categories?.forEach(c => { byCategory[c.id] = { planned: Number(c.planned_amount || 0), spent: 0, name: c.name }; });

  let totalSpent = 0; let totalPrepaid = 0;
  (expenses || []).forEach(e => {
    const amt = Number(e.amount_in_home_currency || 0);
    totalSpent += amt;
    if (e.is_prepaid) totalPrepaid += amt;
    if (e.category_id && byCategory[e.category_id]) {
      byCategory[e.category_id].spent += amt;
    }
  });

  const categoryRows = Object.entries(byCategory).map(([id, v]) => ({
    category_id: id,
    name: v.name,
    planned: v.planned,
    spent: v.spent,
    delta: v.spent - v.planned,
    utilization: v.planned ? (v.spent / v.planned) : null,
  })).sort((a,b) => (b.spent - a.spent));

  const plannedTotal = categoryRows.reduce((s,r)=> s + r.planned, 0);
  const deltaTotal = totalSpent - plannedTotal;

  const report = {
    trip_id: trip.id,
    currency: trip.currency,
    plannedTotal,
    totalSpent,
    totalPrepaid,
    totalOnTrip: totalSpent - totalPrepaid,
    deltaTotal,
    categories: categoryRows,
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(report), { status: 200 });
};
