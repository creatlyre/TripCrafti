import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const createExpenseSchema = z.object({
	category_id: z.string().uuid().optional().nullable(),
	description: z.string().trim().max(500).optional().nullable(),
	amount: z.number().positive(),
	currency: z.string().length(3).toUpperCase(),
	is_prepaid: z.boolean().optional().default(false),
	expense_date: z.string().datetime().optional(), // default now
});

export const GET: APIRoute = async ({ params, locals }) => {
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

	const { data, error } = await supabase
		.from('expenses')
		.select('*, budget_categories(*)')
		.eq('trip_id', tripId)
		.order('expense_date', { ascending: false });

	if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

	// Map join
	const expenses = (data || []).map((row: any) => ({
		...row,
		category: row.budget_categories,
		budget_categories: undefined,
	}));

	return new Response(JSON.stringify({ expenses }), { status: 200 });
};

export const POST: APIRoute = async ({ params, locals, request }) => {
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

	const json = await request.json().catch(() => null);
	if (!json) return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
	const parsed = createExpenseSchema.safeParse(json);
	if (!parsed.success) {
		return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }), { status: 422 });
	}
	const payload = parsed.data;

	// Currency normalization (Phase 1: assume same currency; Phase 3 will add FX conversion)
	const amountInHome = payload.currency === trip.currency ? payload.amount : payload.amount; // placeholder

	const { data: inserted, error } = await supabase
		.from('expenses')
		.insert({
			trip_id: tripId,
			category_id: payload.category_id ?? null,
			description: payload.description ?? null,
			amount: payload.amount,
			currency: payload.currency,
			amount_in_home_currency: amountInHome,
			is_prepaid: payload.is_prepaid ?? false,
			expense_date: payload.expense_date ?? new Date().toISOString(),
		})
		.select('*, budget_categories(*)')
		.single();

	if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

	const expense = { ...inserted, category: inserted?.budget_categories, budget_categories: undefined };
	return new Response(JSON.stringify({ expense }), { status: 201 });
};
