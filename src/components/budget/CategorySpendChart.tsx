import React from 'react';

import type { BudgetSummary } from '@/types';

/**
 * Lightweight category spend distribution visualization (Phase 2)
 * Avoids pulling heavy chart libs. Renders a horizontal bar list with proportional widths.
 */
interface Props {
  summary: BudgetSummary;
}

const palette = [
  'from-indigo-500 to-violet-500',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-cyan-500',
  'from-rose-500 to-red-500',
];

const CategorySpendChart: React.FC<Props> = ({ summary }) => {
  if (!summary.spentByCategory.length) {
    return <div className="text-xs text-slate-500">No category data</div>;
  }
  const total = summary.spentByCategory.reduce((s, c) => s + c.spent, 0) || 1;
  const top = summary.spentByCategory.slice(0, 8);
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {top.map((c, idx) => {
          const pct = (c.spent / total) * 100;
          const grad = palette[idx % palette.length];
          return (
            <li key={c.category_id || c.category || 'uncat'} className="text-[11px]">
              <div className="flex justify-between mb-0.5">
                <span className="truncate max-w-[60%] text-slate-300" title={c.category || 'Uncategorized'}>
                  {c.category || 'Uncategorized'}
                </span>
                <span className="font-mono text-slate-400">{c.spent.toFixed(0)}</span>
              </div>
              <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${grad}`} style={{ width: pct + '%' }} />
              </div>
            </li>
          );
        })}
      </ul>
      {summary.spentByCategory.length > top.length && (
        <p className="text-[10px] text-slate-500">+ {summary.spentByCategory.length - top.length} more</p>
      )}
    </div>
  );
};
export default CategorySpendChart;
