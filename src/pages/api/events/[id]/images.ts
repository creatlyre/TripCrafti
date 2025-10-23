import type { APIRoute } from 'astro';

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
  console.log('\n=== EVENT IMAGES API REQUEST ===');
  console.log('🎯 Event ID:', eventId);
  console.log('🌍 Locale:', locale);
  console.log('📍 Full URL:', url.toString());
  console.log('🕐 Timestamp:', new Date().toISOString());

  if (!eventId) {
    console.log('❌ Error: Missing event ID parameter');
    return json({ error: 'Missing event ID parameter' }, 400);
  }

  const apiKey = import.meta.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return json({ error: 'Missing TICKETMASTER_API_KEY environment variable' }, 500);
  }

  try {
    const params = new URLSearchParams({
      locale,
      apikey: apiKey,
    });

    const fullApiUrl = `https://app.ticketmaster.com/discovery/v2/events/${eventId}/images.json?${params.toString()}`;

    console.log('🔗 Full API URL for manual testing:');
    console.log('   ', fullApiUrl);
    console.log('💡 You can test this URL directly in your browser or Postman');
    console.log('===============================================');

    const response = await fetch(fullApiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('✅ Event images response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.log('❌ Error: Event images API request failed', `${response.statusText} - ${errorBody}`);
      return json({ error: 'Failed to fetch event images', details: response.statusText }, response.status);
    }

    const data = await response.json();
    console.log('✅ Event images fetched successfully for ID:', eventId);
    console.log('📊 Response data keys:', Object.keys(data));
    console.log('=====================================\n');

    return json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Error fetching event images:', errorMessage);
    console.log('=====================================\n');
    return json({ error: 'Failed to fetch event images', details: errorMessage }, 500);
  }
};
