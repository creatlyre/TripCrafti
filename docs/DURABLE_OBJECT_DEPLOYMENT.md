# Durable Object Deployment Instructions

## Overview

This guide explains how to deploy the ItineraryDurableObject to Cloudflare to handle long-running AI itinerary generation that was previously timing out after 60-90 seconds.

## Prerequisites

1. Cloudflare account with Workers enabled
2. Wrangler CLI installed and authenticated
3. Access to Cloudflare KV for secrets management

## Required Secrets

Ensure the following secrets are stored in your Cloudflare KV namespace (`SECRETS`):

```bash
# Set these secrets in your Cloudflare KV namespace
GEMINI_API_KEY="your-gemini-api-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

## Deployment Steps

### 1. Verify Configuration

Ensure your `wrangler.toml` file includes the Durable Object configuration:

```toml
# Durable Objects configuration
[[durable_objects.bindings]]
name = "ITINERARY_GENERATOR"
class_name = "ItineraryDurableObject"

# Durable Object migrations
[[migrations]]
tag = "v1"
new_sqlite_classes = ["ItineraryDurableObject"]
```

### 2. Generate Types

Run the following command to generate TypeScript types:

```bash
npx wrangler types
```

### 3. Deploy to Cloudflare

Deploy the application with the Durable Object:

```bash
# For development/staging
npx wrangler deploy

# For production (if you have environments configured)
npx wrangler deploy --env production
```

### 4. Verify Deployment

After deployment, verify that:

1. The Durable Object is deployed:
   ```bash
   npx wrangler durable-objects:list
   ```

2. Test the itinerary generation by:
   - Creating a new trip in the application
   - Generating an itinerary
   - Monitoring the logs for Durable Object messages

## Monitoring

### View Logs

Monitor the Durable Object logs:

```bash
# View real-time logs
npx wrangler tail

# View logs with filter for Durable Object
npx wrangler tail --grep "ItineraryDO"
```

### Check Status

Monitor generation status using the API:

```bash
# Check itinerary status
curl "https://your-domain.com/api/itinerary/status?itineraryId=YOUR_ITINERARY_ID"
```

## Troubleshooting

### Common Issues

1. **Durable Object not found**
   - Ensure migration is properly deployed
   - Check that `class_name` matches the exported class

2. **Secrets not found**
   - Verify KV namespace binding
   - Ensure secrets are properly set in KV

3. **Database connection issues**
   - Check Supabase service role key
   - Verify network connectivity from Cloudflare Workers

### Debug Commands

```bash
# Check Durable Object instances
npx wrangler durable-objects:list

# View detailed logs
npx wrangler tail --format=pretty

# Check KV namespace contents
npx wrangler kv:key list --binding=SECRETS
```

## Performance Benefits

With Durable Objects, you should see:

- **No more timeouts**: Long-running AI generation (60-90s) handled properly
- **Better reliability**: Automatic retries and state persistence
- **Progress tracking**: Real-time status updates for users
- **Scalability**: Each itinerary gets its own isolated Durable Object

## Rollback Plan

If you need to rollback to the previous implementation:

1. Comment out the Durable Object code in the itinerary endpoint
2. Uncomment the fallback direct generation code
3. Deploy the changes

The current implementation includes automatic fallback, so the system should continue working even if Durable Objects fail.

## Next Steps

1. Monitor performance and error rates
2. Adjust timeout values if needed (currently set to 5 minutes)
3. Consider adding more detailed progress tracking
4. Implement retry logic for failed generations