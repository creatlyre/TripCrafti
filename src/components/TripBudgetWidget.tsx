/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';

import type { BudgetSummary } from '@/types';

import { getDictionary, type Lang } from '@/lib/i18n';

import CategorySpendChart from './budget/CategorySpendChart';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  tripId: string;
  lang?: Lang;
  className?: string;
}

/**
 * Compact budget widget for trip dashboard / overview.
 * Shows: progress bar, spent vs budget, safe-to-spend today and mini category chart.
 */
export const TripBudgetWidget: React.FC<Props> = ({ tripId, lang = 'pl', className }) => {
  const dict = getDictionary(lang).budget!;
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/summary`);
      if (!res.ok) throw new Error(dict.errors?.summaryFailed || 'Failed');
      const data: BudgetSummary = await res.json();
      setSummary(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tripId, dict.errors?.summaryFailed]);
  useEffect(() => {
    load();
  }, [load]);
  // Listen for global expense added to update instantly
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      if (detail.tripId === tripId) load();
    }
    window.addEventListener('expense:added', handler);
    return () => window.removeEventListener('expense:added', handler);
  }, [tripId, load]);

  if (loading)
    return (
      <Card className={'h-full bg-slate-900/60 border-slate-700 animate-pulse ' + (className || '')}>
        <CardContent className="p-4 h-40" />
      </Card>
    );
  if (error)
    return (
      <Card className={'bg-red-950/30 border-red-800 ' + (className || '')}>
        <CardContent className="p-4 text-xs text-red-400">{error}</CardContent>
      </Card>
    );
  if (!summary) return null;

  const percent = summary.totalBudget ? Math.min(100, (summary.totalSpent / summary.totalBudget) * 100) : 0;

  return (
    <Card className={'bg-slate-900/60 border-slate-700 flex flex-col ' + (className || '')}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{lang === 'pl' ? 'Budżet' : 'Budget'}</span>
          {summary.safeToSpendToday != null && (
            <span className="text-[11px] font-medium text-emerald-300">
              {lang === 'pl' ? 'Bezpieczne:' : 'Safe:'} {summary.safeToSpendToday.toFixed(2)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        <div className="space-y-1">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={dict.summary.progress}
            className="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden border border-slate-700 shadow-inner relative"
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: percent + '%' }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/70">
              {summary.totalBudget
                ? `${summary.totalSpent.toFixed(0)} / ${summary.totalBudget.toFixed(0)} (${percent.toFixed(0)}%)`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>
              {dict.summary.spent} {summary.totalSpent.toFixed(2)}
            </span>
            <span>{summary.totalBudget?.toFixed(2) ?? '—'}</span>
          </div>
        </div>
        <div className="flex-1 min-h-[90px]">
          {summary.spentByCategory.length === 0 ? (
            <p className="text-[11px] text-slate-500">{dict.summary.categoriesEmpty}</p>
          ) : (
            <CategorySpendChart summary={summary} />
          )}
        </div>
        {summary.dailySpendTarget != null && (
          <p className="text-[11px] text-slate-500">
            {dict.summary.dailyTarget}: {summary.dailySpendTarget.toFixed(2)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TripBudgetWidget;
