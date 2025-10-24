**TripCrafti – Twój Inteligentny Asystent Podróży**  
_Język:_ **Polski** | [English](./README.en.md)

🌟 **Wizja Projektu**

TripCrafti to inteligentny asystent podróży, którego misją jest zrewolucjonizowanie sposobu, w jaki planujemy i przeżywamy wyjazdy. Naszym celem jest zredukowanie stresu związanego z organizacją do minimum, pozwalając podróżnikom czerpać czystą radość z odkrywania świata.

Aplikacja kompleksowo wspiera użytkownika na każdym etapie: od inspiracji i automatycznego planowania, przez precyzyjne zarządzanie budżetem i rezerwacjami, aż po inteligentne spakowanie walizki z pomocą AI.
✨ **Główne Funkcjonalności**

TripCrafti to nie tylko planer, to zintegrowany ekosystem, który dba o każdy detal Twojej podróży.

    ✈️ Centralne Zarządzanie Podróżą (CRUD): Stanowi serce aplikacji. Twórz, przeglądaj, edytuj i usuwaj swoje wyjazdy. Zarządzaj rezerwacjami, kluczowymi dokumentami i notatkami w jednym miejscu.

    💰 Precyzyjne Śledzenie Budżetu: Ustaw ogólny budżet dla podróży i na bieżąco dodawaj wydatki. TripCrafti automatycznie podsumuje koszty i pokaże, jak Twoje wydatki mają się do założonego planu.

    🗺️ Inteligentny Kreator Planu Podróży (AI): Opisz swoje zainteresowania, styl podróży i budżet, a Google Gemini stworzy dla Ciebie spersonalizowany, edytowalny plan zwiedzania na każdy dzień.

    🎭 Wyszukiwarka Wydarzeń (Event Discovery): Automatycznie znajdź lokalne wydarzenia i atrakcje podczas swojej podróży dzięki integracji z Ticketmaster API. Filtruj wyniki według kategorii (muzyka, sport, teatr) z lokalną bazą klasyfikacji dla lepszej wydajności.

    🧳 Asystent Pakowania (AI): Na podstawie celu, długości wyjazdu i zaplanowanych aktywności, AI wygeneruje idealną listę rzeczy do spakowania, abyś nigdy więcej o niczym nie zapomniał(a).

    🔒 Bezpieczne Uwierzytelnianie: Pełne bezpieczeństwo i izolacja danych dzięki systemowi rejestracji i logowania. Każda podróż i jej dane należą tylko do Ciebie.

    📱 Pełna Responsywność: Korzystaj z aplikacji wygodnie na komputerze, tablecie i smartfonie.

🛠️ **Stos Technologiczny**

Projekt jest aplikacją typu Single Repo opartą o:

| Obszar | Technologia |
|--------|-------------|
| Runtime / SSR | Astro 5 (hybrydowy rendering + server endpoints) |
| UI / Interaktywność | React 18 (przygotowane pod 19) + TypeScript |
| Stylowanie | Tailwind CSS 4 |
| Baza / Auth | Supabase (PostgreSQL + row level security + auth) |
| AI | Google Gemini (itinerary + packing: generowanie, walidacja, kategoryzacja) |
| Deployment | Cloudflare Pages + Durable Objects (długotrwałe AI generowanie) |
| Wydarzenia | Ticketmaster Discovery API (z lokalną bazą klasyfikacji) |
| Waluty (FX) | exchangerate.host (public API z opcjonalnym kluczem) |
| Testy | Vitest + @testing-library/react |
| Lint / Format | ESLint (niestandardowe reguły + `no-hardcoded-jsx-text`), Prettier |
| Ikony / UI | shadcn/ui + Radix Primitives + lucide-react |
| I18n | Lekki słownik PL/EN (`src/lib/i18n.ts`) |
| Obrazy destynacji | Unsplash API (opcjonalny klucz) |

**Cloudflare Durable Objects** używane dla długotrwałego generowania itinerariów (60-90s) bez timeoutów.

Brak osobnego backendu typu NestJS – logika biznesowa zaimplementowana w Astro server endpoints (`/src/pages/api/**`).
🏗️ **Architektura**

