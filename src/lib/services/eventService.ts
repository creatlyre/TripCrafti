import { z } from 'zod';

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.array(z.number()),
  address: z.any(),
});

export type Event = z.infer<typeof eventSchema>;

const PREDICTHQ_API_URL = 'https://api.predicthq.com/v1/events';

export async function getEvents(
  location: { lat: number; long: number },
  startDate: string,
  endDate: string,
): Promise<Event[]> {
  const accessToken = import.meta.env.PREDICTHQ_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('Missing PREDICTHQ_ACCESS_TOKEN environment variable');
  }

  const params = new URLSearchParams({
    'location_around.origin': `${location.lat},${location.long}`,
    'start.gte': startDate,
    'end.lte': endDate,
    limit: '50',
  });

  const response = await fetch(`${PREDICTHQ_API_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(eventSchema).parse(data.results);
}