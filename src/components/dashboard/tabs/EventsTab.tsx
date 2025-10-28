
import React from 'react';
import type { Trip, Event } from '@/types';
import { EventFinder } from '@/components/itinerary/EventFinder';
import type { Lang } from '@/lib/i18n';

interface EventsTabProps {
  trip: Trip;
  lang: Lang;
  onAddEvent: (event: Event) => void;
}

const EventsTab: React.FC<EventsTabProps> = ({ trip, lang, onAddEvent }) => {
  return (
    <EventFinder trip={trip} onAddEvent={onAddEvent} lang={lang} />
  );
};

export default EventsTab;