Monorepo aplikacyjne (Astro) + Supabase jako BaaS:

```
[*] Astro (SSR + React wyspy)
    ├─ Pages & Layouts (routing / SSR)
    ├─ API Endpoints (server only logic)
    │    /api/trips/...         (CRUD + itinerary AI)
    │    /api/events/...        (wyszukiwanie wydarzeń + klasyfikacje)
    │    /api/ai/packing        (generowanie / walidacja / kategoryzacja listy)
    │    /api/trips/:id/packing/share (linki współdzielenia)
    ├─ lib/ (FX, i18n, AI prompty, usługi Gemini)
    └─ components/ (UI + hooki)

Supabase (PostgreSQL + Auth)
    ├─ Tabele: trips, expenses, budget_categories, generateditineraries
    └─ Row Level Security (izolacja użytkowników)

Cloudflare (Deployment)
    ├─ Pages (główna aplikacja Astro + React)
    ├─ Durable Objects Worker (długotrwałe AI generowanie)
    └─ KV Storage (sekrety: GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY)

Zewnętrzne:
    • Google Gemini (itinerary JSON + packing list / suggestions / categorization)
    • Ticketmaster Discovery API (wydarzenia lokalne, klasyfikacje w lokalnym pliku JSON)
    • exchangerate.host (kursy walut z cache 6h, fallback = rate 1)
    • Unsplash (opcjonalnie obrazy destynacji)
```

☁️ **Architektura Cloudflare**

TripCrafti wykorzystuje hybrydowy model deploymentu:

```
Cloudflare Pages (główna aplikacja)
├─ Astro SSR + React komponenty
├─ API endpoints (/api/*)
├─ Fallback dla AI gdy Durable Objects niedostępne
└─ Automatyczne cachowanie statycznych zasobów

Cloudflare Durable Objects Worker (AI generowanie)
├─ Długotrwałe AI generowanie (bez timeoutów)
├─ Stan persystentny per itinerary
├─ Automatyczne timeout handling (5 min)
└─ Fallback model chain (gemini-2.5-flash → gemini-2.5-pro)

Cloudflare KV (sekrety)
├─ GEMINI_API_KEY
├─ SUPABASE_SERVICE_ROLE_KEY
└─ Inne klucze API
```

**Tryby pracy:**
- **Lokalny development**: `npm run dev` (z automatycznym fallbackiem)
- **Cloudflare dev**: `npm run dev:cloudflare` (z prawdziwymi Durable Objects)
- **Produkcja**: Pages + Durable Objects Worker

Szczegóły w `docs/architecture.md`.

Mechanizmy:
* AI Itinerary: fallback lista modeli, pierwsze dostępne; token usage zapisywany (input, output, thought approx).
* AI Packing: generacja bazowa → do 2 regeneracji (podgląd różnic) → walidacja kontekstowa (sugestie: add/remove/adjust/replace) → kategoryzacja → udostępnianie listy.
* FX: pamięciowy cache (TTL 6h, źródło: identity | cache | live | fallback).
* Budżet: normalizacja wydatków do waluty podróży, raport post-trip.
* I18n: middleware ustawia `lang` (PL/EN).

🚀 **Roadmap (aktualny status)**

Etap 1: MVP
    [x] Auth (Supabase)
    [x] CRUD Trips
    [x] Wydatki + kategorie budżetu
    [x] Podsumowanie budżetu

Etap 2: AI Itinerary
    [x] Formularz preferencji
    [x] Prompt + fallback modeli Gemini
    [x] Generowanie planu (JSON) + token usage
    [ ] Zaawansowana wizualizacja timeline
    [x] Ręczna edycja / integracja

Etap 3: AI Packing
    [x] Generacja listy
    [x] Limit 2 regeneracji (preview diff)
    [x] Walidacja kontekstowa (sugestie)
    [x] Kategoryzacja automatyczna
    [x] Szybkie dodawanie z biblioteki
    [x] Udostępnienie przez link (view/collab)
    [ ] Wersjonowanie list (future)

