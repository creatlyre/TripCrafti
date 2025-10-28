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
import { getDictionary, type Lang, type Dictionary } from '@/lib/i18n';

interface Props {
  lang?: Lang;
  tripBudget?: number | null;
  onApply: (templateId: string) => void;
  applyingTemplateId?: string | null;
  hasExistingCategories?: boolean;
}

// Helper function to get localized template data
function getLocalizedTemplate(
  templateId: string,
  dict: Dictionary['budget'] | undefined,
  fallbackTemplate: BudgetCategoryTemplateSet
): BudgetCategoryTemplateSet {
  const localizedTemplate = dict?.budgetTemplates?.templates?.[templateId];
  if (!localizedTemplate) {
    return fallbackTemplate;
  }

  return {
    id: templateId,
    label: localizedTemplate.label || fallbackTemplate.label,
    description: localizedTemplate.description || fallbackTemplate.description,
    tags: fallbackTemplate.tags, // Keep original tags for filtering logic
    emoji: fallbackTemplate.emoji,
    categories: localizedTemplate.categories || fallbackTemplate.categories,
  };
}

// Helper function to get localized tag display
function getLocalizedTag(tag: string, dict: Dictionary['budget'] | undefined): string {
  return dict?.budgetTemplates?.tags?.[tag] || tag;
}

