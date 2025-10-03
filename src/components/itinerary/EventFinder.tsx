import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Event } from '@/lib/services/eventService';

interface EventFinderProps {
  trip: {
    destination: string;
    start_date: string;
    end_date: string;
  };
  onAddEvent: (event: Event) => void;
}

export function EventFinder({ trip, onAddEvent }: EventFinderProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function findEvents() {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Geocode the destination to get coordinates
      const geocodeRes = await fetch(`/api/geocode?destination=${encodeURIComponent(trip.destination)}`);
      if (!geocodeRes.ok) {
        const body = await geocodeRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to geocode destination');
      }
      const location = await geocodeRes.json();

      // Step 2: Fetch events using the coordinates
      const eventsRes = await fetch(
        `/api/events?lat=${location.lat}&long=${location.long}&startDate=${trip.start_date}&endDate=${trip.end_date}`
      );
      if (!eventsRes.ok) {
        const body = await eventsRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch events');
      }
      const data = await eventsRes.json();
      setEvents(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={findEvents} disabled={loading}>
        {loading ? 'Searching for events...' : 'Find Local Events'}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
      {events.length > 0 && (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-md">
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-slate-400">{new Date(event.start).toLocaleString()}</p>
              </div>
              <Button size="sm" onClick={() => onAddEvent(event)}>
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}