Etap 4: Budżet rozszerzony
    [x] FX konwersje (cache 6h)
    [x] Post-trip raport
    [x] Eksport CSV
    [ ] Historyczne kursy
    [ ] Persist fx_rate

Etap 5: Społecznościowe / UX
    [ ] Publiczne itineraries
    [ ] Notatki / załączniki
    [ ] Powiadomienia
    [ ] Tryb offline / PWA

⚙️ **Instalacja i Uruchomienie**

Wymagania:
* Node 20+
* Konto Supabase (URL + anon key)
* Konto Cloudflare (dla Durable Objects w produkcji)
* (Opcjonalnie) Klucze: GEMINI_API_KEY, UNSPLASH_ACCESS_KEY, EXCHANGERATE_API_KEY

Kroki:
1. Sklonuj repo: `git clone <repo_url>`
2. Wejdź do katalogu projektu: `cd 10x-devs-project`
3. Zainstaluj zależności: `npm install`
4. Skopiuj `.env.example` → `.env` i uzupełnij wymagane pola
5. Uruchom dev serwer: `npm run dev` (z automatycznym fallbackiem dla AI)
6. Testy: `npm test`
7. Build produkcyjny: `npm run build` + `npm run preview`

**Deployment w produkcji (Cloudflare Pages + Durable Objects):**
```bash
# 1. Deploy Durable Objects Worker
npx wrangler deploy --config wrangler-worker.toml

# 2. Deploy Pages application
npm run build
npx wrangler pages deploy dist
```

Szczegółowe instrukcje w `docs/deployment.md`.

Brak osobnych kroków frontend/backend – wszystko w jednym pakiecie Astro.

🤝 **Współtworzenie**

Jesteś pasjonatem podróży i kodowania? Chcesz pomóc w rozwoju TripCrafti? Twoja pomoc jest mile widziana!

    Sforkuj repozytorium.

    Utwórz nową gałąź (git checkout -b feature/twoja-funkcja).

    Wprowadź swoje zmiany.

    Zacommituj zmiany (git commit -m 'feat: Dodaj nową, wspaniałą funkcję').

    Wypchnij zmiany do swojej gałęzi (git push origin feature/twoja-funkcja).

    Otwórz Pull Request, opisując wprowadzone zmiany.

Stworzone z ❤️ dla wszystkich podróżników.
## **Środowisko (Environment Variables)**

Zmiennie w `.env`. Prefiks `PUBLIC_` = dostępne w kliencie (nie dla sekretów!).

Obowiązkowe:
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

**Produkcja - Cloudflare KV (sekrety):**
```
GEMINI_API_KEY=...           # Przechowywane w Cloudflare KV
SUPABASE_SERVICE_ROLE_KEY=... # Przechowywane w Cloudflare KV
```

AI (itinerary + packing):
```
GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-2.5-flash
```

Waluty (FX):
```
# PUBLIC_FX_API_BASE=https://api.exchangerate.host
# EXCHANGERATE_API_KEY=opcjonalny_klucz
```

Unsplash (opcjonalne):
```
# UNSPLASH_ACCESS_KEY=...
```

Legacy (opcjonalne):
```
# SUPABASE_URL=...
# SUPABASE_KEY=...
```

**Uwagi:**
* W produkcji sekrety (bez PUBLIC_) przechowywane w Cloudflare KV
* Local development używa .env file z automatycznym fallbackiem
* Instrukcje konfiguracji KV w `docs/deployment.md`

## **Moduły Funkcjonalne**

### **Trips**
CRUD podróży (tytuł, destination, daty, budżet, waluta, lodging meta).

### **Budget & Expenses**
* Kategorie (planned_amount)
* Wydatki z konwersją do waluty podróży (`amount_in_home_currency`)
* Prepaid vs on-trip
* Raport `/api/trips/:id/budget/report` (planned vs actual + prepaid)
* Eksport CSV `/api/trips/:id/expenses/export.csv`
* Tryby widoku: simple / full

### **FX System**
* Cache 6h (para walut)
* Źródło: identity | cache | live | fallback
* Fallback zapewnia odporność przy błędach sieci

