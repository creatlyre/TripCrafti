import geohash from 'ngeohash';
import { z } from 'zod';

import { logDebug, logError, logInfo } from '../log';

// Rate limiting helper - wait between API calls to respect Ticketmaster limits
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Rate limit delay in milliseconds (Ticketmaster allows 5 requests per second)
const RATE_LIMIT_DELAY = 250; // 250ms delay between requests

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
  images: z
    .array(
      z.object({
        ratio: z.string().optional(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
        fallback: z.boolean().optional(),
      })
    )
    .optional(),
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
  images: z
    .array(
      z.object({
        ratio: z.string().optional(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
        fallback: z.boolean().optional(),
      })
    )
    .optional(),
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
    radius = '50',
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

  // Try the search with locale first
  const eventsWithLocale = await performEventSearch({
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
    unit,
    apiKey,
  });

  // If we found events with locale, return them
  if (eventsWithLocale.length > 0) {
    logInfo(`EventService: Found ${eventsWithLocale.length} events with locale '${locale}'`);
    return eventsWithLocale;
  }

  // If no events found with locale, try without locale as fallback
  logInfo(`EventService: No events found with locale '${locale}', trying fallback without locale`);

  // Add delay to respect rate limits before making the second API call
  logDebug(`EventService: Adding ${RATE_LIMIT_DELAY}ms delay before fallback request`);
  await delay(RATE_LIMIT_DELAY);

  const eventsWithoutLocale = await performEventSearch({
    geoPoint,
    startDate,
    endDate,
    classificationName,
    genreId,
    subGenreId,
    typeId,
    subTypeId,
    locale: undefined, // Remove locale for fallback
    radius,
    unit,
    apiKey,
  });

  if (eventsWithoutLocale.length > 0) {
    logInfo(`EventService: Found ${eventsWithoutLocale.length} events without locale (fallback)`);
  } else {
    logInfo('EventService: No events found even without locale');
  }

  return eventsWithoutLocale;
}

async function performEventSearch(searchParams: {
  geoPoint: string;
  startDate: string;
  endDate: string;
  classificationName?: string;
  genreId?: string[];
  subGenreId?: string[];
  typeId?: string[];
  subTypeId?: string[];
  locale?: string;
  radius: string;
  unit: string;
  apiKey: string;
}): Promise<Event[]> {
  const {
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
    unit,
    apiKey,
  } = searchParams;

  // Build base parameters
  const params = new URLSearchParams({
    geoPoint,
    radius,
    unit,
    startDateTime: `${startDate}T00:00:00Z`,
    endDateTime: `${endDate}T23:59:59Z`,
    size: '50',
    apikey: apiKey,
  });

  // Add locale only if provided
  if (locale) {
    params.append('locale', locale);
  }

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

  // 🔍 Enhanced Logging for Manual Testing
  logDebug('\n=== TICKETMASTER EVENTS SEARCH API CALL ===');
  logDebug('🗺️  GeoPoint:', geoPoint);
  logDebug('📅 Date Range:', `${startDate} to ${endDate}`);
  logDebug('🏷️  Classifications:', classificationName);
  logDebug('🌍 Locale:', locale || 'none (fallback)');
  logDebug('🔗 Full API URL for manual testing:', fullApiUrl);
  logDebug('💡 You can test this URL directly in your browser or Postman');
  logDebug('===============================================');

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
      locale: locale || 'none',
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
      logDebug(`EventService: No events found${locale ? ` with locale '${locale}'` : ' without locale'}`);
      return [];
    }

    logInfo(
      `EventService: Found ${parsedResponse.data._embedded.events.length} events${locale ? ` with locale '${locale}'` : ' without locale'}`
    );

    // Process events and return
    const events = await processEvents(parsedResponse.data._embedded.events);
    logInfo(
      `EventService: Processed ${events.length} valid events${locale ? ` with locale '${locale}'` : ' without locale'}`
    );
    return events;
  } catch (error) {
    logError(`EventService: Request threw error${locale ? ` with locale '${locale}'` : ' without locale'}`, error);
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
      images: event.images || undefined,
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

// Schema for detailed event response
const eventDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  info: z.string().optional(),
  pleaseNote: z.string().optional(),
  url: z.string().optional(),
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
  classifications: z
    .array(
      z.object({
        primary: z.boolean().optional(),
        segment: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
        genre: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
        subGenre: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
        type: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
        subType: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
      })
    )
    .optional(),
  priceRanges: z
    .array(
      z.object({
        type: z.string(),
        currency: z.string(),
        min: z.number(),
        max: z.number(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        ratio: z.string().optional(),
        url: z.string(),
        width: z.number(),
        height: z.number(),
        fallback: z.boolean().optional(),
      })
    )
    .optional(),
  sales: z
    .object({
      public: z
        .object({
          startDateTime: z.string().optional(),
          endDateTime: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  _embedded: z
    .object({
      venues: z.array(
        z.object({
          name: z.string(),
          type: z.string().optional(),
          id: z.string(),
          location: z.object({
            longitude: z.string(),
            latitude: z.string(),
          }),
          address: z.object({
            line1: z.string(),
            line2: z.string().optional(),
            line3: z.string().optional(),
          }),
          city: z.object({
            name: z.string(),
          }),
          state: z
            .object({
              name: z.string(),
              stateCode: z.string().optional(),
            })
            .optional(),
          country: z.object({
            name: z.string(),
            countryCode: z.string(),
          }),
          postalCode: z.string().optional(),
          url: z.string().optional(),
          images: z
            .array(
              z.object({
                ratio: z.string().optional(),
                url: z.string(),
                width: z.number(),
                height: z.number(),
                fallback: z.boolean().optional(),
              })
            )
            .optional(),
          boxOfficeInfo: z
            .object({
              phoneNumberDetail: z.string().optional(),
              openHoursDetail: z.string().optional(),
              acceptedPaymentDetail: z.string().optional(),
              willCallDetail: z.string().optional(),
            })
            .optional(),
          parkingDetail: z.string().optional(),
          accessibleSeatingDetail: z.string().optional(),
          generalInfo: z
            .object({
              generalRule: z.string().optional(),
              childRule: z.string().optional(),
            })
            .optional(),
        })
      ),
      attractions: z
        .array(
          z.object({
            name: z.string(),
            type: z.string().optional(),
            id: z.string(),
            url: z.string().optional(),
            images: z
              .array(
                z.object({
                  ratio: z.string().optional(),
                  url: z.string(),
                  width: z.number(),
                  height: z.number(),
                  fallback: z.boolean().optional(),
                })
              )
              .optional(),
            classifications: z
              .array(
                z.object({
                  primary: z.boolean().optional(),
                  segment: z
                    .object({
                      id: z.string(),
                      name: z.string(),
                    })
                    .optional(),
                  genre: z
                    .object({
                      id: z.string(),
                      name: z.string(),
                    })
                    .optional(),
                  subGenre: z
                    .object({
                      id: z.string(),
                      name: z.string(),
                    })
                    .optional(),
                  type: z
                    .object({
                      id: z.string(),
                      name: z.string(),
                    })
                    .optional(),
                  subType: z
                    .object({
                      id: z.string(),
                      name: z.string(),
                    })
                    .optional(),
                })
              )
              .optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type EventDetails = z.infer<typeof eventDetailsSchema>;

const TICKETMASTER_EVENT_DETAILS_URL = 'https://app.ticketmaster.com/discovery/v2/events';

export async function getEventDetails(eventId: string, locale = 'pl'): Promise<EventDetails> {
  const apiKey = import.meta.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TICKETMASTER_API_KEY environment variable');
  }

  logInfo('EventService: Fetching event details', { eventId, locale });

  try {
    // Try with locale first
    const eventWithLocale = await performEventDetailsRequest(eventId, locale, apiKey);
    logInfo(`EventService: Event details found with locale '${locale}'`);
    return eventWithLocale;
  } catch {
    // If failed with locale, try without locale as fallback
    logInfo(`EventService: Failed to fetch event details with locale '${locale}', trying fallback without locale`);

    // Add delay to respect rate limits before making the second API call
    logDebug(`EventService: Adding ${RATE_LIMIT_DELAY}ms delay before fallback request`);
    await delay(RATE_LIMIT_DELAY);

    try {
      const eventWithoutLocale = await performEventDetailsRequest(eventId, undefined, apiKey);
      logInfo('EventService: Event details found without locale (fallback)');
      return eventWithoutLocale;
    } catch (fallbackError) {
      logError('EventService: Failed to fetch event details even without locale', fallbackError);
      throw fallbackError;
    }
  }
}

async function performEventDetailsRequest(
  eventId: string,
  locale: string | undefined,
  apiKey: string
): Promise<EventDetails> {
  const params = new URLSearchParams({
    apikey: apiKey,
  });

  // Add locale only if provided
  if (locale) {
    params.append('locale', locale);
  }

  const fullApiUrl = `${TICKETMASTER_EVENT_DETAILS_URL}/${eventId}.json?${params.toString()}`;

  logInfo('🌐 Ticketmaster Event Details API URL', fullApiUrl);

  // 🔍 Enhanced Logging for Manual Testing
  logDebug('\n=== TICKETMASTER EVENT DETAILS API CALL ===');
  logDebug('🎟️  Event ID:', eventId);
  logDebug('🌍 Locale:', locale || 'none (fallback)');
  logDebug('🔗 Full API URL for manual testing:', fullApiUrl);
  logDebug('💡 You can test this URL directly in your browser or Postman');
  logDebug('===============================================');

  const response = await fetch(fullApiUrl, {
    headers: {
      Accept: 'application/json',
    },
  });

  logDebug('EventService: Event details response status', response.status);

  if (!response.ok) {
    const errorBody = await response.text();
    logError('EventService: Event details API request failed', `${response.statusText} - ${errorBody}`);
    throw new Error(`Failed to fetch event details: ${response.statusText}`);
  }

  const data = await response.json();
  logDebug('EventService: Event details raw response received');

  const parsedResponse = eventDetailsSchema.safeParse(data);

  if (!parsedResponse.success) {
    logError('EventService: Event details schema validation failed', parsedResponse.error);
    throw new Error('Invalid event details response format');
  }

  // 🐛 Debug classifications data
  logDebug('🏷️  Classifications in response:', data.classifications);
  logDebug('🏷️  Classifications count:', data.classifications?.length || 0);
  if (data.classifications && data.classifications.length > 0) {
    logDebug('🏷️  First classification:', JSON.stringify(data.classifications[0], null, 2));
  }

  logInfo('EventService: Event details successfully parsed');
  return parsedResponse.data;
}
