import React from 'react';

import {
  PassportIcon,
  TShirtIcon,
  ShoeIcon,
  CosmeticIcon,
  PillIcon,
  PlugIcon,
  BabyIcon,
  ActivityIcon,
  BagIcon,
  DefaultIcon,
} from '@/components/icons/CategoryIcons';

// Packing Constants

export const DEFAULT_CATEGORIES: string[] = [
  'Dokumenty i Finanse',
  'Ubrania',
  'Obuwie',
  'Higiena i Kosmetyki',
  'Apteczka',
  'Elektronika',
  'Dzieci',
  'Aktywności Specjalne',
  'W Podróży (Podręczne)',
  'Inne',
  'Nieskategoryzowane',
  'Plaża',
  'Narty',
  'Trekking',
  'Rozrywka',
].sort((a, b) => a.localeCompare(b));

export const CATEGORY_ICONS: Record<string, React.FC> = {
  'Dokumenty i Finanse': PassportIcon,
  Ubrania: TShirtIcon,
  Obuwie: ShoeIcon,
  'Higiena i Kosmetyki': CosmeticIcon,
  Apteczka: PillIcon,
  Elektronika: PlugIcon,
  Dzieci: BabyIcon,
  Nati: BabyIcon,
  'Aktywności Specjalne': ActivityIcon,
  'W Podróży (Podręczne)': BagIcon,
  Inne: DefaultIcon,
  My: TShirtIcon,
  Psy: DefaultIcon,
  Nieskategoryzowane: DefaultIcon,
  Plaża: ActivityIcon,
  Narty: ActivityIcon,
  Trekking: ActivityIcon,
  Rozrywka: DefaultIcon,
  default: DefaultIcon,
};

// Default debounce delay for auto-saving
export const AUTO_SAVE_DELAY = 1500; // 1.5 seconds

// Toast notification duration
export const TOAST_DURATION = 3000; // 3 seconds
