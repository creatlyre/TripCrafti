import { z } from 'zod';

const geocodeResponseSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
  })
);

const GEOCODE_API_URL = 'https://geocode.maps.co/search';

export async function getCoordinates(destination: string): Promise<{ lat: number; long: number }> {
  const apiKey = import.meta.env.GEOCODE_MAPS_CO_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEOCODE_MAPS_CO_API_KEY environment variable');
  }

  const params = new URLSearchParams({
    q: destination,
    api_key: apiKey,
  });

  const response = await fetch(`${GEOCODE_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch coordinates: ${response.statusText}`);
  }

  const data = await response.json();
  const parsedData = geocodeResponseSchema.parse(data);

  if (parsedData.length === 0) {
    throw new Error(`No coordinates found for destination: ${destination}`);
  }

  const { lat, lon } = parsedData[0];
  return { lat: parseFloat(lat), long: parseFloat(lon) };
}