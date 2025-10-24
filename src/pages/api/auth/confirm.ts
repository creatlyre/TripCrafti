import type { APIRoute } from 'astro';

import { createSupabaseServer } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  try {
    const requestUrl = new URL(url);
    const token_hash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') as 'signup' | 'email_change' | 'recovery';
    const next = requestUrl.searchParams.get('next') ?? '/app';

    if (token_hash && type) {
      const supabase = createSupabaseServer(cookies);

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });

      if (error) {
        const errorParams = new URLSearchParams({
          error: 'verification_failed',
          message: error.message || 'Email verification failed',
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

    // Invalid or missing parameters
    return redirect('/login?error=invalid_token&message=Invalid verification link');
  } catch {
    return redirect('/login?error=confirmation_error&message=An error occurred during email confirmation');
  }
};
