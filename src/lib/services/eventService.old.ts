import ngeohash from 'ngeohash';
import { z } from 'zod';

import { logDebug, logError, logInfo } from '../log';

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
  page: z
    .object({
      totalElements: z.number(),
      totalPages: z.number(),
      number: z.number(),
      size: z.number(),
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
type TicketmasterEvent = z.infer<typeof ticketmasterEventSchema>;

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

  console.log('EventService: Starting event search with params:', {
    location,
    startDate,
    endDate,
    classificationName,
  });

  // Try multiple approaches for finding events
  const searchStrategies = [
    // Strategy 1: Use latlong parameter (deprecated but may work better)
    () => {
      const params = new URLSearchParams({
        latlong: `${location.lat},${location.long}`,
        radius: '50',
        unit: 'km',
        startDateTime: `${startDate}T00:00:00Z`,
        endDateTime: `${endDate}T23:59:59Z`,
        size: '50',
        apikey: apiKey,
      });
      if (classificationName) {
        params.append('classificationName', classificationName);
      }
      return params;
    },
    // Strategy 2: Use geoPoint (current approach)
    () => {
      const geoHash = ngeohash.encode(location.lat, location.long, 7);
      const params = new URLSearchParams({
        geoPoint: geoHash,
        radius: '50',
        unit: 'km',
        startDateTime: `${startDate}T00:00:00Z`,
        endDateTime: `${endDate}T23:59:59Z`,
        size: '50',
        apikey: apiKey,
      });
      if (classificationName) {
        params.append('classificationName', classificationName);
      }
      return params;
    },
    // Strategy 3: Use broader search without location restrictions
    () => {
      const params = new URLSearchParams({
        latlong: `${location.lat},${location.long}`,
        radius: '200',
        unit: 'km',
        startDateTime: `${startDate}T00:00:00Z`,
        endDateTime: `${endDate}T23:59:59Z`,
        size: '50',
        apikey: apiKey,
      });
      // Don't include classification for broader search
      return params;
    },
  ];

  for (let i = 0; i < searchStrategies.length; i++) {
    const params = searchStrategies[i]();
    const strategyName = i === 0 ? 'latlong' : i === 1 ? 'geoPoint' : 'broad-search';
    
    console.log(`EventService: Trying strategy ${i + 1} (${strategyName}):`, params.toString());

    try {
      const response = await fetch(`${TICKETMASTER_API_URL}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      console.log(`EventService: Strategy ${strategyName} response status:`, response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`EventService: Strategy ${strategyName} failed:`, response.statusText, errorBody);
        continue; // Try next strategy
      }

      const data = await response.json();
      console.log(`EventService: Strategy ${strategyName} raw response:`, {
        hasEmbedded: !!data._embedded,
        hasEvents: !!data._embedded?.events,
        eventCount: data._embedded?.events?.length || 0,
        totalElements: data.page?.totalElements,
      });

      const parsedResponse = ticketmasterResponseSchema.safeParse(data);

      if (!parsedResponse.success) {
        console.error(`EventService: Strategy ${strategyName} schema validation failed:`, parsedResponse.error);
        console.log('Raw data structure:', JSON.stringify(data, null, 2));
        continue;
      }

      if (!parsedResponse.data._embedded?.events || parsedResponse.data._embedded.events.length === 0) {
        console.log(`EventService: Strategy ${strategyName} returned no events`);
        continue; // Try next strategy
      }

      console.log(`EventService: Strategy ${strategyName} succeeded with ${parsedResponse.data._embedded.events.length} events`);
      
      // Process events and return
      const events = await processEvents(parsedResponse.data._embedded.events);
      console.log(`EventService: Processed ${events.length} valid events`);
      return events;

    } catch (error) {
      console.error(`EventService: Strategy ${strategyName} threw error:`, error);
      continue; // Try next strategy
    }
  }

  console.log('EventService: All strategies failed, returning empty array');
  return [];
}

async function processEvents(rawEvents: any[]): Promise<Event[]> {
  const events = rawEvents
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
