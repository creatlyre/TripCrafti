import React, { useEffect, useState, useMemo } from 'react';
import type { Trip, Expense } from '../../types';
import { getDictionary, type Lang } from '@/lib/i18n';
import BudgetSummaryWidget from './BudgetSummary';
import QuickAddExpense from './QuickAddExpense';
import CategoryManagement from './CategoryManagement';

interface Props { trip: Trip; lang?: Lang }

const BudgetDashboard: React.FC<Props> = ({ trip, lang = 'pl' }) => {
  const dict = getDictionary(lang).budget!;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prepaidMode, setPrepaidMode] = useState<'all' | 'exclude' | 'only'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [summaryRefresh, setSummaryRefresh] = useState(0);

  async function loadExpenses(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${trip.id}/expenses`);
  if (!res.ok) throw new Error('Failed to load expenses'); // leave internal error English for now
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (e: any) { setError(e.message); } finally { if (!opts.silent) setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadExpenses(); }, [trip.id]);

  function onAdded(e: Expense) { setExpenses(prev => [e, ...prev]); setSummaryRefresh(r => r + 1); }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (prepaidMode === 'exclude' && e.is_prepaid) return false;
      if (prepaidMode === 'only' && !e.is_prepaid) return false;
      return true;
    });
  }, [expenses, prepaidMode]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filteredExpenses.forEach(e => {
      const d = new Date(e.expense_date).toISOString().split('T')[0];
      (map[d] = map[d] || []).push(e);
    });
    return Object.entries(map)
      .sort((a,b)=> b[0].localeCompare(a[0]))
      .map(([day, list]) => ({ day, list: list.sort((a,b)=> new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()) }));
  }, [filteredExpenses]);

  async function manualRefresh() { setRefreshing(true); await loadExpenses({ silent: true }); setSummaryRefresh(r => r + 1); }

  return (
    <div className="space-y-10 pb-28">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{dict.dashboard.title}</h1>
          <p className="text-xs text-muted-foreground">{trip.title} · {trip.destination} · {trip.start_date} → {trip.end_date}</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="inline-flex rounded-md overflow-hidden border border-slate-700 bg-slate-900/60">
            {([['all',dict.dashboard.filters.all],['exclude',dict.dashboard.filters.excludePrepaid],['only',dict.dashboard.filters.onlyPrepaid]] as const).map(([val,label]) => (
              <button key={val} onClick={()=> setPrepaidMode(val)} className={`px-2 py-1 text-[11px] transition ${prepaidMode===val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>
            ))}
          </div>
          <button onClick={manualRefresh} disabled={refreshing} className="text-[11px] px-3 py-1 rounded-md border border-slate-700 hover:bg-slate-800 disabled:opacity-50">{refreshing ? dict.dashboard.refresh.refreshing : dict.dashboard.refresh.action}</button>
        </div>
      </header>
      <BudgetSummaryWidget tripId={trip.id} refreshToken={summaryRefresh} />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold flex items-center justify-between">{dict.dashboard.expenses.heading} <span className="text-[10px] font-normal text-slate-500">{filteredExpenses.length}</span></h2>
          {loading && (
            <ul className="space-y-2 animate-pulse">
              {Array.from({length:4}).map((_,i)=>(
                <li key={i} className="h-14 rounded bg-slate-800/40" />
              ))}
            </ul>
          )}
            {error && <div className="text-xs text-red-600">{error}</div>}
            {(!loading && filteredExpenses.length === 0) && <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-6 text-center">{dict.dashboard.expenses.empty}</div>}
            <div className="space-y-4">
              {groupedByDate.map(group => (
                <div key={group.day} className="space-y-2">
                  <h3 className="text-[11px] uppercase tracking-wide text-slate-500">{group.day}</h3>
                  <ul className="space-y-2">
                    {group.list.map(e => (
                      <li key={e.id} className="rounded bg-slate-800 p-3 text-xs flex justify-between hover:border-indigo-600/50 transition-colors">
                        <div className="space-y-0.5 pr-4">
                          <div className="font-medium line-clamp-1">{e.description || e.category?.name || dict.dashboard.expenses.fallbackTitle}</div>
                          <div className="text-muted-foreground flex gap-2 flex-wrap">
                            {e.category?.name && <span className="bg-slate-800/60 px-1 rounded">{e.category.name}</span>}
                            {e.is_prepaid && <span className="uppercase tracking-wide text-[10px] bg-indigo-600/20 text-indigo-300 px-1 rounded">{dict.dashboard.expenses.prepaidBadge}</span>}
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between">
                          <div className="font-mono text-sm">{e.amount.toFixed(2)} {e.currency}</div>
                          {e.currency !== trip.currency && <div className="text-xs text-muted-foreground">{e.amount_in_home_currency.toFixed(2)} {trip.currency}</div>}
                          <div className="text-xs text-slate-500">{new Date(e.expense_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
        </div>
        <div className="space-y-6">
          <CategoryManagement tripId={trip.id} />
        </div>
      </div>
      <QuickAddExpense tripId={trip.id} onAdded={onAdded} lang={lang} />
    </div>
  );
};

export default BudgetDashboard;
