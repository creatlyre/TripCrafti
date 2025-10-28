
import React from 'react';
import type { Trip, Itinerary, ItineraryPreferences } from '@/types';
import { ItineraryViewEnhanced as ItineraryView } from '@/components/itinerary/ItineraryViewEnhanced';
import { ItineraryPreferencesFormEnhanced as ItineraryPreferencesForm } from '@/components/itinerary/ItineraryPreferencesFormEnhanced';
import type { Lang } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';

interface ItineraryTabProps {
  trip: Trip & { itineraries: { id: string; generated_plan_json: Itinerary }[] };
  lang: Lang;
  onGenerate: (preferences: ItineraryPreferences) => void;
  onSave: (itineraryId: string, plan: Itinerary) => void;
  isGenerating: boolean;
  error: string | null;
}

const ItineraryTab: React.FC<ItineraryTabProps> = ({ trip, lang, onGenerate, onSave, isGenerating, error }) => {
  const rootDict = getDictionary(lang);
  const dict = rootDict.dashboard!;

  return (
    <div className="p-6 space-y-4 pb-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <p>{error}</p>
        </div>
      )}

      {trip.itineraries && trip.itineraries.length > 0 && trip.itineraries[0].generated_plan_json ? (
        <ItineraryView
          itineraryId={trip.itineraries[0].id}
          initialPlan={trip.itineraries[0].generated_plan_json}
          onSave={onSave}
          tripId={trip.id}
          tripCurrency={trip.currency}
          lang={lang}
        />
      ) : (
        <ItineraryPreferencesForm
          tripId={trip.id}
          onSubmit={onGenerate}
          isGenerating={isGenerating}
          language={lang}
          tripBudget={trip.budget}
          tripLodging={trip.lodging}
        />
      )}
    </div>
  );
};

export default ItineraryTab;
