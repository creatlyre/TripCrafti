import type { SupabaseClient } from '@supabase/supabase-js';

import type { PackingShareLink } from '@/types';

import { logDebug, logError } from '@/lib/log';

// NOTE: We purposefully keep share link creation server-side.
// Token length: 32 bytes hex => 64 chars; sufficiently random.
export function generateShareToken(): string {
  // Use Web Crypto for Cloudflare / Edge compatibility
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

interface CreateShareLinkOptions {
  tripId: string;
  expiresAt?: Date | null;
  canModify?: boolean;
}

export async function createPackingShareLink(
  client: SupabaseClient,
  { tripId, expiresAt = null, canModify = true }: CreateShareLinkOptions
): Promise<PackingShareLink> {
  const token = generateShareToken();
  logDebug('Creating packing share link', { tripId, expiresAt, canModify });
  const { data, error } = await client
    .from('packing_share_links')
    .insert({ trip_id: tripId, token, expires_at: expiresAt?.toISOString() ?? null, can_modify: canModify })
    .select('*')
    .single();
  if (error || !data) {
    logError('Failed to create packing share link', error, { tripId });
    throw new Error(error?.message || 'Failed to create share link');
  }
  logDebug('Packing share link created', { id: data.id, token: data.token.slice(0, 8) + '…' });
  return data as PackingShareLink;
}

export async function getShareLinkByToken(client: SupabaseClient, token: string): Promise<PackingShareLink | null> {
  logDebug('Fetching share link by token', { token: token.slice(0, 8) + '…' });
  const { data, error } = await client
    .from('packing_share_links')
    .select('*')
    .eq('token', token)
    .eq('revoked', false)
    .limit(1)
    .maybeSingle();
  if (error) {
    logError('Error fetching share link by token', error);
    throw new Error(error.message);
  }
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null; // expired
  return data as PackingShareLink;
}

export async function revokeShareLink(client: SupabaseClient, id: string): Promise<void> {
  logDebug('Revoking share link', { id });
  const { error } = await client.from('packing_share_links').update({ revoked: true }).eq('id', id);
  if (error) {
    logError('Error revoking share link', error, { id });
    throw new Error(error.message);
  }
}