// Redesigned selector: listbox + detail preview pane with single Apply action.
const BudgetTemplateSelector: React.FC<Props> = ({
  lang = 'en',
  tripBudget,
  onApply,
  applyingTemplateId,
  hasExistingCategories = false,
}) => {
  // We fetch dictionary but don't early-return before hooks to keep hook order stable.
  const dict = getDictionary(lang)?.budget;
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Get localized templates
  const localizedTemplates = useMemo(() => {
    return BUDGET_CATEGORY_TEMPLATES.map((template) => getLocalizedTemplate(template.id, dict, template));
  }, [dict]);

  const allTags = useMemo(() => Array.from(new Set(BUDGET_CATEGORY_TEMPLATES.flatMap((t) => t.tags || []))).sort(), []);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const filtered = useMemo(() => {
    const lowerQ = query.toLowerCase().trim();
    return localizedTemplates.filter((t) => {
      if (activeTags.length && !activeTags.every((ag) => (t.tags || []).includes(ag))) return false;
      if (!lowerQ) return true;
      const haystack = [t.label, t.description, ...t.categories.map((c) => c.name), ...(t.tags || [])];
      return haystack.some((v) => v.toLowerCase().includes(lowerQ));
    });
  }, [query, activeTags, localizedTemplates]);

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

  // Enhanced category icon mapping
  function getCategoryIcon(categoryName: string, iconName?: string): string {
    // Priority 1: Use specific icon mapping based on category name
    const categoryIconMap: Record<string, string> = {
      // Transportation
      transport: '🚌',
      fuel: '⛽',
      'local transport': '🚇',
      flight: '✈️',
      taxi: '🚕',
      car: '🚗',
      bus: '🚌',
      train: '🚂',

      // Accommodation
      accommodation: '🏨',
      hotel: '🏨',
      hostel: '🏠',
      airbnb: '🏡',
      camping: '⛺',

      // Food & Dining
      food: '🍽️',
      meals: '🍽️',
      dining: '🍽️',
      restaurant: '🍽️',
      groceries: '🛒',
      snacks: '🍿',

      // Entertainment & Activities
      entertainment: '🎭',
      activities: '🏃',
      'activities / excursions': '🗺️',
      sightseeing: '🗽',
      tours: '📸',
      museum: '🏛️',
      nightlife: '🍸',
      shopping: '🛍️',
      'souvenirs / shopping': '🛍️',

      // Miscellaneous
      'misc / incidental': '📋',
      'emergency fund': '🚨',
      insurance: '🛡️',
      documents: '📄',
      visa: '📋',
      'networking / entertainment': '🤝',

      // Beach/Resort specific
      'beach activities': '🏖️',
      'water sports': '🏄',
      'resort amenities': '🌴',
    };

    // Check for exact match (case insensitive)
    const lowerName = categoryName.toLowerCase();
    if (categoryIconMap[lowerName]) {
      return categoryIconMap[lowerName];
    }

    // Priority 2: Use partial matching for common keywords
    if (lowerName.includes('transport') || lowerName.includes('travel')) return '🚌';
    if (lowerName.includes('food') || lowerName.includes('meal') || lowerName.includes('dining')) return '🍽️';
    if (lowerName.includes('accommodation') || lowerName.includes('hotel') || lowerName.includes('stay')) return '🏨';
    if (lowerName.includes('entertainment') || lowerName.includes('activity') || lowerName.includes('fun')) return '🎭';
    if (lowerName.includes('shopping') || lowerName.includes('souvenir')) return '🛍️';
    if (lowerName.includes('emergency') || lowerName.includes('fund')) return '🚨';
    if (lowerName.includes('fuel') || lowerName.includes('gas')) return '⛽';
    if (lowerName.includes('beach') || lowerName.includes('sun')) return '🏖️';

    // Priority 3: Use icon_name as fallback for generic mapping
    if (iconName) {
      const iconMap: Record<string, string> = {
        bus: '🚌',
        bed: '🏨',
        utensils: '🍽️',
        ticket: '🎭',
        fuel: '⛽',
        'alert-triangle': '🚨',
        play: '🎮',
        'more-horizontal': '📋',
        compass: '🧭',
        plane: '✈️',
        car: '🚗',
        home: '🏠',
      };
      if (iconMap[iconName]) {
        return iconMap[iconName];
      }
    }

    // Default fallback
    return '💰';
  }

  if (!dict) {
    return (
      <div
        className="p-4 text-xs rounded-lg border border-brand-orange/40 bg-brand-orange/10 text-brand-orange"
        role="alert"
      >
        {lang === 'pl'
          ? 'Nie udało się załadować tłumaczeń budżetu. Spróbuj ponownie później.'
          : 'Failed to load budget dictionary. Please try again later.'}
      </div>
    );
  }

  return (
    /* Root container: Modern modal design with improved visual hierarchy */
    <div className="flex flex-col gap-6 bg-gradient-to-br from-brand-navy-dark via-brand-navy to-brand-navy-light rounded-2xl p-4 md:p-6 border border-brand-cyan/20 shadow-2xl shadow-brand-navy-dark/50 text-white flex-1 min-h-[70vh] backdrop-blur-sm">
      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
        {/* Left column: Enhanced search, tags, and template list */}
        <div className="w-full md:w-96 flex-shrink-0 flex flex-col gap-5">
          {/* Header section */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-brand-cyan">📊</span>
              {dict?.categories.templateSelectorTitle ||
                (lang === 'pl' ? 'Wybierz szablon budżetu' : 'Choose Budget Template')}
            </h3>
            <p className="text-sm text-brand-cyan/80 leading-relaxed">
              {dict?.categories.templateSelectorSubtitle ||
                (lang === 'pl'
                  ? 'Skorzystaj z gotowych szablonów kategorii budżetowych dostosowanych do różnych typów podróży.'
                  : 'Use pre-made budget category templates tailored for different types of trips.')}
            </p>
          </div>

          {/* Enhanced search input */}
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-cyan/60 group-focus-within:text-brand-cyan transition-colors">
              🔍
            </div>
            <Input
              aria-label={dict?.categories.searchAriaLabel || (lang === 'pl' ? 'Szukaj szablonów' : 'Search templates')}
              placeholder={
                dict?.categories.searchPlaceholderText ||
                (lang === 'pl' ? 'Wpisz nazwę szablonu...' : 'Type template name...')
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-brand-navy-dark/80 border-brand-navy-lighter/60 hover:border-brand-cyan/40 focus:border-brand-cyan pl-10 pr-10 h-11 text-white placeholder:text-brand-cyan/40 rounded-xl transition-all duration-200 shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-cyan/60 hover:text-brand-orange hover:bg-brand-orange/10 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 rounded-full p-1 transition-all duration-200"
                aria-label={dict?.categories.clearSearch || (lang === 'pl' ? 'Wyczyść' : 'Clear')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Enhanced tag filters */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-brand-cyan/80 uppercase tracking-wider">
              {dict?.categories.filtersLabel || (lang === 'pl' ? 'Filtry' : 'Filters')}
            </h4>
            <div
              className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-brand-navy-dark scrollbar-thumb-brand-cyan/30"
              aria-label={dict?.categories.tagFiltersLabel || (lang === 'pl' ? 'Filtry tagów' : 'Tag filters')}
            >
              {allTags.map((tag) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-cyan/60 focus:ring-offset-brand-navy-dark transform hover:scale-105 ${
                      active
                        ? 'bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-navy shadow-lg shadow-brand-cyan/30 border border-brand-cyan/20'
                        : 'bg-brand-navy-light/80 text-brand-cyan/70 hover:text-white hover:bg-brand-navy-lighter border border-brand-navy-lighter/60 hover:border-brand-cyan/40 hover:shadow-md'
                    }`}
                    aria-pressed={active}
                  >
                    {getLocalizedTag(tag, dict)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced template list */}
          <div className="flex-1 space-y-2">
            <h4 className="text-xs font-semibold text-brand-cyan/80 uppercase tracking-wider">
              {dict?.categories.templatesLabel || (lang === 'pl' ? 'Szablony' : 'Templates')}
              <span className="ml-2 text-brand-cyan/60 font-normal">({filtered.length})</span>
            </h4>
            <ul
              role="listbox"
              aria-label={dict?.categories.selectTemplate}
              className="space-y-2 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-brand-navy-dark scrollbar-thumb-brand-cyan/30"
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
                    className={`cursor-pointer group p-4 text-sm rounded-xl focus:outline-none transition-all duration-200 transform hover:scale-[1.02] ${
                      selected
                        ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-cyan/10 border-2 border-brand-cyan/60 shadow-lg shadow-brand-cyan/20 ring-2 ring-brand-cyan/20'
                        : 'bg-brand-navy-light/60 hover:bg-brand-navy-light border border-brand-navy-lighter/40 hover:border-brand-cyan/30 hover:shadow-md backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                          selected
                            ? 'bg-brand-cyan/20 text-brand-cyan ring-2 ring-brand-cyan/40'
                            : 'bg-brand-navy-dark/60 text-brand-cyan/70 group-hover:bg-brand-navy-dark group-hover:text-brand-cyan'
                        }`}
                      >
                        <span role="img" aria-hidden="true">
                          {t.emoji || '📋'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold truncate transition-colors ${
                            selected ? 'text-white' : 'text-brand-cyan/90 group-hover:text-white'
                          }`}
                        >
                          {t.label}
                        </div>
                        <div className="text-xs text-brand-cyan/60 group-hover:text-brand-cyan/80 line-clamp-1 mt-1">
                          {(t.tags || [])
                            .slice(0, 3)
                            .map((tag) => getLocalizedTag(tag, dict))
                            .join(' • ')}
                        </div>
                      </div>
                      {selected && <div className="flex-shrink-0 text-brand-cyan animate-pulse">✓</div>}
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="p-8 text-center space-y-2">
                  <div className="text-2xl text-brand-cyan/40">🔍</div>
                  <div className="text-sm text-brand-cyan/60 font-medium">
                    {dict?.categories.noMatchesFound || (lang === 'pl' ? 'Brak wyników' : 'No matches found')}
                  </div>
                  <div className="text-xs text-brand-cyan/40">
                    {dict?.categories.tryDifferentKeywords ||
                      (lang === 'pl' ? 'Spróbuj innych słów kluczowych' : 'Try different keywords')}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right column: Enhanced preview section */}
        <div className="flex-1 flex flex-col gap-6 bg-gradient-to-br from-brand-navy-light/80 to-brand-navy-dark/90 rounded-2xl p-6 border border-brand-cyan/20 shadow-2xl shadow-black/20 backdrop-blur-sm relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-orange/5 pointer-events-none" />
          <div className="absolute top-4 right-4 text-6xl text-brand-cyan/5 pointer-events-none">💰</div>

          {selectedTemplate ? (
            <div className="flex-1 space-y-6 overflow-auto pr-2 pb-32 min-h-0 relative z-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-cyan/20">
              {/* Enhanced header */}
              <header className="space-y-4 p-4 bg-gradient-to-r from-brand-navy-dark/60 to-brand-navy-light/40 rounded-xl border border-brand-cyan/20 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/10 rounded-2xl flex items-center justify-center text-2xl border-2 border-brand-cyan/30 shadow-lg shadow-brand-cyan/10">
                    <span role="img" aria-hidden="true">
                      {selectedTemplate.emoji || '📊'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      {selectedTemplate.label}
                      <span className="px-2 py-1 bg-brand-cyan/20 text-brand-cyan text-xs font-semibold rounded-full border border-brand-cyan/40">
                        {selectedTemplate.categories.length}{' '}
                        {dict?.categories.categoriesLabel || (lang === 'pl' ? 'kategorii' : 'categories')}
                      </span>
                    </h4>
                    <p className="text-sm leading-relaxed text-brand-cyan/90 mb-3">{selectedTemplate.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedTemplate.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full bg-brand-navy-light/80 text-xs text-brand-cyan/80 border border-brand-navy-lighter/60 font-medium"
                        >
                          {getLocalizedTag(tag, dict)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </header>

              {/* Enhanced distribution bar */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-brand-navy-dark/40 to-brand-navy-light/20 rounded-xl border border-brand-cyan/10">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-brand-cyan/90">
                    {dict?.categories.budgetDistribution ||
                      (lang === 'pl' ? 'Dystrybucja budżetu' : 'Budget Distribution')}
                  </h5>
                  <span className="text-xs text-brand-cyan/60 font-mono">
                    {baseBudget.toLocaleString()} {dict?.categories.currencySymbol || (lang === 'pl' ? 'zł' : '$')}
                  </span>
                </div>
                <div className="relative">
                  <div className="flex h-6 w-full overflow-hidden rounded-lg border-2 border-brand-cyan/20 shadow-inner">
                    {selectedTemplate.categories.map((c, idx) => {
                      const portion = c.suggested_portion;
                      const ratio = isRatio(portion) ? portion || 0 : 0;
                      const width = `${Math.round(ratio * 100)}%`;
                      const palette = [
                        'bg-gradient-to-r from-brand-cyan to-brand-cyan/80',
                        'bg-gradient-to-r from-brand-orange to-brand-orange/80',
                        'bg-gradient-to-r from-brand-cyan/70 to-brand-cyan/50',
                        'bg-gradient-to-r from-brand-orange/70 to-brand-orange/50',
                      ];
                      const color = palette[idx % palette.length];
                      return (
                        <div
                          key={c.name}
                          style={{ width }}
                          className={`relative group ${color} border-r border-brand-navy-dark/50 last:border-r-0 transition-all duration-200 hover:brightness-110`}
                          title={`${c.name}: ${Math.round(ratio * 100)}%`}
                        >
                          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center justify-center font-bold tracking-wide text-white drop-shadow-md">
                            {Math.round(ratio * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan/30 via-brand-orange/30 to-brand-cyan/30 rounded-full blur-sm" />
                </div>
              </div>

              {/* Enhanced category list */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-brand-cyan/90 flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse" />
                  {dict?.categories.categoryDetailsHeading ||
                    (lang === 'pl' ? 'Szczegóły kategorii' : 'Category Details')}
                </h5>
                <div className="space-y-2">
                  {selectedTemplate.categories.map((c, idx) => {
                    const portion = c.suggested_portion;
                    const percent = isRatio(portion) ? Math.round((portion || 0) * 100) : null;
                    const amount = computeAmount(portion);
                    const palette = ['brand-cyan', 'brand-orange', 'brand-cyan', 'brand-orange'];
                    const accentColor = palette[idx % palette.length];
                    return (
                      <div
                        key={c.name}
                        className="group p-4 bg-gradient-to-r from-brand-navy-light/60 to-brand-navy-dark/40 rounded-xl border border-brand-navy-lighter/40 hover:border-brand-cyan/40 transition-all duration-200 hover:shadow-lg hover:shadow-brand-cyan/10"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-12 h-12 flex items-center justify-center rounded-xl bg-${accentColor}/20 border-2 border-${accentColor}/30 group-hover:bg-${accentColor}/30 group-hover:border-${accentColor}/50 transition-all duration-200 shadow-lg`}
                            >
                              <span className="text-xl" role="img" aria-hidden="true">
                                {getCategoryIcon(c.name, c.icon_name)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="font-semibold text-white group-hover:text-brand-cyan transition-colors truncate"
                                title={c.name}
                              >
                                {c.name}
                              </div>
                              {percent !== null && (
                                <div className="text-xs text-brand-cyan/60 mt-1">
                                  {percent}%{' '}
                                  {dict?.categories.percentOfBudget ||
                                    (lang === 'pl' ? '% całkowitego budżetu' : '% of total budget')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-mono space-y-1">
                            {percent !== null && (
                              <div className={`text-sm font-bold text-${accentColor}`}>{percent}%</div>
                            )}
                            {amount && (
                              <div className="text-xs text-brand-cyan/70 whitespace-nowrap">
                                {amount} {dict?.categories.currencySymbol || (lang === 'pl' ? 'zł' : '$')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center space-y-4 relative z-10">
              <div className="space-y-4 max-w-md">
                <div className="text-6xl text-brand-cyan/30">📊</div>
                <h4 className="text-lg font-semibold text-white">
                  {dict?.categories.selectTemplateText || (lang === 'pl' ? 'Wybierz szablon' : 'Select a Template')}
                </h4>
                <p className="text-sm text-brand-cyan/70 leading-relaxed">
                  {dict?.categories.selectTemplatePrompt ||
                    (lang === 'pl'
                      ? 'Wybierz szablon z listy po lewej stronie, aby zobaczyć podgląd kategorii budżetowych i ich rozkład.'
                      : 'Choose a template from the list on the left to see a preview of budget categories and their distribution.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Section - Spanning both columns */}
      <div className="border-t border-brand-cyan/20 pt-6">
        <div className="space-y-4">
          {/* Template info and warnings */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-brand-cyan/90">
                {selectedTemplate
                  ? dict?.categories.selectedTemplateLabel ||
                    (lang === 'pl' ? 'Wybrany szablon:' : 'Selected template:')
                  : dict?.categories.chooseFromList ||
                    (lang === 'pl' ? 'Wybierz szablon z listy.' : 'Choose a template from the list.')}
              </div>
              {selectedTemplate && (
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  {selectedTemplate.emoji && (
                    <span role="img" aria-hidden="true">
                      {selectedTemplate.emoji}
                    </span>
                  )}
                  {selectedTemplate.label}
                </div>
              )}
              {hasExistingCategories && (
                <div className="text-sm text-amber-300/90 font-medium" role="note">
                  {dict?.categories.applyOverwriteHint}
                </div>
              )}
            </div>
          </div>

          {/* Large Apply Button */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {applyingTemplateId ? dict?.categories.applyingAnnounce : ''}
          </div>
          <Button
            disabled={!selectedTemplate || applyingTemplateId === selectedTemplate.id}
            onClick={apply}
            className="relative w-full h-16 bg-emerald-500 text-emerald-950 font-bold tracking-wide text-lg py-4 px-8 shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 hover:shadow-emerald-400/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 active:scale-[0.98] transition-all disabled:opacity-60 border-2 border-emerald-300/40 hover:border-emerald-200/60 rounded-2xl"
          >
            <span className="flex items-center justify-center gap-3">
              {applyingTemplateId === selectedTemplate?.id ? (
                <>
                  <span
                    aria-hidden
                    className="inline-block size-6 animate-spin rounded-full border-3 border-emerald-900/40 border-t-emerald-100"
                  />
                  <span className="text-lg">{dict?.categories.applying || 'Applying...'}</span>
                </>
              ) : (
                <>
                  <span aria-hidden className="text-2xl leading-none text-emerald-100">
                    ⚡
                  </span>
                  <span className="text-lg">
                    {dict?.categories.applyTemplateButton || (lang === 'pl' ? 'Zastosuj szablon' : 'Apply Template')}
                  </span>
                </>
              )}
            </span>
            <span
              className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-emerald-300 shadow-lg ring-2 ring-emerald-600/40 animate-ping [animation-duration:2.5s]"
              aria-hidden
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetTemplateSelector;
