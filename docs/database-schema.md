# Database Schema Documentation

This document describes the database schema for TripCrafti, including recent additions for Durable Objects support.

## Core Tables

### trips
Main trip information table.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| title | text | Trip title |
| destination | text | Destination name |
| start_date | date | Trip start date |
| end_date | date | Trip end date |
| budget | numeric | Total budget |
| currency | text | Budget currency (3-letter code) |
| lodging | text | Hotel/accommodation name |
| lodging_lat | numeric | Accommodation latitude |
| lodging_lon | numeric | Accommodation longitude |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### generateditineraries
AI-generated itinerary storage with Durable Objects support.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| trip_id | uuid | Foreign key to trips |
| preferences_json | jsonb | User preferences for generation |
| generated_plan_json | jsonb | Generated itinerary data |
| status | text | Generation status (GENERATING/COMPLETED/FAILED) |
| model_used | text | - AI model used (e.g., gemini-2.5-flash) |
| generation_duration_ms | integer | - Time taken to generate (milliseconds) |
| input_tokens | integer | - Input tokens used |
| thought_tokens | integer | - Output tokens used |
| error_message | text | - Detailed error message if failed |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### expenses
Trip expense tracking with currency conversion.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| trip_id | uuid | Foreign key to trips |
| category_id | uuid | Foreign key to budget_categories |
| amount | numeric | Original amount |
| currency | text | Original currency |
| amount_in_home_currency | numeric | Converted amount |
| fx_rate | numeric | Exchange rate used |
| fx_source | text | Rate source (cache/live/fallback) |
| description | text | Expense description |
| date | date | Expense date |
| is_prepaid | boolean | Whether paid before trip |
| created_at | timestamptz | Creation timestamp |

### budget_categories
Budget category definitions per trip.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| trip_id | uuid | Foreign key to trips |
| name | text | Category name |
| planned_amount | numeric | Planned budget for category |
| icon_name | text | Icon identifier |
| created_at | timestamptz | Creation timestamp |

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:

```sql
-- Example policy for trips table
CREATE POLICY "Users can only see own trips" ON trips
FOR ALL USING (auth.uid() = user_id);
```

## Indexes

Key indexes for performance:

```sql
-- Trip lookups by user
CREATE INDEX idx_trips_user_id ON trips(user_id);

-- Expense aggregation
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);

-- Itinerary status queries
CREATE INDEX idx_generateditineraries_trip_id ON generateditineraries(trip_id);
CREATE INDEX idx_generateditineraries_status ON generateditineraries(status);
```

## Data Types

### ItineraryPreferences (JSON)
```typescript
{
  interests: string[],
  travelStyle: 'Relaxed' | 'Balanced' | 'Intense',
  budget: string,
  language: string,
  adultsCount?: number,
  kidsCount?: number,
  kidsAges?: number[],
  hotelNameOrUrl?: string,
  maxTravelDistanceKm?: number
}
```

### Generated Plan (JSON)
```typescript
{
  days: Array<{
    date: string,
    activities: Array<{
      time: string,
      name: string,
      description: string,
      cost?: number,
      currency?: string,
      duration?: string
    }>
  }>
}
```

## Backup and Maintenance

Regular maintenance tasks:

```sql
-- Clean up old failed generations (older than 30 days)
DELETE FROM generateditineraries 
WHERE status = 'FAILED' 
AND created_at < NOW() - INTERVAL '30 days';

-- Analytics query: successful generation rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM generateditineraries 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

## Performance Monitoring

Useful queries for monitoring:

```sql
-- Average generation times by model
SELECT 
  model_used,
  COUNT(*) as generations,
  AVG(generation_duration_ms) as avg_duration_ms,
  MAX(generation_duration_ms) as max_duration_ms
FROM generateditineraries 
WHERE status = 'COMPLETED' 
AND generation_duration_ms IS NOT NULL
GROUP BY model_used
ORDER BY avg_duration_ms;

-- Token usage analysis
SELECT 
  DATE(created_at) as date,
  COUNT(*) as generations,
  AVG(input_tokens) as avg_input_tokens,
  AVG(thought_tokens) as avg_output_tokens,
  SUM(input_tokens + COALESCE(thought_tokens, 0)) as total_tokens
FROM generateditineraries 
WHERE status = 'COMPLETED'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```