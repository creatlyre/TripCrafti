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
  'from-brand-cyan to-brand-cyan/80',
  'from-brand-orange to-brand-orange/80',
  'from-brand-cyan/80 to-brand-orange/80',
  'from-brand-orange/80 to-brand-cyan/80',
  'from-brand-cyan/60 to-brand-orange/60',
  'from-brand-orange/60 to-brand-cyan/60',
];

const CategorySpendChart: React.FC<Props> = ({ summary }) => {
  if (!summary.spentByCategory.length) {
    return <div className="text-sm text-brand-cyan/60">No category data</div>;
  }
  const total = summary.spentByCategory.reduce((s, c) => s + c.spent, 0) || 1;
  const top = summary.spentByCategory.slice(0, 8);
  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {top.map((c, idx) => {
          const pct = (c.spent / total) * 100;
          const grad = palette[idx % palette.length];
          return (
            <li key={c.category_id || c.category || 'uncat'} className="text-sm">
              <div className="flex justify-between mb-2">
                <span
                  className="truncate max-w-[60%] text-white font-semibold flex items-center gap-2"
                  title={c.category || 'Uncategorized'}
                >
                  💎 {c.category || 'Uncategorized'}
                </span>
                <span className="font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded border border-brand-cyan/20 font-bold">
                  {c.spent.toFixed(0)}
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-brand-navy-dark/60 overflow-hidden shadow-inner border border-brand-cyan/10">
                <div
                  className={`h-full bg-gradient-to-r ${grad} transition-all duration-700 ease-out shadow-lg`}
                  style={{ width: pct + '%' }}
                />
              </div>
              <div className="text-xs text-brand-cyan/60 mt-1 font-medium">{pct.toFixed(1)}% of total spend</div>
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
