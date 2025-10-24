<div align="center">

# TripCrafti

Intelligent, AI‑augmented travel planning: itineraries, budgeting, events, packing & sharing – all in one resilient Astro + Cloudflare stack.

_Language:_ **English** | [Polski](./README.md)

</div>

---

## Table of Contents
1. [Vision & Overview](#vision--overview)
2. [Core Feature Modules](#core-feature-modules)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Directory Structure](#directory-structure)
6. [Environment Variables](#environment-variables)
7. [Installation & Local Development](#installation--local-development)
8. [Available Scripts](#available-scripts)
9. [Functional Modules (Details)](#functional-modules-details)
10. [Selected API Endpoints](#selected-api-endpoints)
11. [Data Shapes](#data-shapes)
12. [Testing](#testing)
13. [Deployment (Cloudflare)](#deployment-cloudflare)
14. [Commit & Code Style](#commit--code-style)
15. [Roadmap](#roadmap)
16. [Contributing](#contributing)

---

## Vision & Overview
TripCrafti reduces the cognitive load of trip planning. Manual precision (you stay in control) + AI acceleration (smart itinerary & packing suggestions) + financial awareness (budget + FX) + event discovery.

Key design goals:
* Hybrid SSR + islands (Astro) for performance.
* Durable & resumable AI flows (Cloudflare Durable Objects).
* Strict data isolation (Supabase RLS).
* Deterministic AI JSON contracts (Gemini prompts tuned for structure, no markdown fences).

---

## Core Feature Modules
| Module | Summary |
|--------|---------|
| Trips CRUD | Create/manage trips (destination, dates, budget, currency, optional lodging metadata). |
| Budget & Expenses | Category planning, FX normalization, prepaid vs on‑trip classification, CSV export, utilization report. |
| AI Itinerary Assistant | Gemini‑powered day plan JSON (activities, timing, cost, currency) with model fallback chain & token usage logging. |
| AI Packing Assistant | Generation → diffed regenerations (max 2) → validation suggestions (add/remove/adjust/replace) → auto‑categorization → manual edits → share links. |
| Events Discovery | Ticketmaster API integration + local cached classification maps; optional image enrichment. |
| FX System | Cached (6h) multi‑currency quotes with resilient fallback path; identity=1 short‑circuit. |
| Sharing (Packing) | Tokenized share links (can_modify flag, optional expiry). |
| I18n | Lightweight dual dictionary (EN/PL) with middleware language negotiation. |
| Destination Images | Unsplash API (multi‑stage fallback queries, graceful degradation). |
| Geocoding | Google Geocoding API (coordinates for event radius / enrichment) + lightweight OSM helper for lodging heuristics. |

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Runtime / Framework | Astro 5 (SSR + API endpoints) |
| UI / Interactivity | React 19.2.x, TypeScript 5, shadcn/ui, Radix Primitives |
| Styling | Tailwind CSS 4, utility-first + design tokens |
| Auth & Data | Supabase (PostgreSQL + RLS + auth) |
| AI | Google Gemini (itinerary + packing) with model fallback chain |
| Long Tasks | Cloudflare Durable Objects (itinerary generation) |
| Deployment | Cloudflare Pages + Worker (Durable Object) + KV (secrets) |
| External APIs | Ticketmaster, exchangerate.host, Unsplash, Google Geocoding |
| Tooling | Vitest, Testing Library, ESLint (custom rule: no-hardcoded-jsx-text), Prettier |

---

## Architecture
High-level execution flow:
```
Browser (React islands / Astro pages)
   ↓ SSR / API (Astro endpoints)
      ├─ Supabase (auth + data)
      ├─ Durable Object (long-running AI itinerary)
      ├─ Gemini (AI models)
      ├─ Ticketmaster (events)
      ├─ FX Provider (exchangerate.host)
      ├─ Unsplash (destination imagery)
      └─ Google Geocoding (coordinates)
```
Durable Object advantages:
* Avoids standard function timeouts (60–90s generation)
* Holds transient state (progress, fallback attempt)
* Re-entrant resilience if the client retries

See `docs/architecture.md` for deeper diagrams & sequence flows.

---

## Directory Structure
```
src/
  pages/            # Astro pages & API endpoints (/api/**)
  components/       # React + UI primitives (islands)
  lib/              # Services (AI, FX, geocoding, logging, secrets)
  workers/          # Durable Object implementations
  middleware.ts     # Language + Supabase + runtime bindings
  types.ts          # Shared types & DTO contracts
docs/               # Architecture / deployment / schema docs
tests/              # Component + integration tests
```

---

## Environment Variables
Environment resolution strategy (see `src/lib/secrets.ts`):
1. Production: KV → runtimeEnv → import.meta.env → globalThis
2. Development: import.meta.env → runtimeEnv → process.env → globalThis → KV

| Name | Required | Scope | Purpose |
|------|----------|-------|---------|
| PUBLIC_SUPABASE_URL | yes | client | Supabase project URL |
| PUBLIC_SUPABASE_ANON_KEY | yes | client | Public anon key for auth/client queries |
| SUPABASE_SERVICE_ROLE_KEY | prod (server ops) | server (KV) | Elevated service actions (never expose) |
| GEMINI_API_KEY | yes (AI features) | server (KV/.env) | Gemini requests (itinerary, packing) |
| GEMINI_MODEL | no | server | Override model (fallback chain still applies) |
| UNSPLASH_ACCESS_KEY | no | server | Destination images enrichment |
| PUBLIC_FX_API_BASE | no | client/server | Override FX API base (default: https://api.exchangerate.host) |
| EXCHANGERATE_API_KEY | no | server | Optional key if provider now requires it |
| TICKETMASTER_API_KEY | for events | server (KV) | Event discovery integration |
| GOOGLE_GEOCODING_API_KEY | if geocoding | server (KV) | Precise coordinate lookup |
| DEBUG_LOGGING | no | server | Verbose logging when 'true' |
| OPENROUTER_API_KEY | unused | server | Placeholder for future multi-provider routing |
| SUPABASE_URL / SUPABASE_KEY | legacy | server | Backward compatibility fallback |

Production secrets (no `PUBLIC_` prefix) must live in Cloudflare KV. Never commit real values.

---

## Installation & Local Development
```bash
git clone <repository-url>
cd 10x-devs-project
npm install
cp .env.example .env
# Fill required values (at minimum Supabase + GEMINI_API_KEY)
npm run dev
```
Cloudflare Durable Object development (uses real DO instance):
```bash
npm run build
npm run dev:cloudflare
```

Database: apply `db_schema.sql` in Supabase SQL editor; RLS policies are expected to be enforced via provided schema.

---

## Available Scripts
```bash
npm run dev           # Astro dev (SSR + islands) with AI fallback
npm run dev:cloudflare# Pages dev serving built dist with DO
npm run build         # Production build (dist/)
npm run preview       # Preview production build locally
npm run test          # Vitest (run once)
npm run test:watch    # Watch mode
npm run lint          # ESLint
npm run lint:fix      # ESLint with --fix
npm run format        # Prettier format
```

---

## Functional Modules (Details)
### Trips
CRUD: destination, date range, currency, base budget, optional lodging (geocode enrichment attempted).

### Budget & Expenses
* Category planning (planned vs actual)
* Automatic FX normalization to trip currency
* Prepaid vs on‑trip breakdown
* Post‑trip utilization report (`/api/trips/:id/budget/report`)
* CSV export (`/api/trips/:id/expenses/export.csv`)

### FX System
* 6h cache tier (daily quotes)
* Fallback chain → identity (1) preservation
* Sources annotated: identity | cache | live | fallback

### AI Itinerary Assistant
* Inputs: interests, style, lodging hints, party profile, maxDistanceKm, budget tier
* Output: structured JSON (days → activities: time, title, desc, cost, currency)
* Model fallback chain (e.g. gemini-2.5-flash → gemini-2.5-pro)
* Token usage logging (input/output/approx thought)

### AI Packing Assistant
Flow: generate → up to 2 diffed regenerations → contextual validation suggestions → auto categorize → manual edits → share.

### Events Discovery
* Ticketmaster API + local classification JSON (for filtering & offline resilience)
* On-demand refresh endpoint with safety guard (prod only logic)

### Sharing (Packing)
* Signed token link creation with can_modify + optional expiry (hours)

### I18n
* Middleware attaches `lang` (en|pl)
* Dictionaries: `src/lib/i18n.ts`
* Add locale: extend enum + dictionary object

### Destination Images
* Unsplash fallback sequence: exact → broadened → generic travel

---

## Selected API Endpoints
| Endpoint | Method(s) | Description |
|----------|-----------|-------------|
| /api/trips | GET/POST | List / create trips |
| /api/trips/:id/itinerary | POST | Generate itinerary (AI) |
| /api/ai/packing | POST | Generate / validate / categorize packing list |
| /api/trips/:id/expenses | POST | Add expense with FX normalization |
| /api/trips/:id/budget/report | GET | Post‑trip budget utilization |
| /api/trips/:id/expenses/export.csv | GET | CSV export |
| /api/trips/:id/packing/share | POST | Create packing share link |
| /api/events/... | GET | Event discovery & classification |

---

## Data Shapes
### BudgetReport (sample)
```json
{
  "trip_id": "uuid",
  "currency": "USD",
  "plannedTotal": 1200,
  "totalSpent": 980,
  "totalPrepaid": 400,
  "totalOnTrip": 580,
  "deltaTotal": -220,
  "categories": [
    { "category_id": "food", "name": "Food", "planned": 300, "spent": 250, "delta": -50, "utilization": 0.83 }
  ],
  "generated_at": "2025-01-05T12:00:00Z"
}
```

---

## Testing
```bash
npm test        # Single run
npm run test:watch
```
Coverage focuses on: FX logic (cache/fallback), AI JSON parsing (packing), budgeting utilities, and representative UI components.

---

## Deployment (Cloudflare)
1. Deploy Durable Object Worker:
   ```bash
   npx wrangler deploy --config wrangler-worker.toml
   ```
2. Set KV secrets (example):
   ```bash
   wrangler kv:key put --namespace-id <KV_ID> GEMINI_API_KEY <value>
   wrangler kv:key put --namespace-id <KV_ID> SUPABASE_SERVICE_ROLE_KEY <value>
   wrangler kv:key put --namespace-id <KV_ID> TICKETMASTER_API_KEY <value>
   ```
3. Build + deploy Pages:
   ```bash
   npm run build
   npx wrangler pages deploy dist
   ```
4. Verify runtime bindings & language middleware.

Checklist:
* [ ] Schema applied in Supabase
* [ ] RLS active
* [ ] Secrets in KV (no raw service key in .env)
* [ ] Durable Object class deployed
* [ ] AI generation smoke-tested

---

## Commit & Code Style
Conventional Commits:
```
<type>(scope?): imperative summary
```
Types: feat | fix | docs | style | refactor | perf | test | build | ci | chore.

Examples:
```
feat(packing): add regeneration diff preview
fix(fx): handle provider 500 fallback
refactor(itinerary): simplify model chain
docs(readme): unify env table
```

Guidelines:
* Shared types in `src/types.ts`
* Early returns; avoid deep nesting
* React hooks in `src/components/hooks`
* Services in `src/lib/services`
* i18n text isolated from components
* Deterministic AI prompts (JSON only)
* Run `npm run lint` & `npm test` before PR

Branch naming: `feat/...`, `fix/...`, `docs/...`, etc.

PR checklist (abbrev): tests green, lint clean, i18n keys added, no stray logs, docs updated.

---

## Roadmap
| Phase | Items |
|-------|-------|
| Itinerary UX | Timeline visualization, public readonly shares |
| Packing | Versioning history, collaborative edits expansion |
| Budget | Persist fx_rate snapshots, historical rates lookup |
| Offline / PWA | Cache itinerary & packing data, installable shell |
| Social | Public itinerary gallery, notes & attachments |

---

## Contributing
1. Fork repository
2. `git checkout -b feat/your-feature`
3. Implement + add tests
4. `npm run lint && npm test`
5. Commit (`feat(scope): ...`) & push
6. Open PR with context / screenshots if UI

Built with ❤️ for travelers who love shipping clean software.

---

> No license file present yet – add one (MIT suggested) before public release.

