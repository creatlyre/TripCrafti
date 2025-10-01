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

// --- Packing Assistant Types ---

export interface PackingItem {
  id: number; // For client-side keying and state updates
  name: string;
  qty: number | string;
  category: string;
  notes?: string;
  optional?: boolean;
  packed: boolean; // For client-side state management
}

export interface PackingListMeta {
  destination: string;
  days: number;
  people: { adults: number; children: number };
  season: string;
  transport?: string;
  accommodation?: string;
  activities?: string[];
  archetype?: string;
}

// The direct response from the AI
export interface AIPackingListResponse {
  meta: PackingListMeta;
  checklist: { task: string; done: boolean }[];
  items: Omit<PackingItem, 'id' | 'packed'>[];
}

export interface GenerateDetails {
  destination: string;
  days: string;
  adults: string;
  childrenAges: string;
  season: string;
  transport: string;
  accommodation: string;
  activities: string;
  special: string;
  region?: string;
  travelStyle?: string;
}

export interface ValidationResult {
  missing: { name: string; category: string; reason: string }[];
  remove: { name: string; reason: string }[];
  adjust: { name: string; field: string; current: any; suggested: any; reason: string }[];
  replace: {
    items_to_remove: string[];
    suggested_item: { name: string; category: string };
    reason: string;
  }[];
  error?: string;
}

export interface ChecklistItem {
  id: number;
  task: string;
  done: boolean;
}

export interface ItemDefinition {
  id: string; // e.g. 'doc_passport'
  name: string; // 'Paszport'
  category: string; // 'Dokumenty i Finanse'
  defaultQty: string;
  tags: string[]; // e.g. ['essential', 'documents', 'international']
  relevance: number; // 1-10, 10 is most important
  notes?: string; // e.g. 'Sprawdź datę ważności!'
}

export interface ItemLibraryCategory {
    title: string;
    itemIds: string[];
}

export interface SavedList {
    packingItems: PackingItem[];
    checklistItems: ChecklistItem[];
    categories: string[];
    listMeta: PackingListMeta | null;
}

export interface CategorizationResult {
  id: number;
  category: string;
}
