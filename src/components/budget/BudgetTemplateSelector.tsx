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
    <div className="flex flex-col gap-4 md:flex-row md:gap-6 h-full bg-brand-navy-dark rounded-lg p-3 md:p-4 ring-1 ring-brand-navy-lighter/60">
      {/* Left column: search, tags, list */}
      <div className="md:w-60 flex-shrink-0 flex flex-col gap-4 bg-gradient-to-b from-brand-navy-dark to-brand-navy-light rounded-xl p-3 border border-brand-navy-lighter/70 shadow-inner shadow-black/30">
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
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-cyan/60 focus:ring-offset-brand-navy-dark ${
                  active
                    ? 'bg-brand-cyan text-brand-navy shadow-sm shadow-brand-cyan/40'
                    : 'bg-brand-navy-light text-brand-cyan/70 hover:text-brand-cyan border border-brand-navy-lighter/60 hover:border-brand-cyan/50'
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
          className="flex-1 overflow-y-auto rounded-lg border border-brand-navy-lighter/70 divide-y divide-brand-navy-lighter/50 bg-brand-navy-light shadow-sm"
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
                className={`cursor-pointer group px-3 py-2 text-xs flex flex-col gap-0.5 focus:outline-none transition-colors rounded-md ${
                  selected
                    ? 'bg-brand-cyan/10 border border-brand-cyan/60 shadow-inner shadow-brand-cyan/20'
                    : 'hover:bg-brand-navy-dark/60 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-1 font-medium text-brand-cyan/90 group-hover:text-white transition-colors">
                  {t.emoji && <span aria-hidden>{t.emoji}</span>}
                  {t.label}
                </span>
                <span className="text-[10px] text-brand-cyan/50 group-hover:text-brand-cyan/70 line-clamp-1">
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
      <div className="flex-1 flex flex-col gap-4 min-h-0 bg-brand-navy-dark rounded-xl p-4 border border-brand-navy-lighter/70 overflow-hidden shadow-inner shadow-black/40">
        {selectedTemplate && (
          <div className="space-y-4 overflow-auto pr-1 pb-28">
            {/* leave space for sticky bar */}
            <header className="space-y-1">
              <h4 className="text-brand-cyan font-semibold flex items-center gap-2 text-sm tracking-wide">
                {selectedTemplate.emoji && <span aria-hidden>{selectedTemplate.emoji}</span>}
                {selectedTemplate.label}
              </h4>
              <p className="text-[11px] leading-relaxed text-brand-cyan/80">{selectedTemplate.description}</p>
              <div className="flex flex-wrap gap-1">
                {(selectedTemplate.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-brand-navy-light text-[10px] text-brand-cyan/70 border border-brand-navy-lighter/60"
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
              <div className="flex h-4 w-full overflow-hidden rounded-md border border-brand-navy-lighter/70 ring-1 ring-black/20">
                {selectedTemplate.categories.map((c, idx) => {
                  const portion = c.suggested_portion;
                  const ratio = isRatio(portion) ? portion || 0 : 0;
                  const width = `${Math.round(ratio * 100)}%`;
                  const palette = ['bg-brand-cyan/70', 'bg-brand-orange/60', 'bg-brand-cyan/50', 'bg-brand-orange/50'];
                  const color = palette[idx % palette.length];
                  return (
                    <div
                      key={c.name}
                      style={{ width }}
                      className={`relative group ${color} border-r border-brand-navy-dark last:border-r-0`}
                      title={`${c.name} ${Math.round(ratio * 100)}%`}
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] flex items-center justify-center font-medium tracking-wide text-brand-navy-dark/90">
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Category list */}
            <div className="rounded-lg border border-brand-navy-lighter/70 divide-y divide-brand-navy-lighter/50 bg-brand-navy-light shadow-sm">
              {selectedTemplate.categories.map((c) => {
                const portion = c.suggested_portion;
                const percent = isRatio(portion) ? Math.round((portion || 0) * 100) : null;
                const amount = computeAmount(portion);
                return (
                  <div key={c.name} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {c.icon_name && (
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-brand-navy-dark/60 text-[12px] text-brand-cyan border border-brand-navy-lighter/70"
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
              <div className="rounded-2xl border-2 border-brand-cyan/60 bg-gradient-to-r from-brand-navy-dark via-brand-navy-dark to-brand-navy-light p-4 shadow-lg shadow-brand-cyan/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3 backdrop-blur-sm">
                <div className="text-[11px] text-brand-cyan/70 hidden md:block font-medium tracking-wide">
                  {selectedTemplate
                    ? (lang === 'pl' ? 'Wybrany szablon:' : 'Selected template:') + ' ' + selectedTemplate.label
                    : lang === 'pl'
                      ? 'Wybierz szablon z listy.'
                      : 'Choose a template from the list.'}
                </div>
                <Button
                  disabled={!selectedTemplate || applyingTemplateId === selectedTemplate.id}
                  onClick={apply}
                  className="relative w-full md:w-auto bg-brand-cyan text-brand-navy font-semibold tracking-wide text-sm py-2 px-6 shadow-lg shadow-brand-cyan/40 hover:bg-brand-cyan/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/40 active:scale-[0.97] transition-transform disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="text-base leading-none">
                      ⚡
                    </span>
                    {applyingTemplateId === selectedTemplate?.id
                      ? dict?.categories.applying
                      : lang === 'pl'
                        ? 'Zastosuj szablon'
                        : 'Apply Template'}
                  </span>
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
