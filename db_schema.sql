CREATE TYPE itinerary_status AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

CREATE TABLE GeneratedItineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES Trips(id) ON DELETE CASCADE,
    preferences_json JSONB,
    generated_plan_json JSONB,
    -- Token accounting (optional) for pricing / analytics
    input_tokens INT,            -- tokens consumed by the prompt / input
    thought_tokens INT,          -- tokens used by model reasoning or output (approx. output tokens)
    status itinerary_status DEFAULT 'GENERATING',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- The 'trips' table that MUST exist in your Supabase database
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget NUMERIC,
  currency TEXT,
  -- Optional lodging data (new fields) - run ALTER TABLE if migrating existing DB
  lodging TEXT,
  lodging_lat DOUBLE PRECISION,
  lodging_lon DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Users can only see their own trips
CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only create trips for themselves
CREATE POLICY "Users can create their own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own trips
CREATE POLICY "Users can delete their own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Budget & Expenses extension (BudgetCraft v1)
-- =============================================

-- Budget categories per trip
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  planned_amount NUMERIC NOT NULL,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Users can manage categories only for their trips
CREATE POLICY "Select own categories" ON budget_categories
  FOR SELECT USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = budget_categories.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Insert own categories" ON budget_categories
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY  "Update own categories" ON budget_categories
  FOR UPDATE USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Delete own categories" ON budget_categories
  FOR DELETE USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

-- Expenses per trip with optional category (null if deleted)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  amount_in_home_currency NUMERIC NOT NULL,
  fx_rate NUMERIC;
  is_prepaid BOOLEAN DEFAULT FALSE,
  expense_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY  "Select own expenses" ON expenses
  FOR SELECT USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = expenses.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Insert own expenses" ON expenses
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Update own expenses" ON expenses
  FOR UPDATE USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Delete own expenses" ON expenses
  FOR DELETE USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));