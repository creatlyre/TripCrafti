import type { APIRoute } from 'astro';

import { getSecret } from '@/lib/secrets';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const apiKey = await getSecret('TICKETMASTER_API_KEY', {
      runtimeEnv: locals.runtime?.env,
    });

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

    // In production (Cloudflare Pages), we can't write to file system
    // So we'll just return the data and let the client know about the limitation
    if (import.meta.env.PROD) {
      return new Response(
        JSON.stringify({
          success: true,
          message:
            'Classifications fetched successfully. Note: In production environment, file system updates are not supported. Classifications data returned below for manual update.',
          locale: selectedLocale,
          timestamp: new Date().toISOString(),
          data,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Development environment - we can try to write the file (if fs is available)
    try {
      // Dynamic import to avoid issues in production
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');

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
    } catch (fsError) {
      // If file writing fails, return the data anyway
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Classifications fetched but file write failed. Data returned for manual update.',
          locale: selectedLocale,
          timestamp: new Date().toISOString(),
          error: fsError instanceof Error ? fsError.message : 'Unknown file system error',
          data,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: 'Failed to refresh classifications', details: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
