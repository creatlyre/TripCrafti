import type { APIRoute } from 'astro';

import { getEventDetails } from '../../../../lib/services/eventService';

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ params, request }) => {
  const eventId = params.id;
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'pl';

  // 🔍 API Endpoint Logging for Manual Testing
  console.log('\n=== EVENT DETAILS API REQUEST ===');
  console.log('🎯 Event ID:', eventId);
  console.log('🌍 Locale:', locale);
  console.log('📍 Full URL:', url.toString());
  console.log('🕐 Timestamp:', new Date().toISOString());

  if (!eventId) {
    console.log('❌ Error: Missing event ID parameter');
    return json({ error: 'Missing event ID parameter' }, 400);
  }

  try {
    const eventDetails = await getEventDetails(eventId, locale);
    console.log('✅ Event details fetched successfully for ID:', eventId);
    console.log('📊 Response data keys:', Object.keys(eventDetails));
    console.log('=====================================\n');
    return json(eventDetails);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Error fetching event details:', errorMessage);
    console.log('=====================================\n');
    return json({ error: 'Failed to fetch event details', details: errorMessage }, 500);
  }
};
