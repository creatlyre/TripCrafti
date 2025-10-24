
import React from 'react';
import type { Trip } from '@/types';
import PackingAssistant from '@/components/PackingAssistant';
import type { Lang } from '@/lib/i18n';

interface PackingTabProps {
  trip: Trip;
  lang: Lang;
}

const PackingTab: React.FC<PackingTabProps> = ({ trip, lang }) => {
  return (
    <PackingAssistant
      tripId={trip.id}
      trip={trip}
      lang={lang}
      actionSlot={
        <a
          href={`/app/packing/${trip.id}?lang=${lang}`}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-indigo-500/50 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 hover:text-white transition-colors"
        >
          {lang === 'pl' ? 'Tryb pakowania' : 'Let’s Pack'}
        </a>
      }
      enableBulkDelete
    />
  );
};

export default PackingTab;
