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
}

export type ItineraryStatus = 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface ItineraryPreferences {
  interests: string[];
  travelStyle: 'Relaxed' | 'Balanced' | 'Intense';
  budget: string;
  language: string;
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
