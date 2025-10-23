import type { APIRoute } from 'astro';

import { logDebug, logError } from '@/lib/log';
import { getEventDetails } from '@/lib/services/eventService';

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status,
    headers: { 'content-type': 'application/json' },
    ...(typeof init === 'object' ? init : {}),
  });
}

export const GET: APIRoute = async ({ params, request, locals }) => {
  const eventId = params.id;
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'pl';

  logDebug('Event details API request', { eventId, locale, url: url.toString() });

  if (!eventId) {
    logError('Missing event ID parameter');
    return json({ error: 'Missing event ID parameter' }, 400);
  }

  try {
    const eventDetails = await getEventDetails(
      eventId,
      locale,
      locals.runtime?.env,
      locals.runtime?.env?.SECRETS as { get: (key: string) => Promise<string | null> } | undefined
    );
    logDebug('Event details fetched successfully', { eventId, dataKeys: Object.keys(eventDetails) });
    return json(eventDetails);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Error fetching event details', { error: errorMessage });
    return json({ error: 'Failed to fetch event details', details: errorMessage }, 500);
  }
};
