import type { APIContext } from 'astro';
import { z } from 'zod';
import { generatePackingList, validatePackingList, categorizePackingList } from '@/lib/services/geminiService';
import { AIPackingActionSchema } from '@/lib/schemas/packingSchemas';

export const prerender = false;

export async function POST({ request }: APIContext) {
    try {
        const body = await request.json();
        
        // Validate the request body
        const validatedBody = AIPackingActionSchema.parse(body);
        const { action, payload } = validatedBody;

        switch (action) {
            case 'generate': {
                if (!payload.details) {
                    return new Response(
                        JSON.stringify({ error: 'Details are required for generate action' }), 
                        { status: 400, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                
                const generatedList = await generatePackingList(payload.details);
                return new Response(
                    JSON.stringify(generatedList), 
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }

            case 'validate': {
                if (!payload.currentList) {
                    return new Response(
                        JSON.stringify({ error: 'Current list is required for validate action' }), 
                        { status: 400, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                
                const validationResult = await validatePackingList(
                    payload.currentList, 
                    payload.changes || {}
                );
                return new Response(
                    JSON.stringify(validationResult), 
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }

            case 'categorize': {
                if (!payload.items || !payload.categories) {
                    return new Response(
                        JSON.stringify({ error: 'Items and categories are required for categorize action' }), 
                        { status: 400, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                
                const categorizationResult = await categorizePackingList(
                    payload.items, 
                    payload.categories
                );
                return new Response(
                    JSON.stringify(categorizationResult), 
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid action' }), 
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
        }
    } catch (error: any) {
        console.error(`Error in /api/ai/packing:`, error);
        
        if (error instanceof z.ZodError) {
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid request data', 
                    details: error.errors 
                }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        return new Response(
            JSON.stringify({ 
                error: error.message || 'An internal server error occurred.' 
            }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}