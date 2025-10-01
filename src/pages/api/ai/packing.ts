import type { APIContext } from 'astro';
import { generatePackingList, validatePackingList, categorizePackingList } from '@/lib/services/geminiService';

export async function POST({ request }: APIContext) {
    try {
        const body = await request.json();
        const { action, payload } = body;

        if (!action || !payload) {
            return new Response(JSON.stringify({ error: 'Action and payload are required' }), { status: 400 });
        }

        switch (action) {
            case 'generate':
                const generatedList = await generatePackingList(payload.details);
                return new Response(JSON.stringify(generatedList), { status: 200 });

            case 'validate':
                const validationResult = await validatePackingList(payload.currentList, payload.changes);
                return new Response(JSON.stringify(validationResult), { status: 200 });

            case 'categorize':
                const categorizationResult = await categorizePackingList(payload.items, payload.categories);
                return new Response(JSON.stringify(categorizationResult), { status: 200 });

            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }
    } catch (error: any) {
        console.error(`Error in /api/ai/packing: ${error.message}`);
        return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
    }
}