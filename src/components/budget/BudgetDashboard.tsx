/* eslint-disable react/prop-types */

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
        const raw = await res.json();
        const data = raw as { expenses?: Expense[] };
        setExpenses(data.expenses || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unexpected error');
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
      const logicMode = budgetMode === 'simple' ? 'exclude' : prepaidMode; // internal filter logic
      if (logicMode === 'exclude' && e.is_prepaid) return false;
      if (logicMode === 'only' && !e.is_prepaid) return false;
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
      if (!confirm(dict.dashboard?.confirmDeleteExpense || 'Delete this expense?')) return;
      const prev = expenses;
      setDeletingId(id);
      setExpenses((es) => es.filter((e) => e.id !== id)); // optimistic
      setActionError(null);
      try {
        const res = await fetch(`/api/trips/${trip.id}/expenses/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const raw = await res.json().catch(() => ({}));
          const data = raw as { error?: string };
          throw new Error(data.error || dict.errors?.deleteFailed || 'Delete failed');
        }
        setSummaryRefresh((r) => r + 1);
      } catch (e) {
        setExpenses(prev); // revert
        setActionError(e instanceof Error ? e.message : 'Unexpected error');
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, expenses, trip.id, dict.dashboard?.confirmDeleteExpense, dict.errors?.deleteFailed]
  );

  const ExpenseItem: React.FC<{ e: Expense }> = ({ e }) => {
    const showFx = trip.currency && e.currency !== trip.currency;
    const rateDisplay = showFx && e.fx_rate ? ` @ ${e.fx_rate.toFixed(4)}` : '';
    const warning = showFx && e.fx_source === 'fallback';
    return (
      <li
        key={e.id}
        className="group rounded-xl border-2 border-brand-navy-lighter/50 bg-gradient-to-r from-brand-navy-light to-brand-navy-lighter/80 p-5 text-sm flex flex-col md:flex-row md:justify-between gap-4 hover:border-brand-cyan/40 hover:shadow-lg hover:shadow-brand-cyan/5 transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="space-y-3 pr-2 min-w-0 flex-1">
          <div
            className="font-semibold line-clamp-2 text-white text-base"
            title={e.description || e.category?.name || dict.dashboard.expenses.fallbackTitle}
          >
            {e.description || e.category?.name || dict.dashboard.expenses.fallbackTitle}
          </div>
          <div className="text-brand-cyan/80 flex gap-3 flex-wrap items-center">
            {e.category?.name && (
              <span className="bg-brand-cyan/10 border border-brand-cyan/30 px-3 py-1 rounded-full text-sm font-medium">
                {e.category.name}
              </span>
            )}
            {e.is_prepaid && (
              <span className="uppercase tracking-wide text-sm bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full border border-brand-orange/30 font-medium">
                {dict.dashboard.expenses.prepaidBadge}
              </span>
            )}
            <span className="text-sm text-brand-cyan/60 flex items-center gap-1">
              🕒 {new Date(e.expense_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {warning && (
              <span
                className="text-sm text-brand-orange flex items-center gap-1"
                title={e.fx_warning || 'Fallback FX rate (1:1) used'}
              >
                ⚠️ FX
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-between">
          <div className="font-mono text-xl font-bold text-brand-cyan bg-brand-cyan/10 px-3 py-2 rounded-lg border border-brand-cyan/30">
            {e.amount.toFixed(2)} {e.currency}
          </div>
          {showFx && (
            <div
              className="text-sm text-brand-cyan/70 mt-1"
              title={e.fx_source ? `FX source: ${e.fx_source}${e.fx_warning ? ' - ' + e.fx_warning : ''}` : undefined}
            >
              {e.amount_in_home_currency.toFixed(2)} {trip.currency}
              {rateDisplay}
            </div>
          )}
          <button
            aria-label="Delete expense"
            onClick={() => deleteExpense(e.id)}
            disabled={deletingId === e.id}
            className="h-12 w-12 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 text-brand-cyan/70 hover:text-brand-orange hover:bg-brand-orange/10 transition-all duration-200 rounded-lg border-2 border-transparent hover:border-brand-orange/30 font-bold text-lg"
          >
            {deletingId === e.id ? '⏳' : '❌'}
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-10 pb-28">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{dict.dashboard.title}</h1>
          <p className="text-sm text-brand-cyan/70">
            {trip.title} · {trip.destination} · {trip.start_date} → {trip.end_date}
          </p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <button
            onClick={() => {
              window.open(`/api/trips/${trip.id}/expenses/export.csv`, '_blank');
            }}
            aria-label="Export expenses CSV"
            className="group relative text-sm px-6 py-3 rounded-xl border-2 border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/90 hover:text-brand-navy hover:border-brand-cyan hover:shadow-xl hover:shadow-brand-cyan/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/50 hover:scale-105 transition-all duration-300 font-semibold active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              📊 {dict.dashboard.csvExport || (lang === 'pl' ? 'Eksport CSV' : 'CSV Export')}
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-cyan/80 to-brand-cyan/60 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>

          <div className="inline-flex rounded-xl overflow-hidden border-2 border-brand-cyan/30 bg-gradient-to-r from-brand-navy-light to-brand-navy-lighter shadow-lg hover:shadow-xl hover:shadow-brand-cyan/10 transition-all duration-300">
            {(['simple', 'full'] as BudgetMode[]).map((val) => {
              const label =
                val === 'simple' ? dict.dashboard.modes?.simple || 'On-Trip' : dict.dashboard.modes?.full || 'Full';
              return (
                <button
                  key={val}
                  onClick={() => setBudgetMode(val)}
                  aria-pressed={budgetMode === val}
                  aria-label={label}
                  className={`group relative px-4 sm:px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/60 hover:scale-105 active:scale-95 transform ${
                    budgetMode === val
                      ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/40 z-10 border-2 border-brand-cyan scale-105'
                      : 'bg-brand-navy-lighter/50 text-brand-cyan hover:text-white hover:bg-brand-cyan/20 hover:shadow-md border border-brand-cyan/30 hover:border-brand-cyan/70'
                  } rounded-none first:rounded-l-xl last:rounded-r-xl`}
                >
                  <span className="relative z-10 whitespace-nowrap">{label}</span>
                  {budgetMode !== val && (
                    <div className="absolute inset-0 bg-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="inline-flex rounded-xl overflow-hidden border-2 border-brand-orange/30 bg-gradient-to-r from-brand-navy-light to-brand-navy-lighter shadow-lg hover:shadow-xl hover:shadow-brand-orange/10 transition-all duration-300">
            {(
              [
                ['all', dict.dashboard.filters.all],
                ['exclude', dict.dashboard.filters.excludePrepaid],
                ['only', dict.dashboard.filters.onlyPrepaid],
              ] as const
            ).map(([val, label]) => {
              // Visual state reflects user selection (prepaidMode)
              const disabled = budgetMode === 'simple' && val === 'only';
              return (
                <button
                  key={val}
                  onClick={() => setPrepaidMode(val)}
                  aria-pressed={prepaidMode === val}
                  aria-disabled={disabled}
                  aria-label={label}
                  disabled={disabled}
                  className={`group relative px-3 sm:px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange/60 hover:scale-105 active:scale-95 transform ${
                    prepaidMode === val
                      ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/40 z-10 border-2 border-brand-orange scale-105'
                      : 'bg-brand-navy-lighter/50 text-brand-orange hover:text-white hover:bg-brand-orange/20 hover:shadow-md border border-brand-orange/30 hover:border-brand-orange/70'
                  } ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:bg-brand-navy-lighter/50 hover:shadow-none hover:text-brand-orange hover:border-brand-orange/30'
                      : ''
                  } rounded-none first:rounded-l-xl last:rounded-r-xl`}
                >
                  <span className="relative z-10 whitespace-nowrap">{label}</span>
                  {prepaidMode !== val && !disabled && (
                    <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={manualRefresh}
            disabled={refreshing}
            aria-label={
              refreshing
                ? dict.dashboard.refresh.refreshing || 'Refreshing...'
                : dict.dashboard.refresh.action || 'Refresh'
            }
            className="group relative text-sm px-6 py-3 rounded-xl border-2 border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/90 hover:text-brand-navy hover:border-brand-cyan hover:shadow-xl hover:shadow-brand-cyan/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/60 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:bg-brand-cyan/10 disabled:hover:text-brand-cyan disabled:hover:border-brand-cyan/50 transition-all duration-300 font-semibold active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              {refreshing ? (
                <>🔄 {dict.dashboard.refresh.refreshing || (lang === 'pl' ? 'Odświeżanie…' : 'Refreshing…')}</>
              ) : (
                <>🔄 {dict.dashboard.refresh.action || (lang === 'pl' ? 'Odśwież' : 'Refresh')}</>
              )}
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-cyan/80 to-brand-cyan/60 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>

          <QuickAddExpense tripId={trip.id} onAdded={onAdded} lang={lang} buttonVariant="inline" />
        </div>
      </header>
      {actionError && <div className="text-sm text-brand-orange bg-brand-orange/10 p-3 rounded-lg">{actionError}</div>}
      <BudgetSummaryWidget tripId={trip.id} refreshToken={summaryRefresh} budgetMode={budgetMode} />
      {/* Post trip report appears after end date */}
      <BudgetPostTripReport trip={trip} lang={lang} />

      {/* Mobile: Stack layout, Desktop: Grid layout */}
      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-gradient-to-br from-brand-navy-light to-brand-navy-lighter border-2 border-brand-cyan/20 p-6 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">💳 {dict.dashboard.expenses.heading}</span>
              <span className="text-sm font-normal text-brand-cyan/80 bg-brand-cyan/10 px-3 py-1 rounded-full border border-brand-cyan/20">
                {filteredExpenses.length} items
              </span>
            </h2>
            {loading && (
              <ul className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="h-20 rounded bg-brand-navy-lighter/40" />
                ))}
              </ul>
            )}
            {error && <div className="text-sm text-brand-orange bg-brand-orange/10 p-3 rounded-lg">{error}</div>}
            {!loading && filteredExpenses.length === 0 && (
              <div className="text-sm text-brand-cyan/60 border border-dashed border-brand-navy-lighter rounded-lg p-8 text-center">
                {dict.dashboard.expenses.empty}
              </div>
            )}
            <div className="space-y-6">
              {groupedByDate.map((group) => (
                <div key={group.day} className="space-y-3">
                  <h3 className="sticky top-0 z-10 backdrop-blur bg-brand-navy-light/90 px-2 py-2 rounded text-sm uppercase tracking-wide text-brand-cyan font-medium border-l-4 border-brand-cyan/50">
                    {group.day}
                  </h3>
                  <ul className="space-y-3">
                    {group.list.map((e) => (
                      <ExpenseItem key={e.id} e={e} />
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
