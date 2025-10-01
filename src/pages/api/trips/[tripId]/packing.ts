import type { APIContext } from 'astro';
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase';
import type { PackingItem, ChecklistItem, SavedList } from '@/types';

// GET /api/trips/[tripId]/packing
// Fetches the entire packing list for a given trip.
export async function GET({ params, request }: APIContext) {
    const { tripId } = params;
    if (!tripId) {
        return new Response(JSON.stringify({ error: 'Trip ID is required' }), { status: 400 });
    }

    const supabase = createSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        // First, get the packing list record to get its ID
        const { data: listData, error: listError } = await supabase
            .from('packing_lists')
            .select('id, categories, list_meta')
            .eq('trip_id', tripId)
            .eq('user_id', user.id)
            .single();

        // If no list exists yet, return a default empty state
        if (listError || !listData) {
            return new Response(JSON.stringify({
                packingItems: [],
                checklistItems: [],
                categories: [],
                listMeta: null,
            }), { status: 200 });
        }

        const listId = listData.id;

        // Fetch packing items and checklist items concurrently
        const [packingItemsRes, checklistItemsRes] = await Promise.all([
            supabase.from('packing_items').select('*').eq('list_id', listId),
            supabase.from('checklist_items').select('*').eq('list_id', listId)
        ]);

        if (packingItemsRes.error) throw packingItemsRes.error;
        if (checklistItemsRes.error) throw checklistItemsRes.error;

        const responsePayload: SavedList = {
            packingItems: packingItemsRes.data || [],
            checklistItems: checklistItemsRes.data || [],
            categories: listData.categories || [],
            listMeta: listData.list_meta || null,
        };

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error fetching packing list:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}


// PUT /api/trips/[tripId]/packing
// Saves the entire state of the packing list for a given trip.
export async function PUT({ params, request }: APIContext) {
    const { tripId } = params;
    if (!tripId) {
        return new Response(JSON.stringify({ error: 'Trip ID is required' }), { status: 400 });
    }

    const supabase = createSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body: SavedList = await request.json();
    const { packingItems, checklistItems, categories, listMeta } = body;

    // Use the admin client to perform a transaction-like operation
    const supabaseAdmin = createSupabaseAdminClient();

    try {
        // Step 1: Upsert the main packing list record to get a stable ID
        const { data: listData, error: listError } = await supabaseAdmin
            .from('packing_lists')
            .upsert({
                trip_id: tripId,
                user_id: user.id,
                categories: categories,
                list_meta: listMeta,
            }, {
                onConflict: 'trip_id',
            })
            .select('id')
            .single();

        if (listError || !listData) {
            throw new Error(listError?.message || 'Failed to upsert packing list');
        }

        const listId = listData.id;

        // Step 2: Delete old items for this list
        await Promise.all([
            supabaseAdmin.from('packing_items').delete().eq('list_id', listId),
            supabaseAdmin.from('checklist_items').delete().eq('list_id', listId)
        ]);

        // Step 3: Insert new items if they exist
        if (packingItems && packingItems.length > 0) {
            const itemsToInsert = packingItems.map(item => ({
                list_id: listId,
                user_id: user.id,
                name: item.name,
                qty: item.qty,
                category: item.category,
                packed: item.packed,
                notes: item.notes,
                optional: item.optional,
            }));
            const { error: itemsError } = await supabaseAdmin.from('packing_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;
        }

        if (checklistItems && checklistItems.length > 0) {
            const checklistToInsert = checklistItems.map(item => ({
                list_id: listId,
                user_id: user.id,
                task: item.task,
                done: item.done,
            }));
            const { error: checklistError } = await supabaseAdmin.from('checklist_items').insert(checklistToInsert);
            if (checklistError) throw checklistError;
        }

        return new Response(JSON.stringify({ success: true, listId }), { status: 200 });

    } catch (error: any) {
        console.error('Error saving packing list:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}