import React, { useEffect, useState, useMemo, useCallback } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

import type { Trip, Expense, BudgetMode } from '../../types';

import BudgetPostTripReport from './BudgetPostTripReport';
import BudgetSummaryWidget from './BudgetSummary';
import CategoryManagement from './CategoryManagement';
import QuickAddExpense from './QuickAddExpense';

interface Props {
  trip: Trip;
  lang?: Lang;
}

const BudgetDashboard: React.FC<Props> = ({ trip, lang = 'pl' }) => {
  const dictBudget = getDictionary(lang).budget;
  if (!dictBudget) {
    throw new Error('Budget dictionary not found');
  }
  const dict = dictBudget;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepaidMode, setPrepaidMode] = useState<'all' | 'exclude' | 'only'>('all');
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('simple');
  const [refreshing, setRefreshing] = useState(false);
  const [summaryRefresh, setSummaryRefresh] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadExpenses = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${trip.id}/expenses`);
        if (!res.ok) throw new Error(dict.errors?.loadExpenses || 'Failed to load expenses');
        const data: { expenses?: Expense[] } = await res.json();
        setExpenses(data.expenses || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(message);
      } finally {
        if (!opts.silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [trip.id, dict.errors?.loadExpenses]
  );

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  function onAdded(e: Expense) {
    setExpenses((prev) => [e, ...prev]);
    setSummaryRefresh((r) => r + 1);
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const effectivePrepaidMode = budgetMode === 'simple' ? 'exclude' : prepaidMode;
      if (effectivePrepaidMode === 'exclude' && e.is_prepaid) return false;
      if (effectivePrepaidMode === 'only' && !e.is_prepaid) return false;
      return true;
    });
  }, [expenses, prepaidMode, budgetMode]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filteredExpenses.forEach((e) => {
      const d = new Date(e.expense_date).toISOString().split('T')[0];
      (map[d] = map[d] || []).push(e);
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, list]) => ({
        day,
        list: list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()),
      }));
  }, [filteredExpenses]);

  async function manualRefresh() {
    setRefreshing(true);
    await loadExpenses({ silent: true });
    setSummaryRefresh((r) => r + 1);
  }

  const deleteExpense = useCallback(
    async (id: string) => {
      if (deletingId) return;
      const confirmMessage = dict.dashboard.confirmDeleteExpense || 'Delete this expense?';
      if (!confirm(confirmMessage)) return;
      const prev = expenses;
      setDeletingId(id);
      setExpenses((es) => es.filter((e) => e.id !== id)); // optimistic
      setActionError(null);
      try {
        const res = await fetch(`/api/trips/${trip.id}/expenses/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          let errorMessage = dict.errors?.deleteFailed || 'Delete failed';
          try {
            const data: { error?: string } = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // Ignore JSON parse errors, use default message
          }
          throw new Error(errorMessage);
        }
        setSummaryRefresh((r) => r + 1);
      } catch (error) {
        setExpenses(prev); // revert
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        setActionError(message);
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, expenses, trip.id, dict.dashboard.confirmDeleteExpense, dict.errors?.deleteFailed]
  );

  const ExpenseItem: React.FC<{ e: Expense }> = ({ e }) => {
    const showFx = trip.currency && e.currency !== trip.currency;
    const rateDisplay = showFx && e.fx_rate ? ` @ ${e.fx_rate.toFixed(4)}` : '';
    const warning = showFx && e.fx_source === 'fallback';
    return (
      <li
        key={e.id}
        className="group rounded border border-slate-800 bg-slate-900/50 p-3 text-xs flex justify-between gap-4 hover:bg-slate-800/70 transition-colors"
      >
        <div className="space-y-0.5 pr-2 min-w-0 flex-1">
          <div
            className="font-medium line-clamp-1 text-slate-200"
            title={e.description || e.category?.name || dict.dashboard.expenses.fallbackTitle}
          >
            {e.description || e.category?.name || dict.dashboard.expenses.fallbackTitle}
          </div>
          <div className="text-muted-foreground flex gap-2 flex-wrap items-center">
            {e.category?.name && <span className="bg-slate-800/60 px-1 rounded text-[10px]">{e.category.name}</span>}
            {e.is_prepaid && (
              <span className="uppercase tracking-wide text-[10px] bg-indigo-600/20 text-indigo-300 px-1 rounded">
                {dict.dashboard.expenses.prepaidBadge}
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              {new Date(e.expense_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {warning && (
              <span className="text-[10px] text-amber-400" title={e.fx_warning || 'Fallback FX rate (1:1) used'}>
                ⚠ FX
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="font-mono text-sm text-slate-100">
            {e.amount.toFixed(2)} {e.currency}
          </div>
          {showFx && (
            <div
              className="text-[10px] text-slate-500"
              title={e.fx_source ? `FX source: ${e.fx_source}${e.fx_warning ? ' - ' + e.fx_warning : ''}` : undefined}
            >
              {e.amount_in_home_currency.toFixed(2)} {trip.currency}
              {rateDisplay}
            </div>
          )}
        </div>
        <button
          aria-label="Delete expense"
          onClick={() => deleteExpense(e.id)}
          disabled={deletingId === e.id}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 self-start text-slate-400 hover:text-red-400 transition text-[11px] px-2 -mr-2 -mt-2 py-1 rounded-md hover:bg-red-500/10"
        >
          {deletingId === e.id ? '…' : '✕'}
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-10 pb-28">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{dict.dashboard.title}</h1>
          <p className="text-xs text-muted-foreground">
            {trip.title} · {trip.destination} · {trip.start_date} → {trip.end_date}
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => {
              window.open(`/api/trips/${trip.id}/expenses/export.csv`, '_blank');
            }}
            className="text-[11px] px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800"
          >
            CSV
          </button>
          <div className="inline-flex rounded-md overflow-hidden border border-slate-700 bg-slate-900/60">
            {(['simple', 'full'] as BudgetMode[]).map((val) => (
              <button
                key={val}
                onClick={() => setBudgetMode(val)}
                className={`px-2 py-1 text-[11px] transition ${budgetMode === val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {val === 'simple' ? dict.dashboard.modes?.simple || 'On-Trip' : dict.dashboard.modes?.full || 'Full'}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-md overflow-hidden border border-slate-700 bg-slate-900/60">
            {(
              [
                ['all', dict.dashboard.filters.all],
                ['exclude', dict.dashboard.filters.excludePrepaid],
                ['only', dict.dashboard.filters.onlyPrepaid],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPrepaidMode(val)}
                disabled={budgetMode === 'simple' && val !== 'exclude' && val !== 'all'}
                className={`px-2 py-1 text-[11px] transition ${(budgetMode === 'simple' ? 'exclude' : prepaidMode) === val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'} ${budgetMode === 'simple' && val === 'only' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={manualRefresh}
            disabled={refreshing}
            className="text-[11px] px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800 disabled:opacity-50"
          >
            {refreshing ? dict.dashboard.refresh.refreshing : dict.dashboard.refresh.action}
          </button>
          <QuickAddExpense tripId={trip.id} onAdded={onAdded} lang={lang} buttonVariant="inline" />
        </div>
      </header>
      {actionError && <div className="text-xs text-red-500">{actionError}</div>}
      <BudgetSummaryWidget tripId={trip.id} refreshToken={summaryRefresh} budgetMode={budgetMode} />
      {/* Post trip report appears after end date */}
      <BudgetPostTripReport trip={trip} />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 space-y-4">
            <h2 className="text-sm font-semibold flex items-center justify-between">
              {dict.dashboard.expenses.heading}
              <span className="text-[10px] font-normal text-slate-500">{filteredExpenses.length}</span>
            </h2>
            {loading && (
              <ul className="space-y-2 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="h-14 rounded bg-slate-800/40" />
                ))}
              </ul>
            )}
            {error && <div className="text-xs text-red-600">{error}</div>}
            {!loading && filteredExpenses.length === 0 && (
              <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-6 text-center">
                {dict.dashboard.expenses.empty}
              </div>
            )}
            <div className="space-y-6">
              {groupedByDate.map((group) => (
                <div key={group.day} className="space-y-2">
                  <h3 className="sticky top-0 z-10 backdrop-blur bg-slate-900/80 px-1 py-1 rounded text-[10px] uppercase tracking-wide text-slate-500 border-l-2 border-indigo-500/50">
                    {group.day}
                  </h3>
                  <ul className="space-y-2">
                    {group.list.map((expense) => (
                      <ExpenseItem key={expense.id} e={expense} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <CategoryManagement tripId={trip.id} />
        </div>
      </div>
      {/* Floating button removed in favor of inline placement above */}
    </div>
  );
};

export default BudgetDashboard;
