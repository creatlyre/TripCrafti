import React from 'react';

import type { Lang } from '@/lib/i18n';
import type { Trip, GeneratedItinerary } from '@/types';

import { EmptyState } from '@/components/EmptyState';
import { TripCard } from '@/components/TripCard';
import { TripCardSkeleton } from '@/components/TripCardSkeleton';
import { getDictionary } from '@/lib/i18n';

interface TripListProps {
  trips: (Trip & { itineraries: GeneratedItinerary[] })[] | null;
  loading: boolean;
  onOpenTrip: (trip: Trip & { itineraries: GeneratedItinerary[] }, tab?: string) => void;
  onDeleteTrip: (trip: Trip) => void;
  lang: Lang;
  onAddTrip: () => void;
}

export function TripList({ trips, loading, onOpenTrip, onDeleteTrip, lang, onAddTrip }: TripListProps) {
  const rootDict = getDictionary(lang);
  const dict = rootDict.dashboard!;
  if (loading && trips === null) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <TripCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && trips && trips.length === 0) {
    return (
      <EmptyState
        onActionClick={onAddTrip}
        dict={{
          heading: dict.empty.heading,
          description: dict.empty.description,
          action: dict.create.add,
        }}
      />
    );
  }

  if (trips && trips.length > 0) {
    return (
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trips.map((t) => (
          <TripCard
            key={t.id}
            trip={t}
            onOpen={(tab) => onOpenTrip(t, tab)}
            onDelete={onDeleteTrip}
            dict={{
              dates: dict.dates,
              budget: dict.budget,
              open: dict.open,
              openPlan: dict.openPlan,
              deleteAction: dict.delete?.confirm,
              budgetLink: rootDict.tripCard?.budgetLink,
              budgetAria: rootDict.tripCard?.budgetAria,
              quickActions: rootDict.tripCard?.quickActions,
              status: rootDict.tripCard?.status,
            }}
          />
        ))}
      </ul>
    );
  }

  return null;
}
