import type { APIRoute } from 'astro';
import { getCoordinates } from '../../../lib/services/geocodingService';

function json(data: any, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const destination = url.searchParams.get('destination');

  if (!destination) {
    return json({ error: 'Missing required query parameter: destination' }, 400);
  }

  try {
    const coordinates = await getCoordinates(destination);
    return json(coordinates);
  } catch (error: any) {
    console.error('Error fetching coordinates:', error);
    return json({ error: 'Failed to fetch coordinates', details: error.message }, 500);
  }
};