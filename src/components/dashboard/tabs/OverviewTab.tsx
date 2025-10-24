
import React from 'react';
import type { Trip, GeneratedItinerary } from '@/types';
import { TripOverviewPanel } from '@/components/TripOverviewPanel';
import type { Lang } from '@/lib/i18n';

interface OverviewTabProps {
  trip: Trip & { itineraries: GeneratedItinerary[] };
  lang: Lang;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ trip, lang }) => {
  return (
    <TripOverviewPanel
      trip={trip}
      itineraries={trip.itineraries || []}
      lang={lang}
    />
  );
};

export default OverviewTab;
