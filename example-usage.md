# Updated Event Service Usage

The eventService has been updated to use `geoPoint` (geohash) directly instead of lat/long coordinates, following the Ticketmaster API best practices.

## API Changes

### New Function Signature

```typescript
export interface EventSearchOptions {
  geoPoint: string; // Geohash string like 'u2u8wfw8p'
  startDate: string;
  endDate: string;
  classificationName?: string;
  genreId?: string[];
  subGenreId?: string[];
  typeId?: string[];
  subTypeId?: string[];
  locale?: string;
  radius?: string;
  units?: 'km' | 'miles';
}

export async function getEvents(options: EventSearchOptions): Promise<Event[]>
```

### Helper Function

```typescript
export function coordinatesToGeoPoint(lat: number, long: number, precision = 9): string
```

## Usage Examples

### Using geoPoint directly (recommended)
```typescript
const events = await getEvents({
  geoPoint: 'u2u8wfw8p', // Geohash for Krakow
  startDate: '2025-11-01',
  endDate: '2025-11-30'
});
```

### With classification filters
```typescript
const events = await getEvents({
  geoPoint: 'u2u8wfw8p',
  startDate: '2025-11-01',
  endDate: '2025-11-30',
  genreId: ['KnvZfZ7vAvv'], // Music genre ID
  locale: 'pl',
  radius: '50',
  units: 'km'
});
```

### Converting from coordinates
```typescript
const geoPoint = coordinatesToGeoPoint(50.058340, 19.933363); // Krakow coordinates
const events = await getEvents({
  geoPoint,
  startDate: '2025-11-01',
  endDate: '2025-11-30'
});
```

## API Endpoint Usage

### Option 1: Using geoPoint directly (recommended)
```
GET /api/events?geoPoint=u2u8wfw8p&startDate=2025-11-01&endDate=2025-11-30&genreId=KnvZfZ7vAvv&locale=pl&radius=20&unit=km
```

### Option 2: Using lat/long (converted automatically)
```
GET /api/events?lat=50.058340&long=19.933363&startDate=2025-11-01&endDate=2025-11-30&genreId=KnvZfZ7vAvv&locale=pl&radius=20&unit=km
```

## Key Changes

1. **Primary parameter**: Now uses `geoPoint` (geohash string) instead of lat/long objects
2. **Geohash examples**:
   - Krakow (Radisson Blu Hotel): `u2u8wfw8p`
   - Warsaw: `u33dc0h`
   - London: `gcpvj0`
3. **Backward compatibility**: API endpoint accepts both geoPoint and lat/long
4. **Helper function**: `coordinatesToGeoPoint()` converts coordinates to geohash
5. **Direct API calls**: Matches the curl example format exactly

## Real API Call Example

Based on your Krakow example, the actual Ticketmaster URL will be:

```
https://app.ticketmaster.com/discovery/v2/events.json?apikey=YOUR_API_KEY&geoPoint=u2u8wfw8p&radius=20&units=km&locale=pl&startDateTime=2025-11-01T00:00:00Z&endDateTime=2025-11-30T23:59:59Z&size=50
```

## Finding GeoPoint Values

1. **For Krakow (Radisson Blu Hotel)**:
   - Coordinates: `50.058340, 19.933363`
   - GeoPoint: `u2u8wfw8p`

2. **Online Tools**: Search for "geohash converter" or use geohash.org

3. **Using the helper function**:
   ```typescript
   const geoPoint = coordinatesToGeoPoint(50.058340, 19.933363);
   console.log(geoPoint); // outputs: u2u8wfw8p
   ```