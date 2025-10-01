import type { APIRoute } from 'astro';

export const prerender = false;

// GET /api/trips/:tripId/expenses/export.csv
// Streams CSV of expenses for the trip.
export const GET: APIRoute = async ({ params, locals }) => {
  const tripId = params.tripId;
  if (!tripId) return new Response('Missing tripId', { status: 400 });
  const supabase = locals.supabase;
  if (!supabase) return new Response('Supabase client not available', { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: trip } = await supabase
    .from('trips')
    .select('id, user_id, title, currency')
    .eq('id', tripId)
    .single();
  if (!trip) return new Response('Trip not found', { status: 404 });
  if (trip.user_id !== user.id) return new Response('Forbidden', { status: 403 });

  const { data: rows, error } = await supabase
    .from('expenses')
    .select('id, category_id, description, amount, currency, amount_in_home_currency, is_prepaid, expense_date, created_at, budget_categories(name)')
    .eq('trip_id', tripId)
    .order('expense_date', { ascending: true });
  if (error) return new Response('Error loading expenses', { status: 500 });

  const header = ['id','category','description','amount','currency','amount_in_home_currency','is_prepaid','expense_date','created_at'];
  const lines = [header.join(',')];
  (rows||[]).forEach((r:any) => {
    const category = r.budget_categories?.name || '';
    const line = [
      r.id,
      escapeCsv(category),
      escapeCsv(r.description || ''),
      r.amount,
      r.currency,
      r.amount_in_home_currency,
      r.is_prepaid,
      r.expense_date,
      r.created_at
    ].join(',');
    lines.push(line);
  });
  const csv = lines.join('\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="trip_${tripId}_expenses.csv"`
    }
  });
};

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
