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

export const BUDGET_CATEGORY_TEMPLATES: BudgetCategoryTemplateSet[] = [
  {
    id: 'city_break_basic',
    label: 'City Break (Basic)',
    description: '2-4 day urban exploration with food, transit & culture focus.',
    categories: [
      { name: 'Food & Drinks', icon_name: 'utensils', suggested_portion: 0.35 },
      { name: 'Local Transport', icon_name: 'bus', suggested_portion: 0.1 },
      { name: 'Attractions & Tickets', icon_name: 'ticket', suggested_portion: 0.2 },
      { name: 'Coffee / Snacks', icon_name: 'coffee', suggested_portion: 0.05 },
      { name: 'Shopping / Souvenirs', icon_name: 'shopping-bag', suggested_portion: 0.15 },
      { name: 'Misc / Buffer', icon_name: 'ellipsis', suggested_portion: 0.15 },
    ],
  },
  {
    id: 'road_trip',
    label: 'Road Trip',
    description: 'Fuel heavy itinerary with scenic stops & lodging.',
    categories: [
      { name: 'Fuel', icon_name: 'fuel', suggested_portion: 0.25 },
      { name: 'Food (Groceries)', icon_name: 'shopping-cart', suggested_portion: 0.15 },
      { name: 'Dining Out', icon_name: 'utensils', suggested_portion: 0.15 },
      { name: 'Lodging', icon_name: 'bed', suggested_portion: 0.25 },
      { name: 'Attractions / Parks', icon_name: 'tree', suggested_portion: 0.1 },
      { name: 'Tolls / Parking', icon_name: 'car', suggested_portion: 0.05 },
      { name: 'Emergency / Buffer', icon_name: 'alert-triangle', suggested_portion: 0.05 },
    ],
  },
  {
    id: 'family_holiday',
    label: 'Family Holiday',
    description: 'Relaxed multi-day trip with kids-focused activities.',
    categories: [
      { name: 'Family Meals', icon_name: 'utensils', suggested_portion: 0.3 },
      { name: 'Kids Activities', icon_name: 'smile', suggested_portion: 0.15 },
      { name: 'Entertainment', icon_name: 'play', suggested_portion: 0.15 },
      { name: 'Groceries', icon_name: 'shopping-cart', suggested_portion: 0.1 },
      { name: 'Transport', icon_name: 'bus', suggested_portion: 0.1 },
      { name: 'Health / Pharmacy', icon_name: 'heart', suggested_portion: 0.05 },
      { name: 'Gifts / Souvenirs', icon_name: 'gift', suggested_portion: 0.1 },
      { name: 'Buffer', icon_name: 'ellipsis', suggested_portion: 0.05 },
    ],
  },
  {
    id: 'backpacking_minimal',
    label: 'Backpacking (Minimal)',
    description: 'Low-cost travel focused on essentials & experiences.',
    categories: [
      { name: 'Hostels / Lodging', icon_name: 'bed', suggested_portion: 0.3 },
      { name: 'Street Food', icon_name: 'utensils', suggested_portion: 0.2 },
      { name: 'Transit / Buses', icon_name: 'bus', suggested_portion: 0.15 },
      { name: 'Attractions', icon_name: 'ticket', suggested_portion: 0.15 },
      { name: 'Laundry', icon_name: 'droplet', suggested_portion: 0.02 },
      { name: 'SIM / Connectivity', icon_name: 'wifi', suggested_portion: 0.03 },
      { name: 'Gear / Repairs', icon_name: 'tool', suggested_portion: 0.05 },
      { name: 'Buffer', icon_name: 'ellipsis', suggested_portion: 0.1 },
    ],
  },
  {
    id: 'luxury_getaway',
    label: 'Luxury Getaway',
    description: 'High-comfort trip emphasizing dining & experiences.',
    categories: [
      { name: 'Fine Dining', icon_name: 'utensils', suggested_portion: 0.3 },
      { name: 'Spa / Wellness', icon_name: 'heart', suggested_portion: 0.1 },
      { name: 'Private Transport', icon_name: 'car', suggested_portion: 0.15 },
      { name: 'Premium Experiences', icon_name: 'star', suggested_portion: 0.2 },
      { name: 'Shopping', icon_name: 'shopping-bag', suggested_portion: 0.15 },
      { name: 'Tips / Service', icon_name: 'hand', suggested_portion: 0.05 },
      { name: 'Buffer', icon_name: 'ellipsis', suggested_portion: 0.05 },
    ],
  },
];

export function isRatio(value?: number) {
  return typeof value === 'number' && value > 0 && value < 1;
}
