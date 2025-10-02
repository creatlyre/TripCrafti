import type { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import type { SharedItineraryLink } from '@/types';

/**
 * Generates a cryptographically secure, URL-safe token.
 * @returns A 40-character hex string.
 */
function generateShareToken(): string {
  return randomBytes(20).toString('hex');
}

interface CreateItineraryShareLinkOptions {
  tripId: string;
  userId: string;
  expiresAt?: Date | null;
}

/**
 * Creates a new shareable link for a trip itinerary.
 * @param client - The Supabase client instance.
 * @param options - The options for creating the share link.
 * @returns The newly created SharedItineraryLink object.
 */
export async function createItineraryShareLink(
  client: SupabaseClient,
  { tripId, userId, expiresAt = null }: CreateItineraryShareLinkOptions
): Promise<SharedItineraryLink> {
  const shareToken = generateShareToken();

  const { data, error } = await client
    .from('shared_itineraries')
    .insert({
      trip_id: tripId,
      share_token: shareToken,
      created_by: userId,
      expires_at: expiresAt?.toISOString() ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating itinerary share link:', error);
    throw new Error(error?.message || 'Failed to create itinerary share link.');
  }

  return data as SharedItineraryLink;
}

/**
 * Retrieves a shared itinerary link by its token, checking for validity and expiration.
 * @param client - The Supabase service role client instance.
 * @param token - The share token from the URL.
 * @returns The SharedItineraryLink object if found and valid, otherwise null.
 */
export async function getSharedItineraryByToken(
  client: SupabaseClient,
  token: string
): Promise<SharedItineraryLink | null> {
  const { data, error } = await client
    .from('shared_itineraries')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error) {
    // .single() throws an error if no rows are found, which is expected.
    // We can treat "not found" as a normal null return.
    if (error.code !== 'PGRST116') {
      console.error('Error fetching shared itinerary by token:', error);
    }
    return null;
  }

  if (!data) {
    return null;
  }

  // Check for expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.log(`Share token ${token} has expired.`);
    return null;
  }

  return data as SharedItineraryLink;
}