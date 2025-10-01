# FX Providers Integration Guide

TripCrafti uses a pluggable FX fetch layer (`src/lib/fx.ts`) driven by the `PUBLIC_FX_API_BASE` environment variable.
Below are recommended providers, pros/cons, example URLs, and configuration approaches.

## 1. ExchangeRate.host (Current Default)
- URL: https://api.exchangerate.host
- Auth: NOW REQUIRES ACCESS KEY (previously open) -> `access_key=...`
- Preferred endpoint pattern: `/live?source=USD&currencies=PLN&access_key=YOUR_KEY` (returns `quotes` like `USDPLN`)
- Fallback sequence implemented in code: try `/live` -> if missing expected quote, try `/convert?from=USD&to=PLN&amount=1` -> if all fail, fallback rate=1 with warning
- Legacy `/latest?base=USD&symbols=PLN` may not work with keyed plans
- Pros: Free tier available, HTTPS, broad coverage
- Cons: Key required (breaking change), potential throttling, different response shape (`quotes` vs `rates`)
- Env example: `PUBLIC_FX_API_BASE=https://api.exchangerate.host` and set `EXCHANGERATE_API_KEY=your_key`

## 2. Frankfurter.app
- URL: https://api.frankfurter.app
- Auth: None
- Data Source: European Central Bank (ECB) – business days only
- Endpoint: `/latest?from=USD&to=PLN` (NOTE: different param names)
- Pros: Free, reliable ECB rates, simple
- Cons: Only business day rates, parameter names differ (`from`, `to` vs `base`, `symbols`)
- Integration Note: Would require adjusting `fetchRate` in `fx.ts` if you switch.
- Env: `PUBLIC_FX_API_BASE=https://api.frankfurter.app` (AND modify code for param names!)

## 3. ECB Direct (CSV/XML)
- URL: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
- Auth: None
- Pros: Official, stable
- Cons: EUR base only, XML parsing needed, daily snapshot only
- Would require a custom adapter (not REST JSON out of the box) -> Better for a server cron job storing rates locally.

## 4. CurrencyFreaks
- URL: https://api.currencyfreaks.com
- Auth: API Key (free tier limited)
- Endpoint: `/latest?apikey=YOUR_KEY&base=USD&symbols=PLN`
- Pros: HTTPS, JSON, historical endpoints
- Cons: Key management, free tier limits
- Env: `PUBLIC_FX_API_BASE=https://api.currencyfreaks.com` + add key support (update `fx.ts` to append `apikey`)

## 5. OpenExchangeRates
- URL: https://openexchangerates.org/api
- Auth: API Key (paid tiers for full features)
- Endpoint: `/latest.json?app_id=YOUR_KEY&base=USD&symbols=PLN`
- Pros: Stable, historical data, enterprise tiers
- Cons: Base currency restrictions on free tier (USD only), key required
- Env: `PUBLIC_FX_API_BASE=https://openexchangerates.org/api` (adjust code for path & params + `app_id`)

## 6. Fixer.io
- URL: http://data.fixer.io/api
- Auth: Key; free tier EUR base only unless paid
- Endpoint: `/latest?access_key=YOUR_KEY&base=EUR&symbols=PLN`
- Pros: Broad adoption, historical
- Cons: Paywall for flexible base, HTTP (need to enforce HTTPS with paid), cost

## Selecting a Strategy
1. Start with `ExchangeRate.host` (zero friction)
2. Add a second provider fallback (e.g., Frankfurter) if primary fails:
   - Extend `getFxRate` to attempt primary, then secondary
3. For production with volume, move to a keyed provider (CurrencyFreaks or OpenExchangeRates) and cache results in a DB table for traceability.

## Implementation Patterns
### A. Multiple Provider Fallback
Pseudo:
```ts
try primary
catch -> try secondary
catch -> fallback { rate:1, source:'fallback', warning:'both_failed' }
```

### B. Persisting Historical Rates
Add a `fx_daily_rates` table storing (base, quote, rate, date_fetched). Use it before hitting network if same UTC date.

### C. Handling Weekend / Missing Rates
If provider only gives business days (ECB/Frankfurter):
- Accept latest available date
- Store returned date; optionally show it in UI tooltip

## Security Considerations
- Don’t expose API keys on the client; only call providers server-side.
- If you need keys but also client-side conversions, proxy through server endpoints.

## Updating `fx.ts` for Non-`base/symbols` Providers
Frankfurter example modification:
```ts
const url = `${BASE}/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
```
OpenExchangeRates example:
```ts
const url = `${BASE}/latest.json?app_id=${process.env.OXR_KEY}&base=${from}&symbols=${to}`;
```
(Remember to expose key securely – do NOT ship in PUBLIC_ env var.)

## Environment Variable Examples (.env)
```
# Default public provider
PUBLIC_FX_API_BASE=https://api.exchangerate.host

# Example switching to Frankfurter (requires code param change)
# PUBLIC_FX_API_BASE=https://api.frankfurter.app

# If using a keyed provider (handled server-side only)
# FX_PRIMARY_BASE=https://api.currencyfreaks.com
# FX_PRIMARY_KEY=your_key_here
```

## Future Enhancements
- Add date-based historical conversion (store `fx_rate_date`)
- Include inverse rate check to detect anomalies
- Provide admin endpoint to seed/cache key currency pairs

---
This document should be updated whenever a new provider is integrated or fallback logic changes.
