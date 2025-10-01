# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```md
.
├── src/
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   ├── components/ # UI components (Astro & React)
│   └── assets/     # Static assets
├── public/         # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT

## Internationalization (i18n)

The project includes a very lightweight internationalization setup for Polish (`pl`) and English (`en`).

How it works:

1. A middleware (`src/middleware.ts`) runs on every request and determines the active language in this order:
	- `?lang=` query parameter (e.g. `/?lang=en`)
	- Cookie `tc_lang`
	- First value from the `Accept-Language` request header (2‑letter code)
	- Fallback: `pl`
2. The resolved language is stored on `Astro.locals.lang` and consumed in pages/layouts.
3. Dictionaries live in `src/lib/i18n.ts` – extend the `dictionaries` object to add more languages.
4. Changing the language sets/updates the `tc_lang` cookie so subsequent navigations keep the choice.

Adding a new language:

1. Extend the `Lang` union and `dictionaries` map in `src/lib/i18n.ts`.
2. Add the new language code to `SUPPORTED` in `src/middleware.ts`.
3. Update any hard‑coded language conditionals (e.g. small inline ternaries) if needed.
4. Restart the dev server if types are not picked up.

Troubleshooting:

- If `?lang=en` in the URL does not change content, ensure the middleware file is named `src/middleware.ts` (Astro only auto-loads that path) and that `export const prerender = false;` is set on pages that must stay dynamic.
- Clear the `tc_lang` cookie or open a private window to test Accept-Language detection.

## Authentication (Supabase)

The project ships with a ready-to-use Supabase authentication setup (email + optional OAuth providers).

### Files Added

- `src/lib/supabase.ts` – central client created with `createClient()`
- `src/components/auth/SupabaseProvider.tsx` – wraps the app in `SessionContextProvider`
- `src/components/auth/Login.tsx` – React component rendering the Supabase Auth UI (with custom styling to match the existing slate / indigo aesthetic)
- `src/pages/login.astro` – Uses the React component (`<AuthLogin client:load />`)

### Environment Variables

Add these to your `.env` (or copy `.env.example`):

```
PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Only use the public (anon) key client-side. Never expose the `service_role` key in the browser or commit it to the repo.

Legacy fallback variables `SUPABASE_URL` / `SUPABASE_KEY` are still supported if already present in your deployment environment.

### Adding OAuth Providers

In `src/components/auth/Login.tsx` adjust:

```ts
<Auth
	providers={['google', 'github']}
	...
/>
```

Enable and configure each provider in your Supabase dashboard (Authentication → Providers) and add the required callback URL, typically:

```
http://localhost:3000
```

### Session Availability

All React islands inside the layout can access the session via `useUser()` and the client via `useSupabaseClient()` thanks to the provider added in `src/layouts/Layout.astro`.

### Redirects After Auth

The Auth UI currently uses `redirectTo={window.location.origin}`. Adjust this if you want to send users somewhere else post-login (e.g. `/app`). For protected pages you can add server-side guards later using Astro middleware or server load functions.

### Styling Overrides

Custom appearance overrides live inside `Login.tsx` (gradient buttons, slate backgrounds). Adjust or remove if you prefer the default ThemeSupa styles.

### Common Issues

- Blank auth form: ensure the env vars are loaded (restart dev server after adding `.env`).
- 400 errors on OAuth: verify provider callback URL matches exactly (no trailing slash mismatch).
- Session not persisting: check that cookies are not blocked and that `persistSession: true` is set in `supabase.ts`.

### React Version Compatibility

`@supabase/auth-ui-react@0.4.x` currently declares React 18 in its dependencies. Running the project on React 19 caused a duplicated React copy and the runtime error `Cannot read properties of null (reading 'useState')` (invalid hooks dispatcher during SSR). The project pins React to 18.3.x to ensure a single reconciler instance. If/when the auth UI library updates to React 19 peer dependency only, you can upgrade React again. Until then keep React 18.

Additionally the login island uses `client:only="react"` to avoid server-rendering the auth widget (which relies on browser-only APIs and hooks initialization). Remove that directive if you prefer SSR once upstream fully supports it.

## BudgetCraft Phase 3 Additions

The project now includes foreign exchange (FX) conversion, post-trip budget reports, and CSV export.

### Environment Variable

Set a public FX API base (no key required for exchangerate.host):

```
PUBLIC_FX_API_BASE=https://api.exchangerate.host
```

If unset, the utility defaults to `https://api.exchangerate.host`.

### FX Conversion

When creating or updating an expense where `expense.currency !== trip.currency`, the API:

1. Fetches the live rate (cached 6h) via `/latest?base={from}&symbols={to}`.
2. Converts `amount` into `amount_in_home_currency` stored with the expense.
3. Falls back to rate=1 with a warning if the fetch fails (avoids blocking the user).

> NOTE: To persist exact historical FX, add migration: `ALTER TABLE expenses ADD COLUMN fx_rate NUMERIC;`

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trips/:tripId/expenses` | POST | Create expense with FX conversion |
| `/api/trips/:tripId/expenses/:expenseId` | PUT | Update expense with recalculated FX |
| `/api/trips/:tripId/budget/report` | GET | Planned vs actual per category & totals |
| `/api/trips/:tripId/expenses/export.csv` | GET | CSV export of expenses |

### Report Structure (`BudgetReport`)

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

### UI Enhancements

* Budget dashboard: CSV export button.
* Post-trip (`end_date` passed) displays a consolidated report card.
* Summary widget already surfaces daily safe-to-spend.

### Testing

`tests/unit/fx.service.test.ts` covers:

* Identity rate
* Live fetch & subsequent cache hit
* Fallback on provider error
* Conversion calculation

Run tests:

```
npm test
```

### Future Extensions

* Persist `fx_rate` per expense.
* Historical date-based rate lookup.
* Reconciliation & revaluation tool.
* Multi-currency reporting (group by source currency).


