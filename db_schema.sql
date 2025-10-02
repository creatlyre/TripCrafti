CREATE TYPE itinerary_status AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

CREATE TABLE GeneratedItineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES Trips(id) ON DELETE CASCADE,
    preferences_json JSONB,
    generated_plan_json JSONB,
    input_tokens INT,
    thought_tokens INT,
    status itinerary_status DEFAULT 'GENERATING',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget NUMERIC,
  currency TEXT,
  lodging TEXT,
  lodging_lat DOUBLE PRECISION,
  lodging_lon DOUBLE PRECISION,
  -- Tracks how many times the user re-generated the packing list (AI) for this trip
  packing_regenerations INT NOT NULL DEFAULT 0,
  -- AI Packing token usage metrics (nullable until first generation)
  packing_ai_input_tokens INT,
  packing_ai_output_tokens INT,
  packing_ai_total_tokens INT,
  packing_ai_thought_tokens INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packing List Tables
CREATE TABLE packing_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    categories TEXT[] NOT NULL DEFAULT '{}',
    list_meta JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(trip_id) -- Ensure only one packing list per trip
);

CREATE TABLE packing_items (
    id BIGSERIAL PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    qty TEXT DEFAULT '1',
    category TEXT NOT NULL,
    packed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checklist_items (
    id BIGSERIAL PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    task TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- Row Level Security (RLS) policies
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Trips
CREATE POLICY "Users can view their own trips" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- Packing Lists
CREATE POLICY "Users can view their own packing lists" ON packing_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own packing lists" ON packing_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own packing lists" ON packing_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own packing lists" ON packing_lists FOR DELETE USING (auth.uid() = user_id);

-- Packing Items
CREATE POLICY "Users can view their own packing items" ON packing_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own packing items" ON packing_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own packing items" ON packing_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own packing items" ON packing_items FOR DELETE USING (auth.uid() = user_id);


-- Checklist Items
CREATE POLICY "Users can view their own checklist items" ON checklist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own checklist items" ON checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checklist items" ON checklist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own checklist items" ON checklist_items FOR DELETE USING (auth.uid() = user_id);


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
  fx_rate NUMERIC, -- stored effective rate used for conversion (NULL if same currency or unavailable)
  fx_source TEXT,  -- 'live' | 'cache' | 'identity' | 'fallback'
  fx_warning TEXT, -- optional warning message when source='fallback'
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

-- =============================================
-- FX Daily Cache (stores one JSON blob of quotes per base & date)
-- =============================================
CREATE TABLE IF NOT EXISTS fx_daily_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,           -- e.g. 'USD'
  rate_date DATE NOT NULL,               -- UTC date the quotes represent
  provider TEXT NOT NULL DEFAULT 'exchangerate.host',
  quotes JSONB NOT NULL,                 -- raw quotes object { "USDPLN": 3.73, ... }
  source_api TEXT,                       -- endpoint used (live/timeframe/etc)
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(base_currency, rate_date, provider)
);

-- =============================================================
-- Packing Share Links (Temporary collaborative access tokens)
-- =============================================================
-- A share link grants limited access to a trip's packing list via a random token.
-- Rules:
--  * Viewer identified only by possession of token (no auth context required for shared view endpoints)
--  * Can read packing list, items, checklist
--  * Can add or update (toggle packed, update qty/name/category, add checklist/task)
--  * Cannot delete items or checklist tasks
--  * Cannot regenerate or perform AI-cost operations
--  * Optional expiration revokes access automatically
--  * Owner can revoke by deleting the row
-- NOTE: Because anonymous access is required, RLS alone cannot authorize token-based access.
-- Strategy:
--  * RLS remains strict (auth.uid() must match) for base tables
--  * Share endpoints run with a service role key server-side and manually enforce token scope
--  * Token lookups performed server-side; client never receives service key

CREATE TABLE IF NOT EXISTS packing_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- opaque random string (e.g. 32-40 chars)
  can_modify BOOLEAN DEFAULT TRUE, -- future flexibility; if false treat as read-only
  expires_at TIMESTAMPTZ, -- null = no expiration
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked BOOLEAN DEFAULT FALSE
);

ALTER TABLE packing_share_links ENABLE ROW LEVEL SECURITY;

-- Only trip owner can manage share links through authenticated context
CREATE POLICY "Select own share links" ON packing_share_links
  FOR SELECT USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = packing_share_links.trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Insert own share links" ON packing_share_links
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Update own share links" ON packing_share_links
  FOR UPDATE USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE POLICY "Delete own share links" ON packing_share_links
  FOR DELETE USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

-- NOTE: Anonymous token-based access DOES NOT go directly to Supabase client-side.
-- Endpoints will:
--   1. Accept token in path.
--   2. Validate not expired / not revoked.
--   3. Fetch packing list + items via service role.
--   4. Allow only allowed mutation set (no deletes) when can_modify = true.
--   5. Reject if token invalid, expired, revoked.
-- Consider scheduled cleanup of expired tokens.
