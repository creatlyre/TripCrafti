import React, { useEffect, useState } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

import type { BudgetSummary, BudgetMode } from '../../types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/summary`);
      if (!res.ok) throw new Error(dict.errors?.summaryFailed || `Failed to load summary (${res.status})`);
      const data = await res.json();
      setSummary(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tripId, refreshToken]);
  useEffect(() => {
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [tripId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-800/40 animate-pulse" />
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
    <Card className="bg-slate-900/60 border-slate-700">
      <CardContent className="p-4 space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{title}</p>
        <p className={`text-sm font-semibold text-slate-100 ${accent || ''}`}>{primary}</p>
        {secondary && <p className="text-[11px] text-slate-500 font-mono">{secondary}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
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
          'text-emerald-300'
        )}
        {STAT(
          dict.summary.remaining,
          effectiveRemaining != null ? effectiveRemaining.toFixed(2) : '—',
          summary.totalBudget ? `${percent.toFixed(0)}${dict.summary.percentUsed}` : undefined,
          'text-amber-300'
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

      <Card className="border-slate-700 bg-slate-900/60 shadow-inner">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{dict.summary.progress}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>
              {dict.summary.spent} {summary.totalSpent.toFixed(2)}
            </span>
            <span>{summary.totalBudget?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all"
              style={{ width: percent + '%' }}
            />
          </div>
          {summary.remaining != null && (
            <p className="text-[11px] text-slate-500">
              {dict.summary.remaining} {summary.remaining.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-900/60 shadow-inner">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{dict.summary.categories}</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.spentByCategory.length === 0 ? (
            <div className="text-xs text-slate-500">{dict.summary.categoriesEmpty}</div>
          ) : (
            <CategorySpendChart summary={summary} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSummaryWidget;
