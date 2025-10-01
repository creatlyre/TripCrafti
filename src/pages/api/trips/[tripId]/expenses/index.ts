import type { APIRoute } from 'astro';
import { z } from 'zod';
import { convertAmount } from '@/lib/fx';
import { convertUsingDailyCache } from '@/lib/fxDaily';

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
		// Selecting * includes fx_rate, fx_source, fx_warning for FE transparency
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

	// Currency normalization with FX metadata persistence
	let amountInHome = payload.amount;
	let fxMeta: { rate: number; source: string; warning?: string } | null = null;
	if (trip.currency && payload.currency !== trip.currency) {
		// First try daily cache pivot (USD/EUR) to avoid repeated external calls
		let usedCache = false;
		try {
			const cached = await convertUsingDailyCache(supabase, payload.currency, trip.currency, ['USD']);
			if (cached && isFinite(cached.rate) && cached.rate > 0) {
				amountInHome = Number((payload.amount * cached.rate).toFixed(2));
				fxMeta = { rate: cached.rate, source: 'daily-cache' } as any;
				usedCache = true;
			}
		} catch {/* ignore cache errors */}
		if (!usedCache) {
			const { value, meta } = await convertAmount(payload.amount, payload.currency, trip.currency);
			amountInHome = value;
			fxMeta = meta;
		}
	}

	const insertPayload: any = {
		trip_id: tripId,
		category_id: payload.category_id ?? null,
		description: payload.description ?? null,
		amount: payload.amount,
		currency: payload.currency,
		amount_in_home_currency: amountInHome,
		is_prepaid: payload.is_prepaid ?? false,
		expense_date: payload.expense_date ?? new Date().toISOString(),
	};
	if (fxMeta) {
		insertPayload.fx_rate = fxMeta.rate === 1 && payload.currency !== trip.currency ? null : fxMeta.rate; // store null if identity but different currency fallback used (ambiguous)
		insertPayload.fx_source = fxMeta.source;
		if (fxMeta.warning) insertPayload.fx_warning = fxMeta.warning;
	}
	const { data: inserted, error } = await supabase
		.from('expenses')
		.insert(insertPayload)
		.select('*, budget_categories(*)')
		.single();

	if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

	const expense = { ...inserted, category: inserted?.budget_categories, budget_categories: undefined };
	return new Response(JSON.stringify({ expense }), { status: 201 });
};
