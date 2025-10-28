import type { APIRoute } from 'astro';

import fs from 'fs/promises';
import path from 'path';

async function getClassificationsFromPublic(locale = 'en') {
  try {
    // Validate locale and default to 'en' if invalid
    const validLocales = ['en', 'pl'];
    const selectedLocale = validLocales.includes(locale) ? locale : 'en';

    // Read the JSON file directly from the public directory
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, `ticketmaster_classifications_${selectedLocale}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Classifications file not found: ticketmaster_classifications_${selectedLocale}.json`);
    }

    // Read and parse the file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Skip complex validation for now, just ensure basic structure
    if (!data._embedded?.classifications) {
      throw new Error('Invalid classifications file structure');
    }

    // Extract different types of classifications for hierarchical filtering
    const segments: { id: string; name: string; type: string; category: string }[] = [];
    const genres: { id: string; name: string; type: string; category: string }[] = [];
    const subGenres: { id: string; name: string; type: string; category: string }[] = [];
    const types: { id: string; name: string; type: string; category: string }[] = [];
    const subTypes: { id: string; name: string; type: string; category: string }[] = [];

    for (const classification of data._embedded.classifications) {
      // Process segments and their embedded genres/subgenres
      if (classification.segment) {
        const segment = classification.segment;
        segments.push({
          id: segment.id,
          name: segment.name,
          type: 'segment',
          category: 'Main Categories',
        });

        // Process genres within the segment
        if (segment._embedded?.genres) {
          for (const genre of segment._embedded.genres) {
            genres.push({
              id: genre.id,
              name: genre.name,
              type: 'genre',
              category: 'Genres',
            });

            // Process subgenres within the genre
            if (genre._embedded?.subgenres) {
              for (const subgenre of genre._embedded.subgenres) {
                subGenres.push({
                  id: subgenre.id,
                  name: subgenre.name,
                  type: 'subGenre',
                  category: 'Sub-Genres',
                });
              }
            }
          }
        }
      }

      // Process types and their embedded subtypes
      if (classification.type) {
        const type = classification.type;
        types.push({
          id: type.id,
          name: type.name,
          type: 'type',
          category: 'Event Types',
        });

        // Process subtypes within the type
        if (type._embedded?.subtypes) {
          for (const subtype of type._embedded.subtypes) {
            subTypes.push({
              id: subtype.id,
              name: subtype.name,
              type: 'subType',
              category: 'Sub-Types',
            });
          }
        }
      }
    }

    return {
      segments,
      genres,
      subGenres,
      types,
      subTypes,
      all: [...segments, ...genres, ...subGenres, ...types, ...subTypes],
      grouped: {
        'Main Categories': segments,
        Genres: genres,
        'Sub-Genres': subGenres,
        'Event Types': types,
        'Sub-Types': subTypes,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load classifications from public assets: ${errorMessage}`);
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Extract locale from query parameters
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';

    const classifications = await getClassificationsFromPublic(locale);
    return new Response(JSON.stringify(classifications), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
