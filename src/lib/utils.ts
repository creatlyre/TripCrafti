import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Compute remaining daily spend target given remaining amount and trip date window.
// If trip finished returns 0. If not started uses start date as baseline.
export function computeDailySpendTarget(
  remaining: number | null,
  startDate: string,
  endDate: string,
  now: Date = new Date()
): number | null {
  if (remaining == null) return null;
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  if (now > end) return 0; // trip completed
  const current = now < start ? start : now;
  const daysLeft = Math.max(1, Math.round((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24) + 1));
  return remaining / daysLeft;
}

/**
 * Resolve an environment variable with multiple fallbacks suitable for Cloudflare Pages runtime.
 * Order of precedence:
 * 1. Build-time substitution (import.meta.env)
 * 2. Provided runtime object (Astro locals.runtime?.env)
 * 3. process.env (during local dev / tests)
 * 4. Global fallback (tests may assign on globalThis)
 */
export function resolveRuntimeEnv(key: string, runtimeEnv?: Record<string, string | undefined>): string | undefined {
  // import.meta.env is typed but we need index signature at runtime
  const buildTime = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.[key];
  if (buildTime) return buildTime;
  if (runtimeEnv?.[key]) return runtimeEnv[key];
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  const globalVal = (globalThis as unknown as Record<string, string | undefined>)[key];
  return globalVal;
}
