
import React from 'react';
import type { Trip } from '@/types';
import BudgetSummaryWidget from '@/components/budget/BudgetSummary';
import QuickAddExpense from '@/components/budget/QuickAddExpense';
import type { Lang } from '@/lib/i18n';

interface BudgetTabProps {
  trip: Trip;
  lang: Lang;
}

const BudgetTab: React.FC<BudgetTabProps> = ({ trip, lang }) => {
  return (
    <div className="space-y-6">
      <BudgetSummaryWidget tripId={trip.id} lang={lang} />
      <div className="flex items-center gap-3">
        <QuickAddExpense tripId={trip.id} lang={lang} buttonVariant="inline" />
        <a
          href={`/app/budget/${trip.id}`}
          className="text-[11px] px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
        >
          {lang === 'pl' ? 'Pełny widok' : 'Full view'}
        </a>
      </div>
    </div>
  );
};

export default BudgetTab;
