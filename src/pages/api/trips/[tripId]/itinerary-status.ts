import type { APIRoute } from 'astro';

export const prerender = false;

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ params, locals }) => {
  const { tripId } = params;
  const { supabase } = locals;

  if (!tripId) {
    return json({ error: 'Trip ID is required' }, 400);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  try {
    // Get itineraryId from URL params
    const url = new URL(locals.request?.url || '');
    const itineraryId = url.searchParams.get('itineraryId');
    
    if (!itineraryId) {
      return json({ error: 'itineraryId parameter is required' }, 400);
    }

    // Verify the itinerary belongs to this user and trip
    const { data: itinerary, error: itineraryError } = await supabase
      .from('generateditineraries')
      .select('id, trip_id, status, generated_plan_json, created_at, updated_at, error_message')
      .eq('id', itineraryId)
      .eq('trip_id', tripId)
      .single();

    if (itineraryError || !itinerary) {
      return json({ error: 'Itinerary not found or access denied' }, 404);
    }

    // Verify trip ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single();

    if (tripError || !trip) {
      return json({ error: 'Trip not found or access denied' }, 404);
    }

    // If status is still GENERATING, check with Durable Object for live status
    if (itinerary.status === 'GENERATING' && locals.runtime?.env?.ITINERARY_PROCESSOR) {
      try {
        const doId = locals.runtime.env.ITINERARY_PROCESSOR.idFromString(itineraryId);
        const doStub = locals.runtime.env.ITINERARY_PROCESSOR.get(doId);
        
        const response = await doStub.fetch('http://localhost/status', {
          method: 'GET',
        });

        if (response.ok) {
          const doStatus = await response.json();
          
          // Return combined status from both database and Durable Object
          return json({
            ...itinerary,
            liveStatus: doStatus,
          });
        }
      } catch (doError) {
        // Continue with database status if DO fails
        console.warn('[ItineraryStatus] Failed to get live status from Durable Object:', doError);
      }
    }

    // Return database status
    return json(itinerary);

  } catch (error) {
    console.error('[ItineraryStatus] Error checking status:', error);
    return json({ 
      error: 'Failed to check itinerary status',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
};