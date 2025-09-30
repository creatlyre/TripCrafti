import type { APIRoute } from 'astro';

/**
 * Fetches an image from Unsplash for a given query.
 * @param query The search term for the image.
 * @param accessKey The Unsplash API access key.
 * @returns The first photo object or null if not found.
 */
async function fetchUnsplashImage(query: string, accessKey: string) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    // Don't throw here, just log and return null to allow fallbacks
    console.warn(`Unsplash API responded with status: ${response.status} for query: "${query}"`);
    return null;
  }

  const data = await response.json();
  return data.results[0] || null;
}


/**
 * API route to fetch a landscape image with a cascading fallback system.
 * 1. Tries the specific destination.
 * 2. Tries a broader part of the destination (e.g., country).
 * 3. Tries a generic "travel" query as a final resort.
 */
export const GET: APIRoute = async ({ params }) => {
  const { destination } = params;

  if (!destination) {
    return new Response(JSON.stringify({ error: 'Destination is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const unsplashAccessKey = import.meta.env.UNSPLASH_ACCESS_KEY;

  if (!unsplashAccessKey) {
    console.error('UNSPLASH_ACCESS_KEY is not set in environment variables.');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // --- Cascading Fallback Logic ---

    // 1. Primary Attempt: Use the specific destination query
    let photo = await fetchUnsplashImage(destination, unsplashAccessKey);

    // 2. Secondary Attempt: Fallback to a broader geographic term
    if (!photo) {
      const destinationParts = destination.split(',');
      const broaderQuery = destinationParts.pop()?.trim(); // Get the last part, e.g., "Italy" from "Rome, Italy"
      if (broaderQuery && broaderQuery.toLowerCase() !== destination.toLowerCase()) {
        console.log(`Primary search failed for "${destination}", trying fallback: "${broaderQuery}"`);
        photo = await fetchUnsplashImage(broaderQuery, unsplashAccessKey);
      }
    }

    // 3. Tertiary Attempt: Fallback to a generic term if all else fails
    if (!photo) {
      console.log(`All specific searches failed for "${destination}", trying generic fallback: "travel"`);
      photo = await fetchUnsplashImage('travel', unsplashAccessKey);
    }
    
    // --- End of Fallback Logic ---

    if (!photo) {
      // This will only happen if even the generic "travel" search fails, which is highly unlikely.
      return new Response(JSON.stringify({ error: 'No image found for the destination' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Happy path: return structured image data from whichever search succeeded
    const imageData = {
      url: photo.urls.small,
      alt: photo.alt_description || `A landscape related to ${destination}`,
      attribution: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
    };

    return new Response(JSON.stringify(imageData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, immutable', // Cache for 1 day
      },
    });

  } catch (error: any) {
    console.error('An unexpected error occurred while fetching an image:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch image from provider' }), {
      status: 502, // Bad Gateway
      headers: { 'Content-Type': 'application/json' },
    });
  }
};