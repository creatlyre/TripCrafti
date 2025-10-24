# TripCrafti Architecture

This document describes the high-level system architecture and main flows.

## 1. System Overview
```mermaid
flowchart LR
  subgraph Client[Browser]
    UI[React Components / Astro Pages]
  end
  UI --> SSR[Astro Server Runtime]
  SSR --> API{{Astro API Endpoints}}
  API --> DO[Cloudflare Durable Objects]
  API --> Supabase[(Supabase\nAuth + Postgres)]
  DO --> Gemini[(Google Gemini AI)]
  API --> FX[(exchangerate.host)]
  UI --> Assets[(Static Assets / Images)]
  Assets --> CDN[(Cloudflare Pages)]
```

## 2. Logical Layers
```mermaid
graph TD
  A[UI / Components] --> B[Hooks (state, side-effects)]
  B --> C[Services (lib/services)]
  C --> D[Integrations: Durable Objects / Gemini / FX / Supabase]
  D --> E[Storage: Supabase Tables + Cloudflare KV]
```
* **Components** – presentation, minimal logic.
* **Hooks** – state composition, fetch, transformations.
* **Services** – pure domain logic / external API adapters.
* **Integrations** – format and protocol translation.
* **Storage** – persistence (PostgreSQL, row-level security, Cloudflare KV for secrets).

## 3. Flow: Itinerary Generation (Durable Objects)
```mermaid
sequenceDiagram
  participant U as User
  participant UI as UI (Dashboard)
  participant API as /api/trips/:id/itinerary
  participant DO as Durable Object
  participant G as Gemini
  participant DB as Supabase

  U->>UI: Sends preferences
  UI->>API: POST JSON (preferences)
  API->>DB: INSERT (status: GENERATING)
  API->>DO: Create stub + call /generate
  DO->>DO: Set alarm (5 min timeout)
  DO->>G: Prompt (structured contract)
  G-->>DO: JSON (itinerary days)
  DO->>DB: UPDATE (status: COMPLETED, plan_json)
  DO->>DO: Delete alarm
  API-->>UI: 202 Accepted (generation started)
  UI->>UI: Poll status endpoint
  UI-->>U: Display daily plan
```

## 4. Flow: AI Packing (unchanged)
```mermaid
sequenceDiagram
  participant U as User
  participant UI as Packing Assistant
  participant API as /api/ai/packing
  participant G as Gemini

  U->>UI: Click "Regenerate"
  UI->>API: POST { mode: regenerate, context }
  API->>G: Prompt (diff aware)
  G-->>API: New JSON list
  API-->>UI: diff preview (delta items)
  U->>UI: Accept / Partial add
  UI->>UI: Merge into local state
```

## 5. FX Conversion Lifecycle (unchanged)
```mermaid
sequenceDiagram
  participant EXP as Expense Form
  participant API as /api/trips/:id/expenses
  participant FX as FX Provider
  participant Cache as In-Memory Cache
  participant DB as Supabase

  EXP->>API: POST {amount, currency}
  API->>Cache: Lookup (from,to)
  alt Cache Hit
    Cache-->>API: rate (cache)
  else Miss
    API->>FX: GET latest/live
    FX-->>API: rate
    API->>Cache: Store rate
  end
  API->>DB: INSERT expense (amount_in_home_currency)
  API-->>EXP: JSON expense + fx meta
```

## 6. Tables (updated)
| Table | Purpose | New Durable Objects columns |
|-------|---------|------------------------------|
| trips | Travel data | (unchanged) |
| expenses | Expenses | (unchanged) |
| budget_categories | Budget categories | (unchanged) |
| **generateditineraries** | Generated plans | **model_used, generation_duration_ms, input_tokens, thought_tokens, error_message** |
| packing_share_links | Sharing links | (unchanged) |

*(Full details in `docs/database-schema.md`)*

## 7. Cloudflare Deployment Architecture
```mermaid
flowchart TB
  subgraph CF[Cloudflare]
    subgraph Pages[Cloudflare Pages]
      APP[Astro App + React]
      API_EP[API Endpoints]
    end
    
    subgraph Worker[Durable Objects Worker]
      DO_LOGIC[ItineraryDurableObject]
      ALARM[Alarm Handler]
    end
    
    subgraph KV[Cloudflare KV]
      SECRETS[GEMINI_API_KEY<br/>SUPABASE_SERVICE_ROLE_KEY]
    end
  end
  
  API_EP --> DO_LOGIC
  DO_LOGIC --> KV
  DO_LOGIC --> ALARM
  
  subgraph External[External]
    GEMINI[Google Gemini AI]
    SUPA[Supabase]
  end
  
  DO_LOGIC --> GEMINI
  DO_LOGIC --> SUPA
```

## 8. Token Usage + Performance Tracking (AI)
* **Durable Objects** track: `model_used`, `generation_duration_ms`, `input_tokens`, `thought_tokens`
* **Timeout handling**: automatic alarm (5 min) + graceful cleanup
* **Model fallback**: gemini-2.5-flash → gemini-2.5-pro → other models
* **Development fallback**: local generation when Durable Objects unavailable

## 9. Error Handling Patterns (updated)
| Layer | Strategy |
|-------|----------|
| API | Early return with HTTP status + JSON { error } |
| Durable Objects | Alarm timeout + database cleanup + graceful column handling |
| FX | Fallback rate=1 + `warning` instead of throw |
| AI | Model fallback; if all fail → status FAILED |
| UI | Toast + preserve last valid state |

## 10. Development vs Production
| Environment | AI Generation | Configuration |
|-------------|---------------|---------------|
| Local (`npm run dev`) | Fallback to local | `.env` file |
| Cloudflare Dev (`npm run dev:cloudflare`) | Real Durable Objects | Build + wrangler dev |
| Production | Durable Objects | Cloudflare Pages + Worker |

## 11. Extensions (Future)
* Timeline / drag reorder itinerary
* Persist history of packing list versions
* Historical FX (date-based) + fx_rate per expense
* PWA offline caching core data
* **Durable Objects scaling**: handle more concurrent generations

---
**Update**: Document reflects new architecture with Cloudflare Durable Objects for long-running AI generation.
