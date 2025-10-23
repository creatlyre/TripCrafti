# Event Classification Refresh Guide

This guide explains how to refresh event classifications with language support in TripCrafti.

## Overview

The application now supports multiple languages for event classifications fetched from the Ticketmaster Discovery API. Currently supported languages:
- **English (`en`)** - Default
- **Polish (`pl`)**

## Language-Based File Structure

Classifications are stored in language-specific files:
```
public/
├── ticketmaster_classifications_en.json  # English classifications
└── ticketmaster_classifications_pl.json  # Polish classifications
```

## How Language Detection Works

1. **User Interface**: The EventFinder component automatically detects the user's language from the application's i18n context
2. **API Requests**: The language is passed as a `locale` parameter to the classifications API
3. **File Selection**: The API loads the appropriate language-specific file based on the locale

## Refreshing Classifications

### Method 1: Manual API Calls

#### Refresh English Classifications
```bash
# Using curl (POST request)
curl -X POST "http://localhost:3000/api/events/refresh-classifications?locale=en"

# Or with JSON body
curl -X POST "http://localhost:3000/api/events/refresh-classifications" \
  -H "Content-Type: application/json" \
  -d '{"locale": "en"}'
```

#### Refresh Polish Classifications
```bash
# Using curl (POST request)
curl -X POST "http://localhost:3000/api/events/refresh-classifications?locale=pl"

# Or with JSON body
curl -X POST "http://localhost:3000/api/events/refresh-classifications" \
  -H "Content-Type: application/json" \
  -d '{"locale": "pl"}'
```

#### Refresh Both Languages
```bash
# Refresh English
curl -X POST "http://localhost:3000/api/events/refresh-classifications?locale=en"

# Refresh Polish
curl -X POST "http://localhost:3000/api/events/refresh-classifications?locale=pl"
```

### Method 2: Browser Developer Tools

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Execute the following JavaScript:

```javascript
// Refresh English classifications
fetch('/api/events/refresh-classifications?locale=en', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('English refresh result:', data));

// Refresh Polish classifications
fetch('/api/events/refresh-classifications?locale=pl', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Polish refresh result:', data));
```

### Method 3: Using RefreshClassifications Component

The application includes a RefreshClassifications component (if available) that provides a UI for refreshing classifications:

1. Navigate to the Events tab in your trip dashboard
2. Look for a "Refresh Classifications" button
3. The component will refresh classifications for the current user's language automatically

## API Response Examples

### Successful Refresh Response
```json
{
  "success": true,
  "message": "Classifications refreshed successfully for locale: en",
  "locale": "en",
  "timestamp": "2025-10-21T16:39:03.123Z"
}
```

### Error Response
```json
{
  "error": "Failed to refresh classifications",
  "details": "API rate limit exceeded"
}
```

## Troubleshooting

### Common Issues

1. **Missing API Key**
   - Error: `Missing TICKETMASTER_API_KEY environment variable`
   - Solution: Ensure the `TICKETMASTER_API_KEY` is set in your environment variables

2. **Invalid Locale**
   - The system automatically defaults to 'en' for invalid locales
   - Valid locales: `en`, `pl`

3. **API Rate Limits**
   - Ticketmaster API has rate limits
   - Wait before retrying if you hit rate limits

4. **Network Issues**
   - Check internet connectivity
   - Verify Ticketmaster API is accessible

### Verification

After refreshing, verify the classifications were updated:

1. **Check File Timestamps**:
   ```bash
   ls -la public/ticketmaster_classifications_*.json
   ```

2. **Test API Endpoint**:
   ```bash
   # Test English
   curl "http://localhost:3000/api/events/classifications?locale=en"
   
   # Test Polish  
   curl "http://localhost:3000/api/events/classifications?locale=pl"
   ```

3. **Check UI**: Navigate to the Events tab and verify categories are loaded correctly

## Development Notes

### Adding New Languages

To add support for a new language (e.g., German):

1. **Update Valid Locales** in both API files:
   ```typescript
   const validLocales = ['en', 'pl', 'de']; // Add 'de'
   ```

2. **Test the New Locale**:
   ```bash
   curl -X POST "http://localhost:3000/api/events/refresh-classifications?locale=de"
   ```

3. **Verify File Creation**:
   ```bash
   ls public/ticketmaster_classifications_de.json
   ```

### File Structure Validation

The classification files follow this structure:
```json
{
  "_embedded": {
    "classifications": [
      {
        "segment": {
          "id": "...",
          "name": "...",
          "_embedded": {
            "genres": [...]
          }
        },
        "type": {
          "id": "...",
          "name": "...",
          "_embedded": {
            "subtypes": [...]
          }
        }
      }
    ]
  }
}
```

## Best Practices

1. **Regular Updates**: Refresh classifications periodically (weekly/monthly) to get latest categories
2. **Language Consistency**: Ensure both language files are kept up to date
3. **Error Handling**: Always check the response status before assuming success
4. **Backup**: Consider backing up classification files before major updates

## Security Notes

- The refresh endpoint requires no authentication but should be protected in production
- The Ticketmaster API key should be kept secure and not exposed in client-side code
- Consider implementing rate limiting for the refresh endpoint in production

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify the Ticketmaster API key is valid and has sufficient quota
3. Ensure network connectivity to `app.ticketmaster.com`
4. Check the file permissions for the `public/` directory