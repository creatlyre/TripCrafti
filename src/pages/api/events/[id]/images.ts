import type { APIRoute } from 'astro';

import { logDebug, logError } from '@/lib/log';
import { getSecret } from '@/lib/secrets';

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

  logDebug('Event images API request', { eventId, locale, url: url.toString() });

  if (!eventId) {
    logError('Missing event ID parameter');
    return json({ error: 'Missing event ID parameter' }, 400);
  }

  const apiKey = await getSecret('TICKETMASTER_API_KEY', {
    runtimeEnv: locals.runtime?.env,
    kv: locals.runtime?.env?.SECRETS as { get: (key: string) => Promise<string | null> } | undefined,
  });

  if (!apiKey) {
    return json({ error: 'Missing TICKETMASTER_API_KEY environment variable' }, 500);
  }

  try {
    const params = new URLSearchParams({
      locale,
      apikey: apiKey,
    });

    const fullApiUrl = `https://app.ticketmaster.com/discovery/v2/events/${eventId}/images.json?${params.toString()}`;

    logDebug('Full API URL for manual testing', { fullApiUrl });

    const response = await fetch(fullApiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    logDebug('Event images response status', { status: response.status });

    if (!response.ok) {
      const errorBody = await response.text();
      logError('Event images API request failed', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      return json({ error: 'Failed to fetch event images', details: response.statusText }, response.status);
    }

    const data = await response.json();
    logDebug('Event images fetched successfully', { eventId, dataKeys: Object.keys(data) });

    return json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Error fetching event images', { error: errorMessage });
    return json({ error: 'Failed to fetch event images', details: errorMessage }, 500);
  }
};
