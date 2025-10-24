# Architektura TripCrafti

Dokument opisuje wysokopoziomową architekturę systemu oraz główne przepływy.

## 1. Widok Systemu
```mermaid
flowchart LR
  subgraph Client[Przeglądarka]
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

## 2. Warstwy Logiczne
```mermaid
graph TD
  A[UI / Components] --> B[Hooks (state, side-effects)]
  B --> C[Services (lib/services)]
  C --> D[Integracje: Durable Objects / Gemini / FX / Supabase]
  D --> E[Storage: Supabase Tables + Cloudflare KV]
```
* **Components** – prezentacja, minimalna logika.
* **Hooks** – kompozycja stanu, fetch, transformacje.
* **Services** – czysta logika domenowa / adaptery API zewnętrznych.
* **Integracje** – translacja formatów i protokołów.
* **Storage** – persystencja (PostgreSQL, row-level security, Cloudflare KV dla sekretów).

## 3. Przepływ: Generacja Itinerary (Durable Objects)
```mermaid
sequenceDiagram
  participant U as User
  participant UI as UI (Dashboard)
  participant API as /api/trips/:id/itinerary
  participant DO as Durable Object
  participant G as Gemini
  participant DB as Supabase

  U->>UI: Wysyła preferencje
  UI->>API: POST JSON (preferences)
  API->>DB: INSERT (status: GENERATING)
  API->>DO: Utwórz stub + wywołaj /generate
  DO->>DO: Ustaw alarm (5 min timeout)
  DO->>G: Prompt (structured contract)
  G-->>DO: JSON (itinerary days)
  DO->>DB: UPDATE (status: COMPLETED, plan_json)
  DO->>DO: Usuń alarm
  API-->>UI: 202 Accepted (generation started)
  UI->>UI: Poll status endpoint
  UI-->>U: Wyświetla plan dzienny
```

## 4. Przepływ: AI Packing (bez zmian)
```mermaid
sequenceDiagram
  participant U as User
  participant UI as Packing Assistant
  participant API as /api/ai/packing
  participant G as Gemini

  U->>UI: Klik "Regenerate"
  UI->>API: POST { mode: regenerate, context }
  API->>G: Prompt (diff aware)
  G-->>API: Nowa lista JSON
  API-->>UI: podgląd różnic (delta items)
  U->>UI: Accept / Partial add
  UI->>UI: Merge w lokalny state
```

## 5. FX Conversion Lifecycle (bez zmian)
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

## 6. Tabele (zaktualizowane)
| Tabela | Cel | Nowe kolumny Durable Objects |
|--------|-----|------------------------------|
| trips | Dane podróży | (bez zmian) |
| expenses | Wydatki | (bez zmian) |
| budget_categories | Kategorie budżetu | (bez zmian) |
| **generateditineraries** | Wygenerowane plany | **model_used, generation_duration_ms, input_tokens, thought_tokens, error_message** |
| packing_share_links | Linki współdzielenia | (bez zmian) |

*(Pełne szczegóły w `docs/database-schema.md`)*

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
  
  subgraph External[Zewnętrzne]
    GEMINI[Google Gemini AI]
    SUPA[Supabase]
  end
  
  DO_LOGIC --> GEMINI
  DO_LOGIC --> SUPA
```

## 8. Token Usage + Performance Tracking (AI)
* **Durable Objects** śledzą: `model_used`, `generation_duration_ms`, `input_tokens`, `thought_tokens`
* **Timeout handling**: automatyczny alarm (5 min) + graceful cleanup
* **Model fallback**: gemini-2.5-flash → gemini-2.5-pro → inne modele
* **Development fallback**: lokalne generowanie gdy Durable Objects niedostępne

## 9. Error Handling Wzorce (zaktualizowane)
| Warstwa | Strategia |
|---------|-----------|
| API | Early return z HTTP status + JSON { error } |
| Durable Objects | Alarm timeout + database cleanup + graceful column handling |
| FX | Fallback rate=1 + `warning` zamiast throw |
| AI | Fallback modeli; jeśli wszystkie zawiodą → status FAILED |
| UI | Toast + zachowanie ostatniego poprawnego stanu |

## 10. Development vs Production
| Środowisko | AI Generowanie | Konfiguracja |
|------------|----------------|--------------|
| Local (`npm run dev`) | Fallback do lokalnego | `.env` file |
| Cloudflare Dev (`npm run dev:cloudflare`) | Prawdziwe Durable Objects | Build + wrangler dev |
| Production | Durable Objects | Cloudflare Pages + Worker |

## 11. Rozszerzenia (Future)
* Timeline / drag reorder itinerary
* Persist history of packing list versions
* Historical FX (date-based) + fx_rate per expense
* PWA offline caching core danych
* **Durable Objects scaling**: obsługa większej liczby równoczesnych generowań

---
**Aktualizacja**: Dokument odzwierciedla nową architekturę z Cloudflare Durable Objects dla długotrwałego AI generowania.
