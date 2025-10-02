**TripCrafti – Your Intelligent Travel Companion**  
_Language:_ **English** | [Polski](./README.md)

🌟 **Vision**

TripCrafti reduces travel planning friction end‑to‑end: inspiration → itinerary → budgeting & FX → packing optimization with AI assistance.

✨ **Core Features**

- ✈️ **Trip Hub (CRUD)**: Create, edit and manage trips (destination, dates, budget, currency, lodging meta).
- 💰 **Budget & Expenses**: Track spending vs planned categories, auto FX normalization.
- 🗺️ **AI Itinerary Generator**: Gemini-based structured JSON plan (days → activities) with editable results.
- 🧳 **AI Packing Assistant**: Generates, regenerates (2x diff preview), validates and categorizes packing lists.
- 🔄 **FX Conversion**: Live rate fetch with 6h cache + graceful fallback (rate=1 warning) for resilience.
- 🔗 **Packing Share Links**: View or collaborative mode, optional expiry.
- 🌐 **I18n Built‑in**: Polish / English dictionaries; easy extension.

🛠️ **Tech Stack**

| Area | Technology |
|------|------------|
| Runtime / SSR | Astro 5 (hybrid islands + server endpoints) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & DB | Supabase (PostgreSQL + RLS + Auth) |
| AI | Google Gemini (itinerary + packing) |
| FX | exchangerate.host (public base + optional key) |
| Testing | Vitest + Testing Library |
| Lint / Format | ESLint + custom rule `no-hardcoded-jsx-text`, Prettier |
| UI Lib / Icons | shadcn/ui, Radix, lucide-react |
| Images | Unsplash API (optional) |

🏗️ **Architecture (High Level)**
```
Astro (SSR + React islands)
  ├─ Pages / Layouts
  ├─ API Endpoints (/api/trips, /api/ai/packing, /api/trips/:id/packing/share)
  ├─ lib (fx, i18n, prompts, gemini services)
  └─ components (UI + hooks)

Supabase (PostgreSQL + Auth)
  ├─ trips, expenses, budget_categories, itineraries, packing share links
  └─ Row Level Security

External
  • Google Gemini (structured JSON generation)
  • exchangerate.host (FX rates with in‑memory cache)
  • Unsplash (destination imagery)
```

**Mechanics**
- Itinerary: model fallback list + token usage tracking.
- Packing: generate → up to 2 regenerations (diff) → contextual validation (add/remove/adjust/replace) → categorize → share.
- FX: 6h TTL cache; identity / cache / live / fallback source tagging.
- Budget: normalization into trip currency (`amount_in_home_currency`), post‑trip report.
- I18n: middleware assigns `lang` (pl/en).

🚀 **Roadmap Snapshot**

| Phase | Status | Highlights |
|-------|--------|------------|
| MVP | ✅ | Trips, auth, expenses, categories, summary |
| AI Itinerary | ✅ | Preferences form, Gemini fallback, JSON plan, editing |
| AI Packing | ✅ | Generation, 2x regeneration, validation, categorization, sharing |
| Budget Extended | ✅ | FX conversion, post‑trip report, CSV export |
| Enhancements | 🚧 | Timeline itinerary, fx_rate persist, historical FX, PWA, public itinerary sharing |

⚙️ **Setup**
```
npm install
cp .env.example .env   # or copy on Windows
npm run dev
npm test
npm run build && npm run preview
```
Requires Node 20+ and Supabase project (URL + anon key).

📦 **Environment Variables**
```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
# GEMINI_MODEL=gemini-2.5-flash
# PUBLIC_FX_API_BASE=https://api.exchangerate.host
# EXCHANGERATE_API_KEY=...
# UNSPLASH_ACCESS_KEY=...
# SUPABASE_URL=...      # legacy compat
# SUPABASE_KEY=...       # legacy compat
```
Rules:
- PUBLIC_ prefix = exposed client-side (no secrets).
- FX fallback: rate=1 + warning field.
- Provider override documented in `docs/fx-providers.md`.

🧠 **AI Modules**
- Itinerary contract: array of days → activities (time, activity_name, description, estimated_cost, currency).
- Packing validation suggestions types: `missing`, `remove`, `adjust`, `replace`.
- Regeneration limit: 2 (cost guard) tracked via list meta.

💱 **FX System**
- In-memory map: `from->to` {rate, fetchedAt}.
- Source meta: identity | cache | live | fallback.
- Optional server key `EXCHANGERATE_API_KEY` if provider enforces keys.

📊 **Budget Report Shape**
```
{
  trip_id, currency,
  plannedTotal, totalSpent, totalPrepaid, totalOnTrip,
  deltaTotal,
  categories: [{ category_id, name, planned, spent, delta, utilization }],
  generated_at
}
```

🧪 **Testing**
```
npm test
```
Focus areas: FX cache & fallback, Gemini JSON parsing heuristics, budget utils, UI components.

🌐 **Internationalization**
Add a language: extend `Lang` + add dictionary entry in `src/lib/i18n.ts` mirroring structure.

🔗 **Key Endpoints**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/trips | GET/POST | List / create trips |
| /api/trips/:id/itinerary | POST | Generate itinerary (AI) |
| /api/ai/packing | POST | Generate / validate / categorize packing list |
| /api/trips/:id/expenses | POST | Create expense (FX) |
| /api/trips/:id/budget/report | GET | Post‑trip budget report |
| /api/trips/:id/expenses/export.csv | GET | CSV export |
| /api/trips/:id/packing/share | POST | Create packing share link |

🔐 **Security / Env**
- Never commit `.env`.
- Server-only secrets: no PUBLIC_ prefix.
- AI prompts: deterministic JSON only (no markdown fences).

🤝 **Contributing**
See `CONTRIBUTING.en.md` (or Polish `CONTRIBUTING.md`).

📝 **Commit & Style Quick Ref**
```
feat(packing): add contextual validation suggestions
fix(fx): handle provider HTTP 500 with fallback
```

📌 **Next Ideas**
- Persist `fx_rate` per expense
- Itinerary timeline UI
- Historical date FX lookup
- Packing list version history
- PWA offline (itinerary + packing)

Made with ❤️ for travelers.
