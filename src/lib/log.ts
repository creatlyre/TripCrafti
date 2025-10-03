/* Lightweight logging helper; avoids leaking secrets and can be tree-shaken.
 * Usage: import { logDebug, logError } from '@/lib/log';
 */

const _rawDebug = (import.meta.env.DEBUG_LOGGING ?? '') as unknown;
const DEBUG_ENABLED =
  (typeof _rawDebug === 'string' && _rawDebug.toLowerCase() === 'true') ||
  (typeof _rawDebug === 'boolean' && _rawDebug === true);

export function logDebug(message: string, meta?: unknown) {
  if (!DEBUG_ENABLED) return;
  try {
    // eslint-disable-next-line no-console
    console.log(`[debug] ${message}`, meta ?? '');
  } catch {
    /* noop */
  }
}

export function logError(message: string, err?: unknown, meta?: unknown) {
  try {
    // eslint-disable-next-line no-console
    console.error(`[error] ${message}`, err instanceof Error ? err.message : err, meta ?? '');
  } catch {
    /* noop */
  }
}

export function logInfo(message: string, meta?: unknown) {
  if (!DEBUG_ENABLED) return;
  try {
    // eslint-disable-next-line no-console
    console.info(`[info] ${message}`, meta ?? '');
  } catch {
    /* noop */
  }
}

export function redact(value: string | undefined | null, show = 4) {
  if (!value) return 'unset';
  if (value.length <= show * 2) return `${value.slice(0, show)}***`;
  return `${value.slice(0, show)}***${value.slice(-show)}`;
}
