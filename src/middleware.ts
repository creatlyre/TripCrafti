import type { MiddlewareHandler } from 'astro';

import { sequence } from 'astro/middleware';

import { createSupabaseServer } from '@/lib/supabase';

// Map Cloudflare platform env (if present) into a uniform locals.runtime.env shape.
const runtimeEnvMiddleware: MiddlewareHandler = async (context, next) => {
  try {
    // Cloudflare adapter exposes bindings on context.platform.env in recent versions.
    // Use several fallbacks for safety.
    const platformMaybe = (context as unknown as { platform?: { env?: Record<string, string> } }).platform?.env;
    const platformEnv =
      (platformMaybe && typeof platformMaybe === 'object' ? (platformMaybe as Record<string, string>) : undefined) ||
      (context.locals as unknown as { platform?: { env?: Record<string, string> } }).platform?.env;
    if (platformEnv && typeof platformEnv === 'object') {
      context.locals.runtime = { env: platformEnv };
    }
  } catch {
    /* ignore */
  }
  return next();
};

const langMiddleware: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  let lang = url.searchParams.get('lang') as 'pl' | 'en' | null;

  if (!lang) {
    const cookieVal = context.cookies.get('tc_lang')?.value as 'pl' | 'en' | undefined;
    if (cookieVal && ['pl', 'en'].includes(cookieVal)) lang = cookieVal;
  }

  if (!lang) {
    const header = context.request.headers.get('accept-language');
    if (header) {
      const preferred = header.split(',')[0]?.trim().toLowerCase().slice(0, 2);
      if (['pl', 'en'].includes(preferred)) lang = preferred as 'pl' | 'en';
    }
  }

  if (!lang) lang = 'pl';

  if (context.cookies.get('tc_lang')?.value !== lang) {
    context.cookies.set('tc_lang', lang, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  }

  context.locals.lang = lang;
  return next();
};

const authMiddleware: MiddlewareHandler = async (context, next) => {
  const supabase = createSupabaseServer(context.cookies);
  context.locals.supabase = supabase;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  // console.log("SESSION IN MIDDLEWARE", session);
  context.locals.session = session;

  return next();
};

export const onRequest = sequence(runtimeEnvMiddleware, langMiddleware, authMiddleware);
