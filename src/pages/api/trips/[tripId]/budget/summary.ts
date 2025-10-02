import type { APIRoute } from 'astro';

import { computeDailySpendTarget } from '../../../../../lib/utils';

export const prerender = false;

// Helper to compute difference in days inclusive
function daysBetween(start: string, end: string) {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1; // inclusive
  return diff > 0 ? diff : 0;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  if (!tripId) return new Response(JSON.stringify({ error: 'Missing tripId' }), { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not available' }), { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, user_id, budget, currency, start_date, end_date')
    .eq('id', tripId)
    .single();
  if (tripError || !trip) return new Response(JSON.stringify({ error: 'Trip not found' }), { status: 404 });
  if (trip.user_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // Aggregate planned categories
  const { data: categoriesAgg, error: catErr } = await supabase
    .from('budget_categories')
    .select('planned_amount')
    .eq('trip_id', tripId);
  if (catErr) return new Response(JSON.stringify({ error: catErr.message }), { status: 500 });
  const totalPlannedCategories = (categoriesAgg || []).reduce((sum, c: any) => sum + Number(c.planned_amount || 0), 0);

  // Aggregate expenses grouped by category
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('amount_in_home_currency, is_prepaid, category_id, expense_date, budget_categories(name, planned_amount)')
    .eq('trip_id', tripId);
  if (expErr) return new Response(JSON.stringify({ error: expErr.message }), { status: 500 });

  let totalSpent = 0;
  let totalSpentPrepaid = 0;
  const byCategoryMap: Record<
    string,
    { category_id: string | null; category: string | null; planned: number | null; spent: number }
  > = {};

  (expenses || []).forEach((e: any) => {
    const amt = Number(e.amount_in_home_currency || 0);
    totalSpent += amt;
    if (e.is_prepaid) totalSpentPrepaid += amt;
    const key = e.category_id || 'uncategorized';
    if (!byCategoryMap[key]) {
      byCategoryMap[key] = {
        category_id: e.category_id || null,
        category: e.budget_categories?.name || (e.category_id ? 'Unknown' : 'Uncategorized'),
        planned: e.budget_categories?.planned_amount ? Number(e.budget_categories.planned_amount) : null,
        spent: 0,
      };
    }
    byCategoryMap[key].spent += amt;
  });

  const spentByCategory = Object.values(byCategoryMap).sort((a, b) => b.spent - a.spent);
  const totalSpentOnTrip = totalSpent - totalSpentPrepaid;
  const remaining = trip.budget != null ? Number(trip.budget) - totalSpent : null;

  // Daily spend target: remaining / number of days left incl today
  const dailySpendTarget = computeDailySpendTarget(remaining, trip.start_date, trip.end_date);

  // Compute spent today (excluding prepaid for on-trip variable spending)
  const todayIso = new Date().toISOString().split('T')[0];
  let spentToday = 0;
  (expenses || []).forEach((e: any) => {
    if (!e.expense_date) return; // guard against missing column or null
    const dt = new Date(e.expense_date);
    if (isNaN(dt.getTime())) return; // invalid date safeguard
    const d = dt.toISOString().split('T')[0];
    if (d === todayIso && !e.is_prepaid) {
      spentToday += Number(e.amount_in_home_currency || 0);
    }
  });
  const safeToSpendToday = dailySpendTarget != null ? Math.max(0, dailySpendTarget - spentToday) : null;

  const summary = {
    trip_id: trip.id,
    totalBudget: trip.budget != null ? Number(trip.budget) : null,
    totalPlannedCategories,
    totalSpent,
    totalSpentPrepaid,
    totalSpentOnTrip,
    remaining,
    dailySpendTarget,
    // Phase 2 enhancements
    spentTodayOnTrip: spentToday,
    safeToSpendToday,
    spentByCategory,
  };

  return new Response(JSON.stringify(summary), { status: 200 });
};
