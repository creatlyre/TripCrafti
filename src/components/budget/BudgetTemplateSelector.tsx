/**
 * BudgetTemplateSelector (redesigned)
 * UX Rationale:
 * - Replaces dense card grid with a master/detail pattern: left list (quick scan) + right preview (details & distribution)
 * - Single Apply action reduces accidental application & clarifies flow
 * - Tag chips enable quick filtering (logical AND) without typing
 * - Distribution bar gives immediate visual of relative category weights
 * - Mobile: list stacks above preview; scroll remains linear & lighter
 * - Accessibility: listbox/option semantics, emoji marked aria-hidden, single button with clear label
 */

import React, { useMemo, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BUDGET_CATEGORY_TEMPLATES, isRatio, type BudgetCategoryTemplateSet } from '@/lib/budget.templates';
import { getDictionary, type Lang } from '@/lib/i18n';

interface Props {
  lang?: Lang;
  tripBudget?: number | null;
  onApply: (templateId: string) => void;
  applyingTemplateId?: string | null;
}

// Redesigned selector: listbox + detail preview pane with single Apply action.
const BudgetTemplateSelector: React.FC<Props> = ({ lang = 'en', tripBudget, onApply, applyingTemplateId }) => {
  const dict = getDictionary(lang).budget;
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => Array.from(new Set(BUDGET_CATEGORY_TEMPLATES.flatMap((t) => t.tags || []))).sort(), []);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filtered = useMemo(() => {
    const lowerQ = query.toLowerCase().trim();
    return BUDGET_CATEGORY_TEMPLATES.filter((t) => {
      if (activeTags.length && !activeTags.every((ag) => (t.tags || []).includes(ag))) return false;
      if (!lowerQ) return true;
      const haystack = [t.label, t.description, ...t.categories.map((c) => c.name), ...(t.tags || [])];
      return haystack.some((v) => v.toLowerCase().includes(lowerQ));
    });
  }, [query, activeTags]);

  const selectedTemplate: BudgetCategoryTemplateSet | undefined = useMemo(
    () => filtered.find((t) => t.id === selectedId) || filtered[0],
    [filtered, selectedId]
  );

  const apply = useCallback(() => {
    if (!selectedTemplate) return;
    onApply(selectedTemplate.id);
  }, [onApply, selectedTemplate]);

  const baseBudget = tripBudget || 1000;

  function computeAmount(portion?: number) {
    if (isRatio(portion)) return (baseBudget * (portion || 0)).toFixed(2);
    if (typeof portion === 'number') return portion.toFixed(2);
    return undefined;
  }

  return (
  <div className="flex flex-col gap-4 md:flex-row md:gap-6 h-full bg-brand-navy-dark rounded-lg p-2 md:p-3">
      {/* Left column: search, tags, list */}
  <div className="md:w-56 flex-shrink-0 flex flex-col gap-4 bg-brand-navy-dark rounded-md p-2 border border-brand-navy-lighter">
        <div className="relative">
          <Input
            aria-label={lang === 'pl' ? 'Szukaj szablonów' : 'Search templates'}
            placeholder={lang === 'pl' ? 'Szukaj...' : 'Search...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-brand-navy-dark border-brand-navy-lighter pr-8 text-white placeholder:text-brand-cyan/50"
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
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1" aria-label="Tag filters">
          {allTags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                  active
                    ? 'bg-brand-cyan text-brand-navy border-brand-cyan'
                    : 'border-brand-navy-lighter text-brand-cyan/70 hover:border-brand-cyan/40'
                }`}
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <ul
          role="listbox"
          aria-label={dict?.categories.selectTemplate}
          className="flex-1 overflow-y-auto rounded-lg border border-brand-navy-lighter divide-y divide-brand-navy-lighter/60 bg-brand-navy-lighter"
        >
          {filtered.map((t) => {
            const selected =
              (selectedTemplate && selectedTemplate.id === t.id) || (!selectedTemplate && filtered[0] === t);
            return (
              <li
                key={t.id}
                role="option"
                aria-selected={selected}
                tabIndex={0}
                onClick={() => setSelectedId(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(t.id);
                  }
                }}
                className={`cursor-pointer group px-3 py-2 text-xs flex flex-col gap-0.5 focus:outline-none focus:bg-brand-navy-lighter transition-colors ${
                  selected ? 'bg-brand-navy-lighter border-l-2 border-brand-cyan' : 'hover:bg-brand-navy-lighter'
                }`}
              >
                <span className="flex items-center gap-1 font-medium text-white">
                  {t.emoji && <span aria-hidden>{t.emoji}</span>}
                  {t.label}
                </span>
                <span className="text-[10px] text-brand-cyan/60 line-clamp-1">
                  {(t.tags || []).slice(0, 3).join(' • ')}
                </span>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-[11px] text-brand-cyan/60">
              {lang === 'pl' ? 'Brak wyników.' : 'No matches.'}
            </li>
          )}
        </ul>
      </div>

      {/* Right column: preview */}
  <div className="flex-1 flex flex-col gap-4 min-h-0 bg-brand-navy-dark rounded-md p-3 border border-brand-navy-lighter overflow-hidden">
        {selectedTemplate && (
          <div className="space-y-4 overflow-auto pr-1 pb-28">{/* leave space for sticky bar */}
            <header className="space-y-1">
              <h4 className="text-white font-semibold flex items-center gap-2 text-sm">
                {selectedTemplate.emoji && <span aria-hidden>{selectedTemplate.emoji}</span>}
                {selectedTemplate.label}
              </h4>
              <p className="text-[11px] leading-relaxed text-brand-cyan/70">{selectedTemplate.description}</p>
              <div className="flex flex-wrap gap-1">
                {(selectedTemplate.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-brand-navy-lighter/50 text-[10px] text-brand-cyan/70 border border-brand-navy-lighter"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>
            {/* Distribution bar */}
            <div>
              <p className="text-[11px] mb-1 font-medium text-brand-cyan/70">
                {lang === 'pl' ? 'Dystrybucja kategorii' : 'Category Distribution'}
              </p>
              <div className="flex h-5 w-full overflow-hidden rounded-md border border-brand-navy-lighter">
                {selectedTemplate.categories.map((c) => {
                  const portion = c.suggested_portion;
                  const ratio = isRatio(portion) ? portion || 0 : 0; // treat absolutes later
                  const width = `${Math.round(ratio * 100)}%`;
                  return (
                    <div
                      key={c.name}
                      style={{ width }}
                      className="relative group bg-gradient-to-r from-brand-cyan/40 to-brand-cyan/30 border-r border-brand-navy-lighter last:border-r-0"
                      title={`${c.name} ${Math.round(ratio * 100)}%`}
                    />
                  );
                })}
              </div>
            </div>
            {/* Category list */}
            <div className="rounded-lg border border-brand-navy-lighter divide-y divide-brand-navy-lighter/60 bg-brand-navy-lighter">
              {selectedTemplate.categories.map((c) => {
                const portion = c.suggested_portion;
                const percent = isRatio(portion) ? Math.round((portion || 0) * 100) : null;
                const amount = computeAmount(portion);
                return (
                  <div key={c.name} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {c.icon_name && (
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-brand-navy-lighter/40 text-[13px] text-brand-cyan/80 border border-brand-navy-lighter/70"
                          aria-hidden
                        >
                          {c.icon_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate text-white" title={c.name}>
                        {c.name}
                      </span>
                    </div>
                    <div className="text-right font-mono text-[11px] text-brand-cyan/70 whitespace-nowrap">
                      {percent !== null ? `${percent}%` : ''}
                      {amount ? (percent !== null ? ` · ${amount}` : amount) : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="pointer-events-none">
          <div className="fixed md:static left-0 right-0 bottom-4 md:bottom-auto px-4 md:px-0">
            <div className="pointer-events-auto mx-auto md:ml-auto md:mr-0 w-full md:w-auto max-w-md md:max-w-none">
              <div className="rounded-xl border border-brand-cyan/50 bg-brand-navy-dark p-3 shadow-lg shadow-brand-cyan/10 flex items-center justify-between gap-4">
                <div className="text-[11px] text-brand-cyan/80 hidden md:block">
                  {selectedTemplate
                    ? (lang === 'pl' ? 'Wybrany szablon:' : 'Selected template:') + ' ' + selectedTemplate.label
                    : lang === 'pl'
                      ? 'Wybierz szablon z listy.'
                      : 'Choose a template from the list.'}
                </div>
                <Button
                  disabled={!selectedTemplate || applyingTemplateId === selectedTemplate.id}
                  onClick={apply}
                  className="bg-brand-cyan text-brand-navy hover:bg-brand-cyan/90 font-semibold shadow-inner shadow-brand-cyan/40"
                >
                  {applyingTemplateId === selectedTemplate?.id
                    ? dict?.categories.applying
                    : lang === 'pl'
                      ? 'Zastosuj szablon'
                      : 'Apply Template'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTemplateSelector;
