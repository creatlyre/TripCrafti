import type { APIRoute } from 'astro';

import { writeFile } from 'fs/promises';
import { join } from 'path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = import.meta.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing TICKETMASTER_API_KEY environment variable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract locale from query parameters or body
    const url = new URL(request.url);
    let locale = url.searchParams.get('locale');

    // If not in query params, try to get from request body
    if (!locale) {
      try {
        const body = await request.json();
        locale = body.locale;
      } catch {
        // If body parsing fails, continue with default
      }
    }

    // Validate locale and default to 'en'
    const validLocales = ['en', 'pl'];
    const selectedLocale = validLocales.includes(locale || '') ? locale : 'en';

    // Fetch fresh classifications from Ticketmaster with locale
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/classifications.json?apikey=${apiKey}&locale=${selectedLocale}`;
    const response = await fetch(ticketmasterUrl);

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(
        JSON.stringify({
          error: `Failed to fetch classifications: ${response.statusText}`,
          details: errorBody,
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    // Save the fresh data to the locale-specific file
    const filePath = join(process.cwd(), 'public', `ticketmaster_classifications_${selectedLocale}.json`);
    await writeFile(filePath, JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Classifications refreshed successfully for locale: ${selectedLocale}`,
        locale: selectedLocale,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: 'Failed to refresh classifications', details: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
