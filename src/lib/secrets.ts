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
 * 1. import.meta.env
 * 2. runtimeEnv (locals.runtime?.env)
 * 3. process.env (dev / tests)
 * 4. globalThis
 * 5. KV namespace (if provided)
 */
export async function getSecret(key: string, ctx: SecretContext = {}): Promise<string | undefined> {
  if (secretCache.has(key)) {
    const cached = secretCache.get(key);
    return cached === null ? undefined : cached;
  }

  // 1-4 via helper / runtimeEnv override
  const immediate = resolveRuntimeEnv(key, ctx.runtimeEnv);
  if (immediate) {
    secretCache.set(key, immediate);
    return immediate;
  }

  // 5 KV fallback
  if (ctx.kv) {
    try {
      const kvVal = await ctx.kv.get(key);
      if (kvVal) {
        logDebug('Secret resolved from KV', { key });
        secretCache.set(key, kvVal);
        return kvVal;
      }
    } catch (err) {
      logError('KV secret lookup failed', { key, err });
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
