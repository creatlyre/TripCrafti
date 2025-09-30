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
