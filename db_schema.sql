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