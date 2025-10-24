// Predefined budget category templates
// Each template contains an i18n key for labels/descriptions and a list of categories
// plannedAmount is optional (can be interpreted as absolute default or percentage of trip budget on client side)
// Icons map to existing icon names (extend as needed)
//
// NOTE: Labels and descriptions are now retrieved from i18n.budget.categoryTemplates
// using the template id as the key

export interface BudgetCategoryTemplateItem {
  name: string;
  icon_name?: string;
  // percentage of overall budget (0-1) OR default flat amount
  suggested_portion?: number; // treat < 1 as ratio, >= 1 as absolute amount
  description?: string;
}

export interface BudgetCategoryTemplateSet {
  id: string;
  // label and description are now retrieved from i18n.budget.categoryTemplates[id]
  categories: BudgetCategoryTemplateItem[];
}

export const BUDGET_CATEGORY_TEMPLATES: BudgetCategoryTemplateSet[] = [
  {
    id: 'cityBreak',
    categories: [
      { name: 'Transportation', icon_name: 'car', suggested_portion: 0.25 },
      { name: 'Accommodation', icon_name: 'hotel', suggested_portion: 0.35 },
      { name: 'Meals', icon_name: 'utensils', suggested_portion: 0.25 },
      { name: 'Entertainment', icon_name: 'ticket', suggested_portion: 0.15 },
    ],
  },
  {
    id: 'roadTrip',
    categories: [
      { name: 'Fuel', icon_name: 'gas-pump', suggested_portion: 0.3 },
      { name: 'Accommodation', icon_name: 'tent', suggested_portion: 0.25 },
      { name: 'Food', icon_name: 'shopping-cart', suggested_portion: 0.2 },
      { name: 'Entertainment', icon_name: 'ticket', suggested_portion: 0.15 },
      { name: 'Emergency Fund', icon_name: 'shield', suggested_portion: 0.1 },
    ],
  },
  {
    id: 'familyHoliday',
    categories: [
      { name: 'Accommodation', icon_name: 'hotel', suggested_portion: 0.4 },
      { name: 'Transportation', icon_name: 'plane', suggested_portion: 0.25 },
      { name: 'Meals', icon_name: 'utensils', suggested_portion: 0.2 },
      { name: 'Entertainment', icon_name: 'gamepad-2', suggested_portion: 0.15 },
    ],
  },
  {
    id: 'backpacking',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.3 },
      { name: 'Transportation', icon_name: 'bus', suggested_portion: 0.25 },
      { name: 'Food', icon_name: 'apple', suggested_portion: 0.25 },
      { name: 'Equipment', icon_name: 'backpack', suggested_portion: 0.1 },
      { name: 'Emergency', icon_name: 'alert-triangle', suggested_portion: 0.1 },
    ],
  },
  {
    id: 'luxuryGetaway',
    categories: [
      { name: 'Accommodation', icon_name: 'crown', suggested_portion: 0.45 },
      { name: 'Fine Dining', icon_name: 'chef-hat', suggested_portion: 0.25 },
      { name: 'Transportation', icon_name: 'car-luxury', suggested_portion: 0.15 },
      { name: 'Spa & Wellness', icon_name: 'flower', suggested_portion: 0.1 },
      { name: 'Souvenirs', icon_name: 'gift', suggested_portion: 0.05 },
    ],
  },
];

export function isRatio(value?: number) {
  return typeof value === 'number' && value > 0 && value < 1;
}
