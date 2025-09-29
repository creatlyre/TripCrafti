import type { MiddlewareHandler } from 'astro';
import type { Lang } from '../lib/i18n';

const SUPPORTED: Lang[] = ['pl', 'en'];
const COOKIE = 'tc_lang';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // 1. Lang from query
  const url = new URL(context.request.url);
  let lang = url.searchParams.get('lang') as Lang | null;

  // 2. From cookie
  if (!lang) {
    const cookieVal = context.cookies.get(COOKIE)?.value as Lang | undefined;
    if (cookieVal && SUPPORTED.includes(cookieVal)) lang = cookieVal;
  }

  // 3. From Accept-Language (very light heuristic)
  if (!lang) {
    const header = context.request.headers.get('accept-language');
    if (header) {
      const preferred = header.split(',')[0]?.trim().toLowerCase().slice(0,2);
      if (SUPPORTED.includes(preferred as Lang)) lang = preferred as Lang;
    }
  }

  // 4. Default
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
