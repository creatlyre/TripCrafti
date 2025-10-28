<div align="center">

# TripCrafti – Inteligentne Planowanie Podróży

AI + manualna kontrola: itinerarium, budżet, wydarzenia, pakowanie i współdzielenie – w jednym wydajnym środowisku Astro + Cloudflare.

_Język:_ **Polski** | [English](./README.en.md)

</div>

---

## Spis Treści
1. [Wizja i Przegląd](#wizja-i-przegląd)
2. [Moduły Kluczowe](#moduły-kluczowe)
3. [Stos Technologiczny](#stos-technologiczny)
4. [Architektura](#architektura)
5. [Struktura Katalogów](#struktura-katalogów)
6. [Zmienne Środowiskowe](#zmienne-środowiskowe)
7. [Instalacja i Development](#instalacja-i-development)
8. [Skrypty](#skrypty)
9. [Moduły Funkcjonalne (Szczegóły)](#moduły-funkcjonalne-szczegóły)
10. [Wybrane Endpointy API](#wybrane-endpointy-api)
11. [Struktury Danych](#struktury-danych)
12. [Testy](#testy)
13. [Deployment (Cloudflare)](#deployment-cloudflare)
14. [Commity i Styl](#commity-i-styl)
15. [Roadmap](#roadmap)
16. [Współtworzenie](#współtworzenie)

---

## Wizja i Przegląd
TripCrafti obniża obciążenie organizacyjne podróży. Równoważymy precyzyjne ręczne zarządzanie z akceleracją AI (itinerarium + pakowanie), świadomością kosztów (budżet + FX) oraz odkrywaniem wydarzeń.

Założenia projektowe:
* Hybrydowy SSR + wyspy (Astro) dla wydajności.
* Długotrwałe procesy AI w Durable Objects.
* Izolacja danych dzięki Supabase RLS.
* Deterministyczne kontrakty JSON dla AI (bez markdown fence).

---

## Moduły Kluczowe
| Moduł | Opis |
|-------|------|
| Trips CRUD | Tworzenie / edycja podróży (destynacja, daty, budżet, waluta, lodging). |
| Budget & Expenses | Plan kategorii, normalizacja FX, prepaid vs on‑trip, eksport CSV, raport wykorzystania. |
| AI Itinerary Assistant | Gemini generuje JSON (dni → aktywności) z fallbackiem modeli + log tokenów. |
| AI Packing Assistant | Generacja → regeneracje z diff (max 2) → walidacja (add/remove/adjust/replace) → kategoryzacja → edycje → sharing. |
| Events Discovery | Ticketmaster + lokalne klasyfikacje (cache) + opcjonalne obrazy. |
| FX System | Cache 6h, fallback chain, oznaczenie źródła (identity | cache | live | fallback). |
| Sharing (Packing) | Linki z tokenem + can_modify + opcjonalny expiry. |
| I18n | Middleware wybiera `lang` (pl/en), słowniki w `src/lib/i18n.ts`. |
| Destination Images | Unsplash (wielostopniowe fallbacki). |
| Geocoding | Google Geocoding API + prosty OSM helper. |

---

## Stos Technologiczny
| Warstwa | Technologia |
|--------|-------------|
| Runtime / Framework | Astro 5 (SSR + API) |
| UI | React 19.2.x + TypeScript 5 + shadcn/ui + Radix |
| Stylowanie | Tailwind CSS 4 |
| Auth & DB | Supabase (PostgreSQL + RLS) |
| AI | Google Gemini (itinerary + packing) z fallback chain |
| Long Tasks | Cloudflare Durable Objects |
| Deployment | Cloudflare Pages + Worker + KV |
| Zewnętrzne API | Ticketmaster, exchangerate.host, Unsplash, Google Geocoding |
| Narzędzia | Vitest, Testing Library, ESLint (custom), Prettier |

---

## Architektura
Przepływ wykonania:
```
Przeglądarka (React wyspy / Astro pages)
   ↓ SSR / API (Astro endpoints)
      ├─ Supabase (auth + dane)
      ├─ Durable Object (długie generowanie AI)
      ├─ Gemini (modele AI)
      ├─ Ticketmaster (wydarzenia)
      ├─ FX Provider (exchangerate.host)
      ├─ Unsplash (obrazy)
      └─ Google Geocoding (koordynaty)
```
Korzyści Durable Objects:
* Brak timeoutów przy 60–90s generacji
* Stan przejściowy (postęp, fallback)
* Odporność na retry klienta

Szczegóły: `docs/architecture.md`.

---

## Struktura Katalogów
```
src/
  pages/            # Strony Astro + endpointy API
  components/       # React + UI wyspy
  lib/              # Serwisy (AI, FX, geocoding, logging, secrets)
  workers/          # Durable Objects
  middleware.ts     # Język + Supabase + runtime bindings
  types.ts          # Wspólne typy / DTO
docs/               # Architektura / deployment / schema
tests/              # Testy komponentów i integracyjne
```

---

## Zmienne Środowiskowe
Strategia rozwiązywania (patrz `src/lib/secrets.ts`):
1. Produkcja: KV → runtimeEnv → import.meta.env → globalThis
2. Development: import.meta.env → runtimeEnv → process.env → globalThis → KV

| Nazwa | Wymagana | Zakres | Cel |
|-------|----------|--------|-----|
| PUBLIC_SUPABASE_URL | tak | client | URL projektu Supabase |
| PUBLIC_SUPABASE_ANON_KEY | tak | client | Publiczny anon key |
| SUPABASE_SERVICE_ROLE_KEY | prod ops | server (KV) | Operacje serwisowe (nie ujawniać) |
| GEMINI_API_KEY | tak (AI) | server | Itinerary + packing |
| GEMINI_MODEL | nie | server | Nadpisanie modelu |
| UNSPLASH_ACCESS_KEY | nie | server | Obrazy destynacji |
| PUBLIC_FX_API_BASE | nie | client/server | Bazowy URL FX (domyślnie exchangerate.host) |
| EXCHANGERATE_API_KEY | nie | server | Opcjonalny klucz dostawcy |
| TICKETMASTER_API_KEY | wydarzenia | server | Integracja Ticketmaster |
| GOOGLE_GEOCODING_API_KEY | jeśli geocoding | server | Dokładne współrzędne |
| DEBUG_LOGGING | nie | server | Rozszerzone logi ('true') |
| OPENROUTER_API_KEY | nieużywane | server | Przyszły multi-provider |
| SUPABASE_URL / SUPABASE_KEY | legacy | server | Kompatybilność wsteczna |

Sekrety bez `PUBLIC_` przechowuj w KV. Nie commituj realnych wartości.

---

## Instalacja i Development
```bash
git clone <repo_url>
cd 10x-devs-project
npm install
cp .env.example .env
# Uzupełnij wymagane wartości (min. Supabase + GEMINI_API_KEY)
npm run dev
```
Tryb Cloudflare z prawdziwym Durable Object:
```bash
npm run build
npm run dev:cloudflare
```
Baza: zastosuj `db_schema.sql` w Supabase; RLS według schematu.

---

## Skrypty
```bash
npm run dev           # Dev (SSR + fallback AI)
npm run dev:cloudflare# Dev z DO (wymaga build)
npm run build         # Build produkcyjny
npm run preview       # Podgląd buildu
npm run test          # Testy (pojedynczy przebieg)
npm run test:watch    # Tryb watch
npm run lint          # ESLint
npm run lint:fix      # ESLint --fix
npm run format        # Prettier
```

---

## Moduły Funkcjonalne (Szczegóły)
### Trips
CRUD: destynacja, zakres dat, waluta, budżet bazowy, lodging (próba geocodingu).

### Budget & Expenses
* Plan kategorii (planned vs actual)
* Normalizacja FX do waluty podróży
* Prepaid vs on‑trip
* Raport (`/api/trips/:id/budget/report`)
* Eksport CSV (`/api/trips/:id/expenses/export.csv`)
* Rozszerzone szablony kategorii budżetu z responsywnym selektorem (wyszukiwalny grid + przeliczenie % na kwoty)

### FX System
* Cache 6h
* Fallback chain → identity
* Źródło: identity | cache | live | fallback

### AI Itinerary Assistant
* Wejścia: interests, style, lodging, party profile, maxDistanceKm, budget tier
* Wyjście: JSON (dni → aktywności: czas, tytuł, opis, koszt, waluta)
* Fallback modeli
* Log tokenów (input/output/approx thought)

### AI Packing Assistant
Przepływ: generacja → max 2 regeneracje z diff → walidacja → kategoryzacja → edycje → udostępnienie.

### Events Discovery
* Ticketmaster + lokalne klasyfikacje JSON
* Refresh endpoint z guardami produkcyjnymi

### Sharing (Packing)
* Link z tokenem + can_modify + opcjonalny expiry (h)

### I18n
* Middleware ustala `lang` (pl|en)
* Słowniki: `src/lib/i18n.ts`

### Destination Images
* Unsplash: exact → broadened → travel fallback

---

## Wybrane Endpointy API
| Endpoint | Metoda(y) | Opis |
|----------|-----------|------|
| /api/trips | GET/POST | Lista / tworzenie |
| /api/trips/:id/itinerary | POST | Generacja itinerarium (AI) |
| /api/ai/packing | POST | Generacja / walidacja / kategoryzacja packingu |
| /api/trips/:id/expenses | POST | Dodanie wydatku (FX) |
| /api/trips/:id/budget/report | GET | Raport budżetu |
| /api/trips/:id/expenses/export.csv | GET | Eksport CSV |
| /api/trips/:id/packing/share | POST | Link współdzielenia |
| /api/events/... | GET | Wydarzenia + klasyfikacje |

---

## Struktury Danych
### BudgetReport (przykład)
```json
{
  "trip_id": "uuid",
  "currency": "PLN",
  "plannedTotal": 5000,
  "totalSpent": 4200,
  "totalPrepaid": 1800,
  "totalOnTrip": 2400,
  "deltaTotal": -800,
  "categories": [
    { "category_id": "food", "name": "Jedzenie", "planned": 1200, "spent": 950, "delta": -250, "utilization": 0.79 }
  ],
  "generated_at": "2025-01-05T12:00:00Z"
}
```

---

## Testy
```bash
npm test
npm run test:watch
```
Obszary: FX (cache/fallback), parsowanie JSON (packing), utils budżetu, kluczowe komponenty UI.

---

## Deployment (Cloudflare)
1. Deploy Durable Object Worker:
   ```bash
   npx wrangler deploy --config wrangler-worker.toml
   ```
2. Ustaw sekrety KV:
   ```bash
   wrangler kv:key put --namespace-id <KV_ID> GEMINI_API_KEY <wartość>
   wrangler kv:key put --namespace-id <KV_ID> SUPABASE_SERVICE_ROLE_KEY <wartość>
   wrangler kv:key put --namespace-id <KV_ID> TICKETMASTER_API_KEY <wartość>
   ```
3. Build + deploy Pages:
   ```bash
   npm run build
   npx wrangler pages deploy dist
   ```
4. Weryfikacja: bindingi runtime + middleware języka.

Checklist:
* [ ] Schema w Supabase
* [ ] RLS aktywne
* [ ] Sekrety w KV
* [ ] Durable Object wdrożone
* [ ] Smoke test AI

---

## Commity i Styl
Konwencja Conventional Commits:
```
<type>(scope?): rozkazujące streszczenie
```
Typy: feat | fix | docs | style | refactor | perf | test | build | ci | chore.

Przykłady:
```
feat(packing): dodano diff regeneracji
fix(fx): fallback przy 500 dostawcy
refactor(itinerary): uproszczenie chain modeli
docs(readme): unifikacja tabeli env
```

Zasady:
* Wspólne typy w `src/types.ts`
* Early returns zamiast głębokiego zagnieżdżania
* Hooki w `src/components/hooks`
* Serwisy w `src/lib/services`
* Teksty i18n poza komponentami
* Prompty AI deterministyczne (czysty JSON)
* Przed PR: `npm run lint` i `npm test`

Nazewnictwo branchy: `feat/...`, `fix/...`, `docs/...` itd.

PR checklist (skrót): testy zielone, lint czysty, klucze i18n dodane, brak zbędnych logów, README zaktualizowane.

---

## Ukończone Funkcjonalności (Kluczowe Osiągnięcia)

| Moduł | Opis | Status |
|-------|------|--------|
| **Zarządzanie Podróżami** | Pełny CRUD na podróżach, włączając podstawowe dane jak cel, daty i budżet. | ✅ Zrobione |
| **Budżet i Wydatki** | Śledzenie wydatków z automatyczną normalizacją walut (FX), kategoryzacją i raportowaniem. | ✅ Zrobione |
| **Asystent Itinerarium (AI)** | Generowanie szczegółowych planów podróży (dzień po dniu) przy użyciu modeli AI (Gemini) w procesach tła (Durable Objects). | ✅ Zrobione |
| **Asystent Pakowania (AI)** | Inteligentne generowanie list do pakowania na podstawie danych podróży, z opcją regeneracji i kategoryzacji. | ✅ Zrobione |
| **Odkrywanie Wydarzeń** | Integracja z Ticketmaster w celu wyszukiwania i wyświetlania lokalnych wydarzeń. | ✅ Zrobione |
| **System Walutowy (FX)** | Dynamiczne pobieranie kursów walut z mechanizmem cache i fallbacków. | ✅ Zrobione |
| **Udostępnianie List Pakowania** | Generowanie bezpiecznych linków do współdzielenia list z opcjonalnymi uprawnieniami do edycji. | ✅ Zrobione |
| **Internacjonalizacja (i18n)** | Wsparcie dla wielu języków (polski, angielski) w całej aplikacji. | ✅ Zrobione |

---

## Roadmap (Proponowane Rozszerzenia)

| Kategoria | Funkcjonalność | Priorytet | Opis |
|-----------|----------------|-----------|------|
| **Itinerarium** | Wizualizacja na osi czasu i mapie | Wysoki | Graficzne przedstawienie planu podróży, ułatwiające orientację w czasie i przestrzeni. |
| | Eksport do kalendarza (iCal) | Średni | Możliwość dodania wygenerowanego planu podróży do zewnętrznych aplikacji kalendarza (Google, Apple). |
| | Współdzielenie publiczne | Średni | Opcja udostępnienia itinerarium w trybie "tylko do odczytu" za pomocą publicznego linku. |
| **Budżet** | Zaawansowana analityka i wykresy | Wysoki | Wizualne raporty i wykresy przedstawiające strukturę wydatków. |
| | Dzielenie wydatków | Średni | Funkcjonalność do dzielenia kosztów między uczestników podróży. |
| | Historyczne kursy FX | Niski | Zapisywanie kursu waluty z dnia wprowadzenia wydatku dla większej precyzji. |
| **Pakowanie** | Szablony list | Wysoki | Możliwość tworzenia i zapisywania własnych szablonów list do pakowania (np. "Wyjazd na narty"). |
| | Historia wersji | Średni | Śledzenie zmian na liście do pakowania i możliwość przywracania poprzednich wersji. |
| **Tryb Offline (PWA)** | Dostęp offline do danych | Wysoki | Możliwość przeglądania kluczowych danych (itinerarium, lista pakowania, rezerwacje) bez dostępu do internetu. |
| **Funkcje Społecznościowe** | Galeria publicznych itinerariów | Średni | Przeglądanie i inspirowanie się planami podróży stworzonymi przez innych użytkowników. |
| | Notatki i załączniki | Niski | Możliwość dodawania prywatnych notatek, zdjęć i dokumentów (np. biletów) do podróży. |
| **Integracje** | Import rezerwacji | Wysoki | Automatyczne importowanie rezerwacji lotów i hoteli ze skrzynki e-mail lub przez API. |
| | Prognoza pogody | Średni | Wyświetlanie prognozy pogody dla miejsca docelowego w panelu podróży. |

---

## Współtworzenie
1. Fork repo
2. `git checkout -b feat/twoja-funkcja`
3. Implementacja + testy
4. `npm run lint && npm test`
5. Commit (`feat(scope): ...`) i push
6. Pull Request z opisem / zrzutami ekranu

Stworzone z ❤️ dla podróżników kochających czysty kod.

---

> Brak pliku licencji – dodaj (sugerowane MIT) przed publicznym release.

