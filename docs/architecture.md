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
  API --> Supabase[(Supabase\nAuth + Postgres)]
  API --> Gemini[(Google Gemini AI)]
  API --> FX[(exchangerate.host)]
  UI --> Assets[(Static Assets / Images)]
  Assets --> CDN[(CDN / Edge)]
```

## 2. Warstwy Logiczne
```mermaid
graph TD
  A[UI / Components] --> B[Hooks (state, side-effects)]
  B --> C[Services (lib/services)]
  C --> D[Integracje: Gemini / FX / Supabase]
  D --> E[Storage: Supabase Tables]
```
* **Components** – prezentacja, minimalna logika.
* **Hooks** – kompozycja stanu, fetch, transformacje.
* **Services** – czysta logika domenowa / adaptery API zewnętrznych.
* **Integracje** – translacja formatów i protokołów.
* **Storage** – persystencja (PostgreSQL, row-level security).

## 3. Przepływ: Generacja Itinerary
```mermaid
sequenceDiagram
  participant U as User
  participant UI as UI (Dashboard)
  participant API as /api/trips/:id/itinerary
  participant G as Gemini
  participant DB as Supabase

  U->>UI: Wysyła preferencje
  UI->>API: POST JSON (preferences)
  API->>DB: SELECT trip
  API->>G: Prompt (structured contract)
  G-->>API: JSON (itinerary days)
  API->>DB: INSERT generated plan
  API-->>UI: 201 + itinerary
  UI-->>U: Wyświetla plan dzienny
```

## 4. Przepływ: AI Packing (Regeneracja)
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

## 5. FX Conversion Lifecycle
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

## 6. Tabele (przykładowe)
| Tabela | Cel | Kluczowe kolumny |
|--------|-----|------------------|
| trips | Dane podróży | id, user_id, title, destination, start_date, end_date, budget, currency |
| expenses | Wydatki | id, trip_id, amount, currency, amount_in_home_currency, fx_rate, is_prepaid |
| budget_categories | Kategorie budżetu | id, trip_id, name, planned_amount, icon_name |
| itineraries | Wygenerowane plany | id, trip_id, preferences_json, generated_plan_json, status, token usage |
| packing_share_links | Linki współdzielenia | id, trip_id, token, can_modify, expires_at |

*(Dodatkowe kolumny w kodzie – patrz `src/types.ts`)*

## 7. Token Usage (AI)
* Itinerary oraz packing śledzą: `input_tokens`, `output_tokens`; thought tokens estymowane (jeśli brak). 
* Limity kosztów: regeneracja packingu (2x) → UX + kontrola budżetu AI.

## 8. Error Handling Wzorce
| Warstwa | Strategia |
|---------|-----------|
| API | Early return z HTTP status + JSON { error } |
| FX | Fallback rate=1 + `warning` zamiast throw |
| AI | Fallback modeli; jeśli wszystkie zawiodą → status FAILED |
| UI | Toast + zachowanie ostatniego poprawnego stanu |

## 9. Rozszerzenia (Future)
* Timeline / drag reorder itinerary
* Persist history of packing list versions
* Historical FX (date-based) + fx_rate per expense
* PWA offline caching core danych

---
**Aktualizacja**: Dokument utrzymuj spójny z README oraz komentarzami w `src/lib`.
