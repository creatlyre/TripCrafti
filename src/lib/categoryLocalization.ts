import type { Dictionary } from './i18n';

/** Canonical keys for categories & quick add groups.
 * Source data currently uses Polish human-readable labels. We map them to stable keys
 * so we can display localized versions without migrating stored data yet.
 */
export const POLISH_CATEGORY_TO_KEY: Record<string, string> = {
  'Dokumenty i Finanse': 'documents_finance',
  Elektronika: 'electronics',
  'Higiena i Kosmetyki': 'hygiene_beauty',
  Apteczka: 'first_aid',
  Ubrania: 'clothing',
  Obuwie: 'footwear',
  'Komfort i Sen': 'comfort_sleep',
  'Organizacja i Bezpieczeństwo': 'organization_security',
  'Akcesoria Plażowe i Letnie': 'beach_summer',
  'Ekwipunek na Chłody i Zimę': 'cold_winter',
  Dzieci: 'child', // generic children category in some items
  'W Podróży (Podręczne)': 'travel_accessories',
  'Aktywności Specjalne': 'special_activities',
  Inne: 'other',
};

// Some items use Baby-specific or Dog categories only in quick add groups; mapping for completeness.
export const POLISH_GROUP_TITLE_TO_KEY: Record<string, string> = {
  'Niezbędnik Podróżnika': 'essentials',
  'Elektronika i Gadżety': 'electronics',
  'Higiena i Pielęgnacja': 'hygiene',
  'Apteczka Podróżna': 'firstAid',
  Ubrania: 'clothing',
  Obuwie: 'footwear',
  'Komfort i Sen': 'comfortSleep',
  'Organizacja i Bezpieczeństwo': 'organizationSecurity',
  'Akcesoria Plażowe i Letnie': 'beachSummer',
  'Ekwipunek na Chłody i Zimę': 'coldWinter',
  'Podróż z Niemowlakiem (0-2 lata)': 'baby',
  'Podróż z Dzieckiem (2+ lata)': 'child',
  'Podróż z psem': 'dog',
  'Praca zdalna': 'remoteWork',
  'Sprzęt fotograficzny': 'photography',
  'Wędrówka / Trekking': 'hiking',
  'Eleganckie wyjście': 'elegant',
  'Do Samochodu': 'car',
};

// Fallback order: explicit dict > same raw label
export function localizeCategory(raw: string, dict: Dictionary | undefined): string {
  if (!raw) return raw;
  const key = POLISH_CATEGORY_TO_KEY[raw] || raw; // if already a key or english label keep as is
  // If raw already seems like a key (contains underscore) use directly
  const resolvedKey = key.includes('_') ? key : POLISH_CATEGORY_TO_KEY[key] || key;
  const labels = dict?.packing?.categoryLabels;
  return labels?.[resolvedKey] || raw;
}

export function localizeQuickAddGroup(raw: string, dict: Dictionary | undefined): string {
  if (!raw) return raw;
  const key = POLISH_GROUP_TITLE_TO_KEY[raw] || raw;
  const groups = dict?.packing?.quickAddGroups;
  return groups?.[key] || raw;
}

/** Utility to get a list of localized category labels preserving original value for selection controls.
 * Returns array of { value: originalRaw, label: localizedDisplay }
 */
export function mapCategoriesForSelect(categories: string[], dict: Dictionary | undefined) {
  return categories.map((c) => ({ value: c, label: localizeCategory(c, dict) }));
}
