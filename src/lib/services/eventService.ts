import ngeohash from 'ngeohash';
import { z } from 'zod';

const placeSchema = z.object({
  name: z.string().optional(),
  location: z.object({
    longitude: z.string(),
    latitude: z.string(),
  }),
  address: z.object({
    line1: z.string(),
  }),
  city: z.object({
    name: z.string(),
  }),
  state: z
    .object({
      name: z.string(),
    })
    .optional(),
  country: z.object({
    countryCode: z.string(),
  }),
  postalCode: z.string().optional(),
});

const ticketmasterEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  info: z.string().optional(),
  pleaseNote: z.string().optional(),
  dates: z.object({
    start: z.object({
      dateTime: z.string(),
    }),
    end: z
      .object({
        dateTime: z.string(),
      })
      .optional(),
  }),
  _embedded: z
    .object({
      venues: z.array(
        z.object({
          name: z.string(),
          location: z.object({
            longitude: z.string(),
            latitude: z.string(),
          }),
          address: z.object({
            line1: z.string(),
          }),
          city: z.object({
            name: z.string(),
          }),
          state: z
            .object({
              name: z.string(),
            })
            .optional(),
          country: z.object({
            countryCode: z.string(),
          }),
          postalCode: z.string(),
        })
      ),
    })
    .optional(),
  place: placeSchema.optional(),
});

const ticketmasterResponseSchema = z.object({
  _embedded: z
    .object({
      events: z.array(ticketmasterEventSchema),
    })
    .optional(),
});

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  start: z.string(),
  end: z.string().optional(),
  location: z.array(z.number()),
  address: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

const TICKETMASTER_API_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

export async function getEvents(
  location: { lat: number; long: number },
  startDate: string,
  endDate: string,
  classificationName?: string
): Promise<Event[]> {
  const apiKey = import.meta.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TICKETMASTER_API_KEY environment variable');
  }

  const geoHash = ngeohash.encode(location.lat, location.long, 7);

  const params = new URLSearchParams({
    geoPoint: geoHash,
    startDateTime: `${startDate}T00:00:00Z`,
    endDateTime: `${endDate}T23:59:59Z`,
    size: '50',
    apikey: apiKey,
  });

  if (classificationName) {
    params.append('classificationName', classificationName);
  }

  const response = await fetch(`${TICKETMASTER_API_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch events: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const parsedResponse = ticketmasterResponseSchema.safeParse(data);

  if (!parsedResponse.success || !parsedResponse.data._embedded) {
    return [];
  }

  const events = parsedResponse.data._embedded.events
    .map((event) => {
      const venue = event._embedded?.venues?.[0] || event.place;

      if (!venue) {
        return null;
      }
      const addressParts = [
        venue.address.line1,
        venue.city.name,
        venue.state?.name,
        venue.postalCode,
        venue.country.countryCode,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        id: event.id,
        title: event.name,
        description: event.info || event.pleaseNote,
        start: event.dates.start.dateTime,
        end: event.dates.end?.dateTime,
        location: [parseFloat(venue.location.latitude), parseFloat(venue.location.longitude)],
        address: addressParts || venue.name || '',
      };
    })
    .filter((event): event is Event => event !== null);

  return z.array(eventSchema).parse(events);
}
