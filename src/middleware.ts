import type { MiddlewareHandler } from 'astro';

import { sequence } from 'astro/middleware';

import { createSupabaseServer } from '@/lib/supabase';

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

export const onRequest = sequence(langMiddleware, authMiddleware);
