import type { APIContext } from 'astro';

import { z } from 'zod';

import type { PackingItem, ChecklistItem, SavedList } from '@/types';

import { SavedListSchema } from '@/lib/schemas/packingSchemas';

export const prerender = false;

// GET /api/trips/[tripId]/packing
// Fetches the entire packing list for a given trip.
export async function GET({ params, locals }: APIContext) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return new Response(JSON.stringify({ error: 'Trip ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate tripId is a valid UUID
    const uuidSchema = z.string().uuid();
    const validatedTripId = uuidSchema.parse(tripId);

    const { supabase } = locals;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First, get the packing list record to get its ID
    const { data: listData, error: listError } = await supabase
      .from('packing_lists')
      .select('id, categories, list_meta')
      .eq('trip_id', validatedTripId)
      .maybeSingle();

    // If no list exists yet, return a default empty state
    if (listError || !listData) {
      const emptyResult: SavedList = {
        packingItems: [],
        checklistItems: [],
        categories: [],
        listMeta: null,
      };
      return new Response(JSON.stringify(emptyResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const listId = listData.id;

    // Fetch packing items and checklist items concurrently
    const [packingItemsRes, checklistItemsRes] = await Promise.all([
      supabase.from('packing_items').select('*').eq('list_id', listId),
      supabase.from('checklist_items').select('*').eq('list_id', listId),
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

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid trip ID format',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'An internal server error occurred.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/trips/[tripId]/packing
// Saves the entire state of the packing list for a given trip.
export async function PUT({ params, request, locals }: APIContext) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return new Response(JSON.stringify({ error: 'Trip ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate tripId is a valid UUID
    const uuidSchema = z.string().uuid();
    const validatedTripId = uuidSchema.parse(tripId);

    const { supabase } = locals;

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and normalize request body (convert explicit nulls for optional fields)
    const rawBody = await request.json();
    // console.log('Backend request body received:', JSON.stringify(rawBody, null, 2));

    const body = {
      ...rawBody,
      packingItems: Array.isArray(rawBody.packingItems)
        ? rawBody.packingItems.map((it: any) => ({
            ...it,
            notes: it.notes === null ? undefined : it.notes,
          }))
        : [],
      checklistItems: Array.isArray(rawBody.checklistItems) ? rawBody.checklistItems : [],
      categories: Array.isArray(rawBody.categories) ? rawBody.categories : [],
      listMeta: rawBody.listMeta
        ? {
            ...rawBody.listMeta,
            transport: rawBody.listMeta.transport === null ? undefined : rawBody.listMeta.transport,
            accommodation: rawBody.listMeta.accommodation === null ? undefined : rawBody.listMeta.accommodation,
            activities: rawBody.listMeta.activities === null ? undefined : rawBody.listMeta.activities,
            archetype: rawBody.listMeta.archetype === null ? undefined : rawBody.listMeta.archetype,
          }
        : rawBody.listMeta,
    };

    // console.log('Normalized body before validation:', JSON.stringify(body, null, 2));
    // console.log('Attempting SavedListSchema validation...');
    const validatedData = SavedListSchema.parse(body);
    console.log('Validation successful!');
    const { packingItems, checklistItems, categories, listMeta } = validatedData;

    // Step 1: Upsert the main packing list record to get a stable ID
    const { data: listData, error: listError } = await supabase
      .from('packing_lists')
      .upsert(
        {
          trip_id: validatedTripId,
          user_id: user.id,
          categories: categories,
          list_meta: listMeta,
        },
        {
          onConflict: 'trip_id',
        }
      )
      .select('id')
      .single();

    if (listError || !listData) {
      throw new Error(listError?.message || 'Failed to upsert packing list');
    }

    const listId = listData.id;

    // Step 2: Delete old items for this list
    await Promise.all([
      supabase.from('packing_items').delete().eq('list_id', listId),
      supabase.from('checklist_items').delete().eq('list_id', listId),
    ]);

    // Step 3: Insert new items if they exist
    const insertPromises = [];

    if (packingItems && packingItems.length > 0) {
      const itemsToInsert = packingItems.map((item) => ({
        list_id: listId,
        user_id: user.id,
        name: item.name,
        qty: String(item.qty), // Ensure qty is a string
        category: item.category,
        packed: item.packed,
        notes: item.notes,
        optional: item.optional || false,
      }));

      insertPromises.push(supabase.from('packing_items').insert(itemsToInsert));
    }

    if (checklistItems && checklistItems.length > 0) {
      const checklistToInsert = checklistItems.map((item) => ({
        list_id: listId,
        user_id: user.id,
        task: item.task,
        done: item.done,
      }));

      insertPromises.push(supabase.from('checklist_items').insert(checklistToInsert));
    }

    if (insertPromises.length > 0) {
      const results = await Promise.all(insertPromises);
      for (const result of results) {
        if (result.error) throw result.error;
      }
    }

    // Step 4: Persist regeneration count to trips table if present
    if (listMeta && typeof listMeta.regenerationCount === 'number') {
      const { error: tripUpdateError } = await supabase
        .from('trips')
        .update({ packing_regenerations: listMeta.regenerationCount })
        .eq('id', validatedTripId);
      if (tripUpdateError) {
        console.warn('Failed to update packing_regenerations in trips table', tripUpdateError.message);
      }
    }

    return new Response(JSON.stringify({ success: true, listId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error saving packing list:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'An internal server error occurred.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
