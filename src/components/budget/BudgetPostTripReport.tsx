import React, { useEffect, useState } from 'react';

import type { BudgetReport, Trip } from '@/types';

import { getDictionary, type Lang } from '@/lib/i18n';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Props {
  trip: Trip;
  lang: Lang;
}

const BudgetPostTripReport: React.FC<Props> = ({ trip, lang }) => {
  const [report, setReport] = useState<BudgetReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dict = getDictionary(lang);
  const t = dict.budgetExtra?.report;

  const tripEnded = new Date(trip.end_date + 'T23:59:59Z') < new Date();

  useEffect(() => {
    if (!tripEnded) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${trip.id}/budget/report`);
        if (!res.ok) throw new Error('Failed to load report');
        const data = (await res.json()) as BudgetReport;
        if (!cancelled) setReport(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.id, tripEnded]);

  if (!tripEnded) return null;

  return (
    <Card className="border-slate-700 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-sm">{t?.title || 'Post-Trip Budget Report'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {loading && <div>{t?.loading || 'Loading…'}</div>}
        {error && <div className="text-red-500">{error}</div>}
        {report && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              {STAT(t?.plannedTotal || 'Planned Total', report.plannedTotal.toFixed(2))}
              {STAT(t?.spentTotal || 'Spent Total', report.totalSpent.toFixed(2))}
              {STAT(t?.onTrip || 'On-Trip', report.totalOnTrip.toFixed(2))}
              {STAT(t?.prepaid || 'Prepaid', report.totalPrepaid.toFixed(2))}
              {STAT(
                t?.delta || 'Delta',
                report.deltaTotal.toFixed(2),
                report.deltaTotal > 0 ? t?.over || 'Over' : t?.under || 'Under'
              )}
            </div>
            <div>
              <h3 className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
                {t?.categories || 'Categories'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-separate border-spacing-y-1">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="text-left font-medium">{t?.name || 'Name'}</th>
                      <th className="text-right font-medium">{t?.planned || 'Planned'}</th>
                      <th className="text-right font-medium">{t?.spent || 'Spent'}</th>
                      <th className="text-right font-medium">{t?.delta || 'Delta'}</th>
                      <th className="text-right font-medium">{t?.utilization || 'Util%'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categories.map((c) => {
                      const over = c.delta > 0;
                      return (
                        <tr key={c.category_id} className="bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                          <td className="py-1 px-2 truncate max-w-[140px]">{c.name}</td>
                          <td className="py-1 px-2 text-right font-mono">{c.planned.toFixed(2)}</td>
                          <td className="py-1 px-2 text-right font-mono">{c.spent.toFixed(2)}</td>
                          <td
                            className={`py-1 px-2 text-right font-mono ${over ? 'text-rose-400' : 'text-emerald-400'}`}
                          >
                            {c.delta.toFixed(2)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">
                            {c.utilization != null ? (c.utilization * 100).toFixed(0) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              {t?.generated || 'Generated'} {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function STAT(label: string, value: string, sub?: string) {
  return (
    <div className="p-3 rounded-md bg-slate-800/40 border border-slate-700">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default BudgetPostTripReport;
