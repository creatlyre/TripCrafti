import type { APIRoute } from 'astro';

import { logError, logDebug } from '@/lib/log';
import { getEvents, coordinatesToGeoPoint } from '@/lib/services/eventService';

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const geoPoint = url.searchParams.get('geoPoint');
  const lat = url.searchParams.get('lat');
  const long = url.searchParams.get('long');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const classificationName = url.searchParams.get('classificationName');
  const genreId = url.searchParams.getAll('genreId');
  const subGenreId = url.searchParams.getAll('subGenreId');
  const typeId = url.searchParams.getAll('typeId');
  const subTypeId = url.searchParams.getAll('subTypeId');
  const locale = url.searchParams.get('locale');
  const radius = url.searchParams.get('radius');
  const units = url.searchParams.get('unit') as 'km' | 'miles' | null; // Changed from 'units' to 'unit'

  // 🔍 API Endpoint Logging for Manual Testing
  logDebug('Events search API request', {
    location: { lat, long, geoPoint },
    dateRange: { startDate, endDate },
    classifications: classificationName,
    filters: { genreId, subGenreId, typeId, subTypeId },
    locale,
    radius,
    units,
    url: url.toString(),
  });

  // Validate required parameters
  if (!startDate || !endDate) {
    logError('Missing required parameters - startDate or endDate');
    return json({ error: 'Missing required query parameters: startDate, endDate' }, 400);
  }

  // Determine geoPoint: either directly provided or converted from lat/long
  let finalGeoPoint: string;

  if (geoPoint) {
    finalGeoPoint = geoPoint;
  } else if (lat && long) {
    finalGeoPoint = coordinatesToGeoPoint(parseFloat(lat), parseFloat(long));
    logDebug('Converted coordinates to geoPoint', { finalGeoPoint });
  } else {
    logError('Missing location parameters');
    return json({ error: 'Missing location: provide either geoPoint or both lat and long parameters' }, 400);
  }

  try {
    const events = await getEvents({
      geoPoint: finalGeoPoint,
      startDate,
      endDate,
      classificationName: classificationName || undefined,
      genreId: genreId.length > 0 ? genreId : undefined,
      subGenreId: subGenreId.length > 0 ? subGenreId : undefined,
      typeId: typeId.length > 0 ? typeId : undefined,
      subTypeId: subTypeId.length > 0 ? subTypeId : undefined,
      locale: locale || undefined,
      radius: radius || undefined,
      unit: units || undefined,
      runtimeEnv: locals.runtime?.env,
      kv: locals.runtime?.env?.SECRETS as { get: (key: string) => Promise<string | null> } | undefined,
    });
    logDebug('Events search completed', { count: events.length });
    if (events.length > 0) {
      logDebug('First event for testing', { eventId: events[0].id });
      logDebug('Event IDs sample', { eventIds: events.map((e) => e.id).slice(0, 5) });
    }
    return json(events);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Error in events search', { error: errorMessage });
    return json({ error: 'Failed to fetch events', details: errorMessage }, 500);
  }
};
