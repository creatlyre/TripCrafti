import { z } from 'zod';

import { getSecret } from '@/lib/secrets';

const googleGeocodeResponseSchema = z.object({
  results: z.array(
    z.object({
      geometry: z.object({
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      }),
    })
  ),
  status: z.string(),
});

const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export async function getCoordinates(
  destination: string,
  runtimeEnv?: Record<string, string | undefined>,
  kv?: { get: (key: string) => Promise<string | null> }
): Promise<{ lat: number; long: number }> {
  const apiKey = await getSecret('GOOGLE_GEOCODING_API_KEY', {
    runtimeEnv,
    kv,
  });
  
  if (!apiKey) {
    throw new Error('Missing GOOGLE_GEOCODING_API_KEY environment variable');
  }

  const params = new URLSearchParams({
    address: destination,
    key: apiKey,
  });

  const response = await fetch(`${GEOCODE_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch coordinates: ${response.statusText}`);
  }

  const data = await response.json();
  const parsedData = googleGeocodeResponseSchema.parse(data);

  if (parsedData.status !== 'OK' || parsedData.results.length === 0) {
    throw new Error(`No coordinates found for destination: ${destination}. Status: ${parsedData.status}`);
  }

  const { lat, lng } = parsedData.results[0].geometry.location;
  return { lat, long: lng };
}
