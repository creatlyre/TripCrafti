import type { APIRoute } from 'astro';

import { createSupabaseServer } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  try {
    const requestUrl = new URL(url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/app';
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      const errorParams = new URLSearchParams({
        error: error,
        message: errorDescription || 'Authentication failed',
      });
      return redirect(`/login?${errorParams.toString()}`);
    }

    if (code) {
      const supabase = createSupabaseServer(cookies);

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        const errorParams = new URLSearchParams({
          error: 'exchange_failed',
          message: exchangeError.message || 'Failed to complete authentication',
        });
        return redirect(`/login?${errorParams.toString()}`);
      }

      if (data.session) {
        // Add language parameter if it exists
        const lang = requestUrl.searchParams.get('lang') || 'pl';
        const redirectUrl = next.includes('?') ? `${next}&lang=${lang}` : `${next}?lang=${lang}`;

        return redirect(redirectUrl);
      }
    }

    // Fallback if no code or session
    return redirect('/login?error=no_code&message=No authorization code provided');
  } catch {
    return redirect('/login?error=callback_error&message=An unexpected error occurred during authentication');
  }
};
