import React from 'react';
import { PassportIcon, TShirtIcon, ShoeIcon, CosmeticIcon, PillIcon, PlugIcon, BabyIcon, ActivityIcon, BagIcon, DefaultIcon } from '@/components/icons/CategoryIcons';

export const CATEGORY_ICONS: { [key: string]: React.FC } = {
  'Dokumenty i Finanse': PassportIcon,
  'Ubrania': TShirtIcon,
  'Obuwie': ShoeIcon,
  'Higiena i Kosmetyki': CosmeticIcon,
  'Apteczka': PillIcon,
  'Elektronika': PlugIcon,
  'Dzieci': BabyIcon,
  'Nati': BabyIcon,
  'Aktywności Specjalne': ActivityIcon,
  'W Podróży (Podręczne)': BagIcon,
  'Inne': DefaultIcon,
  'My': TShirtIcon,
  'Psy': DefaultIcon,
  'Nieskategoryzowane': DefaultIcon,
  'default': DefaultIcon,
};

/**
 * Get the icon component for a category
 */
export function getCategoryIcon(category: string): React.FC {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
}