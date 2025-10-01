// Shared domain types
// Trip entity shape matches 'trips' table returned by Supabase
export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  budget: number | null;
  currency: string | null;
  // Optional lodging metadata (may be null if user did not provide)
  lodging?: string | null;
  lodging_lat?: number | null;
  lodging_lon?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Payload for creating a trip (POST /api/trips)
export interface TripInput {
  title: string;
  destination: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  budget?: number; // optional
  currency?: string; // optional
  lodging?: string; // optional lodging string provided by user (name / URL / address)
}

export type ItineraryStatus = 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface ItineraryPreferences {
  interests: string[];
  travelStyle: 'Relaxed' | 'Balanced' | 'Intense';
  budget: string;
  language: string;
  // Optional richer context for itinerary generation
  adultsCount?: number; // number of adult travelers
  kidsCount?: number; // number of kids
  kidsAges?: number[]; // ages of kids in years corresponding to kidsCount
  hotelNameOrUrl?: string; // hotel name, address or booking URL provided by user
  maxTravelDistanceKm?: number; // optional max distance in km for daily activities from lodging
}

export interface Activity {
  time: string;
  activity_name: string;
  description: string;
  estimated_cost: number;
  currency: string;
}

export interface DayPlan {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export interface Itinerary {
  itinerary: DayPlan[];
}

export interface GeneratedItinerary {
  id: string;
  trip_id: string;
  preferences_json: ItineraryPreferences;
  generated_plan_json: Itinerary;
  status: ItineraryStatus;
  input_tokens?: number | null;
  thought_tokens?: number | null;
  created_at: string;
  updated_at: string;
}

// ========================= Budget & Expenses =========================
export interface BudgetCategory {
  id: string;
  trip_id: string;
  name: string;
  planned_amount: number; // numeric in DB -> number in FE
  icon_name?: string | null;
  created_at?: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  category_id?: string | null;
  description?: string | null;
  amount: number; // original amount in provided currency
  currency: string; // ISO 4217 code
  amount_in_home_currency: number; // normalized to trip currency
  is_prepaid: boolean;
  expense_date: string; // ISO timestamp
  created_at?: string;
  category?: BudgetCategory | null; // optional joined data
}

export interface BudgetSummary {
  trip_id: string;
  totalBudget: number | null; // planned total from trip
  totalPlannedCategories: number; // sum of planned_amount across categories
  totalSpent: number; // sum of all expenses (excluding prepaid? we expose both)
  totalSpentPrepaid: number; // sum where is_prepaid true
  totalSpentOnTrip: number; // totalSpent - totalSpentPrepaid
  remaining: number | null; // totalBudget - totalSpent
  dailySpendTarget: number | null; // remaining / remainingDays (server calc)
  spentTodayOnTrip?: number; // Phase 2: variable spending today (excludes prepaid)
  safeToSpendToday?: number | null; // Phase 2: dailySpendTarget - spentTodayOnTrip (>=0)
  spentByCategory: {
    category_id: string | null;
    category: string | null;
    planned: number | null; // planned_amount if category
    spent: number; // sum of expenses
  }[];
}

// Phase 3: Detailed budget report (planned vs actual) for post-trip analysis
export interface BudgetReportCategoryRow {
  category_id: string;
  name: string;
  planned: number;
  spent: number;
  delta: number; // spent - planned
  utilization: number | null; // spent / planned (null if planned 0)
}

export interface BudgetReport {
  trip_id: string;
  currency: string | null;
  plannedTotal: number; // sum of planned across categories
  totalSpent: number; // all expenses
  totalPrepaid: number; // prepaid expenses
  totalOnTrip: number; // totalSpent - totalPrepaid
  deltaTotal: number; // totalSpent - plannedTotal
  categories: BudgetReportCategoryRow[];
  generated_at: string; // ISO timestamp
}

// Budget display mode for UI (purely front-end, does not affect API responses)
export type BudgetMode = 'simple' | 'full';
