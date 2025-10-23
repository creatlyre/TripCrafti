import { logDebug, logError } from '@/lib/log';
import { resolveRuntimeEnv } from '@/lib/utils';

/** Cache resolved secrets per key to avoid repeated KV lookups */
const secretCache = new Map<string, string | null>();

export interface SecretContext {
  runtimeEnv?: Record<string, string | undefined>;
  kv?: { get: (key: string) => Promise<string | null> };
}

/**
 * Resolve a secret in the following order:
 * PRODUCTION: 1. KV namespace, 2. runtimeEnv, 3. import.meta.env, 4. globalThis
 * DEVELOPMENT: 1. import.meta.env, 2. runtimeEnv, 3. process.env, 4. globalThis, 5. KV namespace
 */
export async function getSecret(key: string, ctx: SecretContext = {}): Promise<string | undefined> {
  if (secretCache.has(key)) {
    const cached = secretCache.get(key);
    return cached === null ? undefined : cached;
  }

  // In production, prioritize KV namespace for secrets
  if (import.meta.env.PROD && ctx.kv) {
    try {
      const kvVal = await ctx.kv.get(key);
      if (kvVal) {
        logDebug('Secret resolved from KV (production)', { key });
        secretCache.set(key, kvVal);
        return kvVal;
      }
    } catch (err) {
      logError('KV secret lookup failed', { key, err });
    }
  }

  // Try immediate resolution (import.meta.env, runtimeEnv, process.env, globalThis)
  const immediate = resolveRuntimeEnv(key, ctx.runtimeEnv);
  if (immediate) {
    secretCache.set(key, immediate);
    return immediate;
  }

  // In development, KV is fallback (for local development with --remote flag)
  if (!import.meta.env.PROD && ctx.kv) {
    try {
      const kvVal = await ctx.kv.get(key);
      if (kvVal) {
        logDebug('Secret resolved from KV (development fallback)', { key });
        secretCache.set(key, kvVal);
        return kvVal;
      }
    } catch (err) {
      logError('KV secret lookup failed (development)', { key, err });
    }
  }

  secretCache.set(key, null);
  return undefined;
}

export function primeGlobalSecret(key: string, value?: string) {
  if (!value) return;
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[key]) g[key] = value;
}
