import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BUDGET_CATEGORY_TEMPLATES, isRatio } from '@/lib/budget.templates';
import { getDictionary, type Lang } from '@/lib/i18n';

interface Props {
  lang?: Lang;
  tripBudget?: number | null;
  onApply: (templateId: string) => void;
  applyingTemplateId?: string | null;
}

// Responsive template selector: search + category preview & adaptive grid.
const BudgetTemplateSelector: React.FC<Props> = ({ lang = 'en', tripBudget, onApply, applyingTemplateId }) => {
  const dict = getDictionary(lang).budget; // runtime guarantees budget present
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return BUDGET_CATEGORY_TEMPLATES;
    const q = query.toLowerCase();
    return BUDGET_CATEGORY_TEMPLATES.filter((t) => {
      const haystack = [t.label, t.description, ...t.categories.map((c) => c.name)];
      return haystack.some((v) => v.toLowerCase().includes(q));
    });
  }, [query]);

  // Provide keyboard navigation for accessibility
  function handleKey(e: React.KeyboardEvent<HTMLElement>, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onApply(id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1 relative">
          <Input
            aria-label={lang === 'pl' ? 'Szukaj szablonów' : 'Search templates'}
            placeholder={lang === 'pl' ? 'Szukaj...' : 'Search...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-brand-navy-dark border-brand-navy-lighter pr-10 text-white placeholder:text-brand-cyan/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-cyan/70 hover:text-brand-orange"
              aria-label={lang === 'pl' ? 'Wyczyść' : 'Clear'}
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-[11px] text-brand-cyan/60">
          {lang === 'pl'
            ? 'Wybierz szablon: proporcje przeliczymy na kwoty po budżecie podróży.'
            : 'Pick a template: ratios convert to amounts using your trip budget.'}
        </div>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start"
        aria-label={dict?.categories.selectTemplate}
      >
        {filtered.map((t) => {
          const loc = dict?.categoryTemplates?.[t.id];
          const label = loc?.label || t.label;
          const description = loc?.description || t.description;
          const localizedCategories =
            (loc?.categories || []).length === t.categories.length ? loc?.categories : undefined;
          const categoriesForDisplay = localizedCategories
            ? localizedCategories.map((c) => ({ name: c.name, suggested_portion: c.portion, icon_name: c.icon }))
            : t.categories;
          const baseBudget = tripBudget || 1000;
          const totalPlanned = categoriesForDisplay.reduce((sum, c) => {
            const portion = c.suggested_portion;
            if (isRatio(portion)) return sum + baseBudget * (portion || 0);
            if (typeof portion === 'number') return sum + portion;
            return sum;
          }, 0);
          return (
            <article
              key={t.id}
              onFocus={() => setFocusId(t.id)}
              onBlur={() => setFocusId((prev) => (prev === t.id ? null : prev))}
              className={`group relative rounded-xl border transition-all duration-300 p-4 bg-brand-navy-dark/40 border-brand-navy-lighter hover:border-brand-cyan/40 hover:shadow-lg hover:shadow-brand-cyan/10 ${
                focusId === t.id ? 'border-brand-cyan/60' : ''
              }`}
              aria-describedby={`desc-${t.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-white font-semibold text-sm leading-tight mb-1">{label}</h4>
                  <p id={`desc-${t.id}`} className="text-[11px] text-brand-cyan/70 leading-relaxed line-clamp-3">
                    {description}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={applyingTemplateId === t.id}
                  onClick={() => onApply(t.id)}
                  onKeyDown={(e) => handleKey(e, t.id)}
                  className="bg-brand-cyan text-brand-navy hover:bg-brand-cyan/90 whitespace-nowrap"
                >
                  {applyingTemplateId === t.id ? dict?.categories.applying : dict?.categories.apply}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {categoriesForDisplay.map((c) => {
                  // c may be template item or localized item projection
                  const portion = (c as { suggested_portion?: number }).suggested_portion;
                  const percent = isRatio(portion) ? Math.round((portion || 0) * 100) : null;
                  const absolute = isRatio(portion)
                    ? (baseBudget * (portion || 0)).toFixed(2)
                    : typeof portion === 'number'
                      ? portion.toFixed(2)
                      : undefined;
                  return (
                    <div
                      key={c.name}
                      className="flex flex-col rounded-md border border-brand-navy-lighter/60 bg-brand-navy-lighter/40 px-3 py-2"
                    >
                      <span className="truncate text-white text-xs font-medium" title={c.name}>
                        {c.name}
                      </span>
                      <span className="text-[11px] text-brand-cyan/70 font-mono">
                        {percent !== null ? `${percent}%` : ''}
                        {absolute ? (percent !== null ? ` · ${absolute}` : absolute) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-brand-cyan/60 font-mono">
                {dict?.categories.estPlannedTotal} {totalPlanned.toFixed(2)}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-xs text-brand-cyan/60 py-6 text-center">
            {lang === 'pl' ? 'Brak dopasowań.' : 'No matches.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetTemplateSelector;
