import type { SupabaseClient } from '@supabase/supabase-js';

import { randomBytes } from 'crypto';

import type { PackingShareLink } from '@/types';

// NOTE: We purposefully keep share link creation server-side.
// Token length: 32 bytes hex => 64 chars; sufficiently random.
export function generateShareToken(): string {
  return randomBytes(32).toString('hex');
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
  const { data, error } = await client
    .from('packing_share_links')
    .insert({ trip_id: tripId, token, expires_at: expiresAt?.toISOString() ?? null, can_modify: canModify })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Failed to create share link');
  return data as PackingShareLink;
}

export async function getShareLinkByToken(client: SupabaseClient, token: string): Promise<PackingShareLink | null> {
  const { data, error } = await client
    .from('packing_share_links')
    .select('*')
    .eq('token', token)
    .eq('revoked', false)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null; // expired
  return data as PackingShareLink;
}

export async function revokeShareLink(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('packing_share_links').update({ revoked: true }).eq('id', id);
  if (error) throw new Error(error.message);
}
