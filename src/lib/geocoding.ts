// Simple geocoding helper using OpenStreetMap Nominatim (no key required)
// NOTE: For production consider rate limiting & user-agent header compliance.
export interface GeoPoint { lat: number; lon: number; raw?: any }

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'TripCrafti/1.0 (learning project)' } });
  if (!res.ok) throw new Error('GeocodeFailed:' + res.status);
  return res.json();
}

export async function geocode(query: string): Promise<GeoPoint | null> {
  if (!query.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const data = await fetchJson(url);
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      return { lat: parseFloat(first.lat), lon: parseFloat(first.lon), raw: first };
    }
  } catch (e) {
    console.warn('[geocode] failed', e);
  }
  return null;
}
