# TripCrafti Deployment Instructions

This document describes the production deployment process for TripCrafti using Cloudflare Pages and Durable Objects.

## Deployment Architecture

TripCrafti uses a hybrid deployment model:

1. **Cloudflare Pages** - main application (Astro + React)
2. **Cloudflare Durable Objects Worker** - long-running AI generation
3. **Cloudflare KV** - secrets storage

## Prerequisites

- Cloudflare account with Pages and Workers access
- Wrangler CLI (`npm install -g wrangler`)
- Supabase account (database)
- API keys (Google Gemini, optionally others)

## Step 1: Configure Cloudflare KV

Create KV namespace and add secrets:

```bash
# List KV namespaces
npx wrangler kv:namespace list

# Add required secrets (replace ID with your namespace)
npx wrangler kv:key put GEMINI_API_KEY "your-key" --namespace-id YOUR_KV_ID --remote
npx wrangler kv:key put SUPABASE_SERVICE_ROLE_KEY "your-key" --namespace-id YOUR_KV_ID --remote

# Verify secrets
npx wrangler kv:key list --namespace-id YOUR_KV_ID --remote
```

## Step 2: Update Database

Add missing columns to `generateditineraries` table:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE generateditineraries 
ADD COLUMN IF NOT EXISTS model_used TEXT;

ALTER TABLE generateditineraries 
ADD COLUMN IF NOT EXISTS generation_duration_ms INTEGER;

ALTER TABLE generateditineraries 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER;

ALTER TABLE generateditineraries 
ADD COLUMN IF NOT EXISTS thought_tokens INTEGER;

ALTER TABLE generateditineraries 
ADD COLUMN IF NOT EXISTS error_message TEXT;
```

## Step 3: Deploy Durable Objects Worker

```bash
# Deploy worker with Durable Objects
npx wrangler deploy --config wrangler-worker.toml
```

Verify deployment succeeded:
```bash
# List deployed workers
npx wrangler list

# Test worker
curl https://your-worker-name.your-subdomain.workers.dev
```

## Step 4: Deploy Cloudflare Pages

```bash
# Build application
npm run build

# Deploy to Pages
npx wrangler pages deploy dist
```

## Step 5: Verification

1. **Test AI Generation:**
   - Create new trip in application
   - Try generating itinerary
   - Check logs: `npx wrangler tail --config wrangler-worker.toml`

2. **Check Database Status:**
   - Status in `generateditineraries` table should transition `GENERATING` → `COMPLETED`

## Monitoring and Debugging

### Viewing Logs

```bash
# Durable Object Worker logs
npx wrangler tail --config wrangler-worker.toml

# Pages logs (via dashboard)
npx wrangler pages deployment tail --project-name=YOUR_PROJECT
```

### Common Issues

1. **"Service Unavailable" Error**
   - Check if Durable Objects Worker is deployed
   - Verify binding in `wrangler.toml`

2. **"Column not found" Error**
   - Run database migrations (Step 2)
   - App has fallback, but better to add columns

3. **"API Key not found"**
   - Check secrets in Cloudflare KV
   - Verify namespace ID in configuration

## Rollback Plan

In case of issues:

1. **Quick rollback** - app has automatic fallback to local generation
2. **Full rollback** - remove Durable Objects binding from `wrangler.toml` and redeploy

## Development vs Production

| Environment | AI Generation | Configuration |
|-------------|---------------|---------------|
| Local (`npm run dev`) | Fallback to local | `.env` file |
| Cloudflare Dev (`npm run dev:cloudflare`) | Real Durable Objects | Build + wrangler dev |
| Production | Durable Objects | Cloudflare Pages + Worker |

## Performance Benefits

With Durable Objects:
- ✅ No timeouts for long generations (60-90s)
- ✅ Persistent state and retry logic
- ✅ Concurrent handling of multiple users
- ✅ Automatic timeout handling (5 min)
- ✅ Graceful degradation on errors

## Next Steps

After deployment:
1. Monitor performance and error rates
2. Adjust timeout values if needed
3. Consider adding additional progress tracking
4. Implement retry logic for failed generations