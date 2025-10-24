# Instrukcje Deploymentu TripCrafti

Ten dokument opisuje proces wdrażania aplikacji TripCrafti w środowisku produkcyjnym używającym Cloudflare Pages i Durable Objects.

## Architektura Deploymentu

TripCrafti używa hybrydowego modelu:

1. **Cloudflare Pages** - główna aplikacja (Astro + React)
2. **Cloudflare Durable Objects Worker** - długotrwałe AI generowanie
3. **Cloudflare KV** - przechowywanie sekretów

## Wymagania

- Konto Cloudflare z dostępem do Pages i Workers
- Wrangler CLI (`npm install -g wrangler`)
- Konto Supabase (baza danych)
- Klucze API (Google Gemini, opcjonalnie inne)

## Krok 1: Konfiguracja Cloudflare KV

Utwórz namespace KV i dodaj sekrety:

```bash
# Lista przestrzeni nazw KV
npx wrangler kv:namespace list

# Dodaj wymagane sekrety (zastąp ID swoim namespace)
npx wrangler kv:key put GEMINI_API_KEY "your-key" --namespace-id YOUR_KV_ID --remote
npx wrangler kv:key put SUPABASE_SERVICE_ROLE_KEY "your-key" --namespace-id YOUR_KV_ID --remote

# Weryfikuj sekrety
npx wrangler kv:key list --namespace-id YOUR_KV_ID --remote
```

## Krok 2: Deploy Durable Objects Worker

```bash
# Deploy worker z Durable Objects
npx wrangler deploy --config wrangler-worker.toml
```

Sprawdź, czy deployment się powiódł:
```bash
# Lista deployed workers
npx wrangler list

# Test worker
curl https://your-worker-name.your-subdomain.workers.dev
```

## Krok 3: Deploy Cloudflare Pages

```bash
# Build aplikacji
npm run build

# Deploy do Pages
npx wrangler pages deploy dist
```

## Krok 4: Weryfikacja

1. **Test AI Generowania:**
   - Stwórz nową podróż w aplikacji
   - Spróbuj wygenerować itinerary
   - Sprawdź logi: `npx wrangler tail --config wrangler-worker.toml`

2. **Sprawdź Status Bazy:**
   - Status w tabeli `generateditineraries` powinien przejść `GENERATING` → `COMPLETED`

## Monitoring i Debugowanie

### Viewing Logs

```bash
# Logi Durable Object Worker
npx wrangler tail --config wrangler-worker.toml

# Logi Pages (przez dashboard)
npx wrangler pages deployment tail --project-name=YOUR_PROJECT
```

### Common Issues

1. **"Service Unavailable" Error**
   - Sprawdź czy Durable Objects Worker jest deployed
   - Zweryfikuj binding w `wrangler.toml`

2. **"Column not found" Error**
   - Uruchom migracje bazy danych (Krok 2)
   - Aplikacja ma fallback, ale lepiej dodać kolumny

3. **"API Key not found"**
   - Sprawdź sekrety w Cloudflare KV
   - Zweryfikuj namespace ID w konfiguracji

## Rollback Plan

W przypadku problemów:

1. **Szybki rollback** - aplikacja ma automatyczny fallback do lokalnego generowania
2. **Pełny rollback** - usuń binding Durable Objects z `wrangler.toml` i redeploy

## Development vs Production

| Środowisko | AI Generowanie | Konfiguracja |
|------------|----------------|--------------|
| Local (`npm run dev`) | Fallback do lokalnego | `.env` file |
| Cloudflare Dev (`npm run dev:cloudflare`) | Prawdziwe Durable Objects | Build + wrangler dev |
| Production | Durable Objects | Cloudflare Pages + Worker |

## Performance Benefits

Z Durable Objects:
- ✅ Brak timeoutów dla długich generowań (60-90s)
- ✅ Stan persystentny i retry logic
- ✅ Równoległa obsługa wielu użytkowników
- ✅ Automatyczne timeout handling (5 min)
- ✅ Graceful degradation przy błędach

## Next Steps

Po deploymencie:
1. Monitoruj performance i error rates
2. Dostosuj timeout values jeśli potrzeba
3. Rozważ dodanie dodatkowego trackingu progress
4. Zaimplementuj retry logic dla failed generations