### **AI Itinerary Assistant**
* Wejście: interests, travelStyle, budget level, lodging, maxDistanceKm, travel party
* Wyjście: JSON dni → aktywności (czas, nazwa, opis, koszt, waluta)
* Fallback modeli (override `GEMINI_MODEL`)
* Token usage (input/output/thought approx) zapisywany

### **AI Packing Assistant**
Flow: generacja → (max 2) regeneracje z podglądem → walidacja (add/remove/adjust/replace) → kategoryzacja → edycje ręczne → sharing
* Biblioteka szybkich itemów
* Drag & drop / zmiana kategorii / ilości
* Ochrona kosztów: limit regeneracji

### **Sharing (Packing)**
Link z tokenem, `can_modify`, opcjonalny expiry (godziny). Możliwość kopiowania do schowka.

### **I18n**
Middleware ustala `lang`; słowniki w `src/lib/i18n.ts`. Dodanie języka = rozszerzenie enum + obiekt w `dictionaries`.

### **Unsplash**
Opcjonalny klucz dla obrazów destynacji kart podróży.

### **Testy**
```
npm test
```
Zakres: FX (cache/fallback), parsing JSON Gemini packingu, budżet utils, komponenty UI.

### **Endpointy (wybór)**
| Endpoint | Metoda | Opis |
|----------|--------|------|
| /api/trips | GET/POST | Lista / tworzenie podróży |
| /api/trips/:id/itinerary | POST | Generacja itinerarium (AI) |
| /api/ai/packing | POST | Generacja / walidacja / kategoryzacja listy |
| /api/trips/:id/expenses | POST | Dodanie wydatku (FX) |
| /api/trips/:id/budget/report | GET | Raport post-trip |
| /api/trips/:id/expenses/export.csv | GET | Eksport CSV |
| /api/trips/:id/packing/share | POST | Utworzenie linku do listy |

### **Struktura BudgetReport**
```
{
    trip_id: string,
    currency: string | null,
    plannedTotal: number,
    totalSpent: number,
    totalPrepaid: number,
    totalOnTrip: number,
    deltaTotal: number,
    categories: [{ category_id, name, planned, spent, delta, utilization }],
    generated_at: string
}
```

### **Zasady Env / Bezpieczeństwo**
* Sekrety bez prefiksu PUBLIC_
* Klucze AI i FX przechowuj lokalnie lub w CI (sekrety)
* Prompty Gemini zwracają czysty JSON – brak Markdown fence

### **Następne Kroki (propozycje)**

---
## **Konwencje Commitów & Styl Kodowania**

### Konwencje Commitów (Conventional Commits)
Format:
```
<type>(scope?): opis w trybie rozkazującym
```
**Typy**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

**Przykłady**:
```
feat(packing): limit 2 regeneracje listy AI
fix(fx): popraw fallback przy HTTP 500
refactor(itinerary): uproszczony parser JSON
docs(readme): dodano sekcję env
```

### Styl Kodowania
* **TypeScript** – nowe typy współdzielone w `src/types.ts`.
* **Early returns** – ogranicz zagnieżdżenia.
* **Hooki** dla logiki UI (`src/components/hooks`).
* **Serwisy** w `src/lib/services` dla integracji (Gemini, FX, itd.).
* **i18n** – tekst user‑facing w słownikach (`src/lib/i18n.ts`).
* **Tailwind** – korzystaj z utility-first; unikaj nadmiarowych klas custom.
* **Prompty AI** – bez markdown fence, deterministyczne JSON contracty.
* **ESLint** – uruchom `npm run lint` przed PR.

### Branch Naming
`feat/`, `fix/`, `docs/`, `refactor/`, `chore/`, np. `feat/fx-historical-rates`.

### PR Checklist (skrót)
- [ ] Testy zielone (`npm test`)
- [ ] Lint bez błędów
- [ ] Zmiany w docs / README jeśli wymagane
- [ ] i18n: klucze dla PL i EN
- [ ] Brak przypadkowych `console.log`

---
* Persist `fx_rate` w DB
* Timeline wizualizacja itinerarium
* Public share itineraries (read-only)
* Historia wersji listy pakowania
* PWA / offline (cache itinerary + packing)
