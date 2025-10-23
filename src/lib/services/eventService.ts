import geohash from 'ngeohash';
import { z } from 'zod';

import { logDebug, logError, logInfo } from '../log';

// Helper function to convert lat/long to geoPoint (geohash)
export function coordinatesToGeoPoint(lat: number, long: number, precision = 9): string {
  return geohash.encode(lat, long, precision);
}

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
      dateTime: z.string().optional(),
      localDate: z.string().optional(),
      localTime: z.string().optional(),
      dateTBD: z.boolean().optional(),
      dateTBA: z.boolean().optional(),
      timeTBA: z.boolean().optional(),
      noSpecificTime: z.boolean().optional(),
    }),
    end: z
      .object({
        dateTime: z.string().optional(),
        localDate: z.string().optional(),
        localTime: z.string().optional(),
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

export interface EventSearchOptions {
  geoPoint: string; // Geohash string like 'u2yhv8g4c' (correct Krakow hash)
  startDate: string;
  endDate: string;
  classificationName?: string;
  genreId?: string[];
  subGenreId?: string[];
  typeId?: string[];
  subTypeId?: string[];
  locale?: string;
  radius?: string;
  unit?: 'km' | 'miles'; // Changed from 'units' to 'unit'
}

const TICKETMASTER_API_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

export async function getEvents(options: EventSearchOptions): Promise<Event[]> {
  const {
    geoPoint,
    startDate,
    endDate,
    classificationName,
    genreId,
    subGenreId,
    typeId,
    subTypeId,
    locale = 'pl',
    radius = '20',
    unit = 'km', // Changed from 'units' to 'unit'
  } = options;
  const apiKey = import.meta.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TICKETMASTER_API_KEY environment variable');
  }

  logInfo('EventService: Starting event search', {
    geoPoint,
    startDate,
    endDate,
    classificationName,
    genreId,
    subGenreId,
    typeId,
    subTypeId,
    locale,
    radius,
    unit, // Changed from 'units' to 'unit'
  });

  // Use provided geoPoint directly
  const params = new URLSearchParams({
    geoPoint,
    radius,
    unit, // Changed from 'units' to 'unit'
    startDateTime: `${startDate}T00:00:00Z`,
    endDateTime: `${endDate}T23:59:59Z`,
    size: '50',
    locale,
    apikey: apiKey,
  });

  // Add classification filters if provided
  if (classificationName) {
    params.append('classificationName', classificationName);
  }

  if (genreId && genreId.length > 0) {
    genreId.forEach((id) => params.append('genreId', id));
  }

  if (subGenreId && subGenreId.length > 0) {
    subGenreId.forEach((id) => params.append('subGenreId', id));
  }

  if (typeId && typeId.length > 0) {
    typeId.forEach((id) => params.append('typeId', id));
  }

  if (subTypeId && subTypeId.length > 0) {
    subTypeId.forEach((id) => params.append('subTypeId', id));
  }

  const fullApiUrl = `${TICKETMASTER_API_URL}?${params.toString()}`;

  logDebug('EventService: Using geoPoint strategy', params.toString());
  logInfo('🌐 Ticketmaster API Endpoint URL', fullApiUrl);

  try {
    const response = await fetch(fullApiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    logDebug('EventService: Response status', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      logError('EventService: API request failed', `${response.statusText} - ${errorBody}`);
      return [];
    }

    const data = await response.json();
    logDebug('EventService: Raw response', {
      hasEmbedded: !!data._embedded,
      hasEvents: !!data._embedded?.events,
      eventCount: data._embedded?.events?.length || 0,
      totalElements: data.page?.totalElements,
    });

    const parsedResponse = ticketmasterResponseSchema.safeParse(data);

    if (!parsedResponse.success) {
      logError('EventService: Schema validation failed', parsedResponse.error);
      logDebug('Raw data structure', JSON.stringify(data, null, 2));

      // Log specific event data that's failing validation
      if (data._embedded?.events) {
        data._embedded.events.forEach((event: unknown, index: number) => {
          const eventData = event as Record<string, unknown>;
          const dates = eventData.dates as Record<string, unknown>;
          const start = dates?.start as Record<string, unknown>;

          logDebug(`Event ${index} dates structure:`, {
            name: eventData.name,
            dates: eventData.dates,
            hasDateTime: !!start?.dateTime,
            hasLocalDate: !!start?.localDate,
            hasDateOnly: !!start?.date,
          });
        });
      }

      return [];
    }

    if (!parsedResponse.data._embedded?.events || parsedResponse.data._embedded.events.length === 0) {
      logDebug('EventService: No events found');
      return [];
    }

    logInfo(`EventService: Found ${parsedResponse.data._embedded.events.length} events`);

    // Process events and return
    const events = await processEvents(parsedResponse.data._embedded.events);
    logInfo(`EventService: Processed ${events.length} valid events`);
    return events;
  } catch (error) {
    logError('EventService: Request threw error', error);
    return [];
  }
}

async function processEvents(rawEvents: TicketmasterEvent[]): Promise<Event[]> {
  const events: (Event | null)[] = rawEvents.map((event) => {
    const venue = event._embedded?.venues?.[0] || event.place;

    if (!venue) {
      return null;
    }

    // Handle flexible date formats
    const startDate = getEventStartDate(event.dates.start);
    const endDate = getEventEndDate(event.dates.end);

    if (!startDate) {
      logDebug('EventService: Skipping event with no valid start date', {
        eventId: event.id,
        eventName: event.name,
        dates: event.dates,
      });
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
      description: event.info || event.pleaseNote || null,
      start: startDate,
      end: endDate,
      location: [parseFloat(venue.location.latitude), parseFloat(venue.location.longitude)],
      address: addressParts || venue.name || '',
    };
  });

  const validEvents = events.filter((event): event is Event => event !== null);
  return z.array(eventSchema).parse(validEvents);
}

// Helper function to extract a valid start date from various formats
function getEventStartDate(startInfo: {
  dateTime?: string;
  localDate?: string;
  localTime?: string;
  dateTBD?: boolean;
  dateTBA?: boolean;
  timeTBA?: boolean;
  noSpecificTime?: boolean;
}): string | null {
  // Priority order: dateTime > localDate + localTime > localDate only
  if (startInfo.dateTime) {
    return startInfo.dateTime;
  }

  if (startInfo.localDate) {
    if (startInfo.localTime) {
      // Combine date and time
      return `${startInfo.localDate}T${startInfo.localTime}`;
    } else {
      // Date only, assume start of day
      return `${startInfo.localDate}T00:00:00`;
    }
  }

  // Handle TBD/TBA cases - we can't process these events
  if (startInfo.dateTBD || startInfo.dateTBA) {
    return null;
  }

  return null;
}

// Helper function to extract end date
function getEventEndDate(endInfo?: { dateTime?: string; localDate?: string; localTime?: string }): string | undefined {
  if (!endInfo) return undefined;

  if (endInfo.dateTime) {
    return endInfo.dateTime;
  }

  if (endInfo.localDate) {
    if (endInfo.localTime) {
      return `${endInfo.localDate}T${endInfo.localTime}`;
    } else {
      return `${endInfo.localDate}T23:59:59`;
    }
  }

  return undefined;
}
