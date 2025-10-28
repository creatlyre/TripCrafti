// Predefined budget category templates
// Each template contains a human readable label and a list of categories
// plannedAmount is optional (can be interpreted as absolute default or percentage of trip budget on client side)
// Icons map to existing icon names (extend as needed)

export interface BudgetCategoryTemplateItem {
  name: string;
  icon_name?: string;
  // percentage of overall budget (0-1) OR default flat amount
  suggested_portion?: number; // treat < 1 as ratio, >= 1 as absolute amount
  description?: string;
}

export interface BudgetCategoryTemplateSet {
  id: string;
  label: string;
  description: string;
  categories: BudgetCategoryTemplateItem[];
}

// Refactored to match streamlined UI (3 core templates) displayed in budget category modal.
// Percentages sum to 1 (100%) for each template.
export const BUDGET_CATEGORY_TEMPLATES: BudgetCategoryTemplateSet[] = [
  {
    id: 'city_break_basic',
    label: 'City Break',
    description: 'Short city getaway (2–4 days) with food, attractions & transit.',
    categories: [
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.25 },
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.35 },
      { name: 'Meals', icon_name: 'utensils', suggested_portion: 0.25 },
      { name: 'Entertainment', icon_name: 'ticket', suggested_portion: 0.15 },
    ],
  },
  {
    id: 'road_trip',
    label: 'Road Trip',
    description: 'Driving adventure with fuel, lodging & flexible stops.',
    categories: [
      { name: 'Fuel', icon_name: 'fuel', suggested_portion: 0.3 },
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.25 },
      { name: 'Food', icon_name: 'utensils', suggested_portion: 0.2 },
      { name: 'Entertainment', icon_name: 'ticket', suggested_portion: 0.15 },
      { name: 'Emergency Fund', icon_name: 'alert-triangle', suggested_portion: 0.1 },
    ],
  },
  {
    id: 'family_holiday',
    label: 'Family Holiday',
    description: 'Family-friendly trip with balanced spending.',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.4 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.25 },
      { name: 'Food', icon_name: 'utensils', suggested_portion: 0.2 },
      { name: 'Entertainment', icon_name: 'play', suggested_portion: 0.15 },
    ],
  },
  // New extended templates
  {
    id: 'business_trip',
    label: 'Business Trip',
    description: 'Work-focused travel with emphasis on lodging & meals with some incidentals.',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.45 },
      { name: 'Meals', icon_name: 'utensils', suggested_portion: 0.25 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.15 },
      { name: 'Misc / Incidental', icon_name: 'more-horizontal', suggested_portion: 0.1 },
      { name: 'Networking / Entertainment', icon_name: 'ticket', suggested_portion: 0.05 },
    ],
  },
  {
    id: 'backpacking',
    label: 'Backpacking',
    description: 'Budget-conscious multi-stop travel with transit & hostels.',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.25 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.3 },
      { name: 'Food', icon_name: 'utensils', suggested_portion: 0.25 },
      { name: 'Activities', icon_name: 'compass', suggested_portion: 0.15 },
      { name: 'Emergency Fund', icon_name: 'alert-triangle', suggested_portion: 0.05 },
    ],
  },
  {
    id: 'beach_holiday',
    label: 'Beach Holiday',
    description: 'Relaxation-focused coastal stay: lodging & food dominate.',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.4 },
      { name: 'Food', icon_name: 'utensils', suggested_portion: 0.25 },
      { name: 'Local Transport', icon_name: 'bus', suggested_portion: 0.1 },
      { name: 'Activities / Excursions', icon_name: 'sun', suggested_portion: 0.15 },
      { name: 'Souvenirs / Shopping', icon_name: 'shopping-bag', suggested_portion: 0.1 },
    ],
  },
  {
    id: 'luxury_getaway',
    label: 'Luxury Getaway',
    description: 'Premium experience with upscale lodging & dining.',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.5 },
      { name: 'Fine Dining', icon_name: 'utensils', suggested_portion: 0.25 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.1 },
      { name: 'Experiences', icon_name: 'star', suggested_portion: 0.1 },
      { name: 'Shopping', icon_name: 'shopping-bag', suggested_portion: 0.05 },
    ],
  },
  {
    id: 'ski_trip',
    label: 'Ski Trip',
    description: 'Mountain travel with passes, gear & lodging.',
    categories: [
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.35 },
      { name: 'Ski Pass & Gear', icon_name: 'snowflake', suggested_portion: 0.25 },
      { name: 'Food', icon_name: 'utensils', suggested_portion: 0.2 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.1 },
      { name: 'Après-ski / Entertainment', icon_name: 'play', suggested_portion: 0.1 },
    ],
  },
  {
    id: 'adventure_trek',
    label: 'Adventure Trek',
    description: 'Outdoor trekking with gear, guides & permits.',
    categories: [
      { name: 'Guides / Permits', icon_name: 'map', suggested_portion: 0.25 },
      { name: 'Gear / Equipment', icon_name: 'backpack', suggested_portion: 0.25 },
      { name: 'Accommodation', icon_name: 'bed', suggested_portion: 0.15 },
      { name: 'Food', icon_name: 'utensils', suggested_portion: 0.2 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.15 },
    ],
  },
];

export function isRatio(value?: number) {
  return typeof value === 'number' && value > 0 && value < 1;
}
