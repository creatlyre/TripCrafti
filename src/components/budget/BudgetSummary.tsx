/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useCallback } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

import type { BudgetSummary, BudgetMode } from '../../types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// Removed unused Progress import
import CategorySpendChart from './CategorySpendChart';

interface Props {
  tripId: string;
  refreshToken?: number;
  lang?: Lang;
  budgetMode?: BudgetMode;
}

export const BudgetSummaryWidget: React.FC<Props> = ({ tripId, refreshToken, lang = 'pl', budgetMode = 'simple' }) => {
  const dict = getDictionary(lang).budget!;
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/summary`);
      if (!res.ok) throw new Error(dict.errors?.summaryFailed || `Failed to load summary (${res.status})`);
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
  }, [load, refreshToken]);
  useEffect(() => {
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-brand-navy-light/40 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!summary) return null;

  // In simple mode we reinterpret stats to emphasize on-trip variable spend.
  const effectiveSpent = budgetMode === 'simple' ? summary.totalSpentOnTrip : summary.totalSpent;
  const effectiveRemaining =
    summary.totalBudget != null
      ? summary.totalBudget - (budgetMode === 'simple' ? summary.totalSpentOnTrip : summary.totalSpent)
      : null;
  const percent = summary.totalBudget ? Math.min(100, (effectiveSpent / summary.totalBudget) * 100) : 0;

  const STAT = (title: string, primary: string, secondary?: string, accent?: string) => (
    <Card className="bg-gradient-to-br from-brand-navy-light to-brand-navy-lighter border-2 border-brand-cyan/20 shadow-xl hover:shadow-brand-cyan/10 transition-all duration-300 hover:scale-105 hover:border-brand-cyan/40">
      <CardContent className="p-6 space-y-3">
        <p className="text-sm uppercase tracking-wider text-brand-cyan font-semibold">{title}</p>
        <p className={`text-xl font-bold text-white ${accent || ''}`}>{primary}</p>
        {secondary && (
          <p className="text-sm text-brand-cyan/70 font-mono bg-brand-cyan/5 px-2 py-1 rounded">{secondary}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {STAT(
          dict.summary.totalBudget,
          summary.totalBudget?.toFixed(2) ?? '—',
          summary.totalPlannedCategories
            ? `${dict.summary.plannedCategoriesShort} ${summary.totalPlannedCategories.toFixed(2)}`
            : undefined
        )}
        {STAT(
          budgetMode === 'simple' ? dict.summary.spent : dict.summary.spent,
          effectiveSpent.toFixed(2),
          budgetMode === 'simple'
            ? `${dict.summary.exclPreShort}${summary.totalSpentOnTrip.toFixed(2)}`
            : summary.totalSpentPrepaid
              ? `${dict.summary.spentPrepaidShort} ${summary.totalSpentPrepaid.toFixed(2)}`
              : undefined,
          'text-brand-cyan'
        )}
        {STAT(
          dict.summary.remaining,
          effectiveRemaining != null ? effectiveRemaining.toFixed(2) : '—',
          summary.totalBudget ? `${percent.toFixed(0)}${dict.summary.percentUsed}` : undefined,
          effectiveRemaining && effectiveRemaining < 0 ? 'text-brand-orange' : 'text-brand-cyan'
        )}
        {STAT(
          dict.summary.onTrip,
          summary.totalSpentOnTrip.toFixed(2),
          summary.totalSpentPrepaid
            ? `${dict.summary.spentPrepaidShort} ${summary.totalSpentPrepaid.toFixed(2)}`
            : undefined
        )}
        {STAT(
          dict.summary.dailyTarget,
          summary.dailySpendTarget != null ? summary.dailySpendTarget.toFixed(2) : '—',
          summary.safeToSpendToday != null ? `Safe: ${summary.safeToSpendToday.toFixed(2)}` : undefined
        )}
      </div>

      <Card className="border-2 border-brand-cyan/20 bg-gradient-to-br from-brand-navy-light to-brand-navy-lighter shadow-xl hover:shadow-brand-cyan/10 transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            📊 {dict.summary.progress}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm text-brand-cyan/90 font-medium">
            <span>
              💰 {dict.summary.spent} {effectiveSpent.toFixed(2)}
            </span>
            <span>🎯 {summary.totalBudget?.toFixed(2) ?? '—'}</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={dict.summary.progress}
            className="h-8 w-full rounded-full bg-brand-navy-dark/80 overflow-hidden shadow-inner border-2 border-brand-cyan/30 relative"
          >
            <div
              className="h-full bg-gradient-to-r from-brand-cyan via-brand-cyan/90 to-brand-orange transition-all duration-1000 ease-out shadow-lg relative"
              style={{ width: Math.max(2, percent) + '%' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg mix-blend-difference">
              {summary.totalBudget
                ? `${effectiveSpent.toFixed(0)} / ${summary.totalBudget.toFixed(0)} (${percent.toFixed(0)}%)`
                : `${effectiveSpent.toFixed(0)} spent`}
            </span>
          </div>
          {summary.remaining != null && (
            <p className="text-sm text-brand-cyan/80 bg-brand-cyan/5 px-3 py-2 rounded-lg border border-brand-cyan/20">
              💳 {dict.summary.remaining} {summary.remaining.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-brand-orange/20 bg-gradient-to-br from-brand-navy-light to-brand-navy-lighter shadow-xl hover:shadow-brand-orange/10 transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            📈 {dict.summary.categories}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.spentByCategory.length === 0 ? (
            <div className="text-sm text-brand-cyan/60">{dict.summary.categoriesEmpty}</div>
          ) : (
            <CategorySpendChart summary={summary} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSummaryWidget;
