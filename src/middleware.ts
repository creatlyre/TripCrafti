import type { MiddlewareHandler } from 'astro';
import type { Lang } from './lib/i18n';

// Supported languages and cookie name
const SUPPORTED: Lang[] = ['pl', 'en'];
const COOKIE = 'tc_lang';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // 1. Lang from explicit query parameter
  const url = new URL(context.request.url);
  let lang = url.searchParams.get('lang') as Lang | null;

  // 2. Persisted cookie value
  if (!lang) {
    const cookieVal = context.cookies.get(COOKIE)?.value as Lang | undefined;
    if (cookieVal && SUPPORTED.includes(cookieVal)) lang = cookieVal;
  }

  // 3. Browser Accept-Language heuristic (first language, first 2 chars)
  if (!lang) {
    const header = context.request.headers.get('accept-language');
    if (header) {
      const preferred = header.split(',')[0]?.trim().toLowerCase().slice(0, 2);
      if (SUPPORTED.includes(preferred as Lang)) lang = preferred as Lang;
    }
  }

  // 4. Default fallback
  if (!lang || !SUPPORTED.includes(lang)) lang = 'pl';

  // Persist cookie if changed
  const existing = context.cookies.get(COOKIE)?.value;
  if (existing !== lang) {
    context.cookies.set(COOKIE, lang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });
  }

  // Expose to routes
  context.locals.lang = lang;

  return next();
};
