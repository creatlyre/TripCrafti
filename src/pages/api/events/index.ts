import type { APIRoute } from 'astro';

import { getEvents } from '../../../lib/services/eventService';

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const long = url.searchParams.get('long');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const classificationName = url.searchParams.get('classificationName');

  if (!lat || !long || !startDate || !endDate) {
    return json({ error: 'Missing required query parameters: lat, long, startDate, endDate' }, 400);
  }

  try {
    const location = { lat: parseFloat(lat), long: parseFloat(long) };
    const events = await getEvents(location, startDate, endDate, classificationName || undefined);
    return json(events);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: 'Failed to fetch events', details: errorMessage }, 500);
  }
};
