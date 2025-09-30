import type { APIRoute } from "astro";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdvancedItineraryPrompt } from "../../../../lib/prompts/itineraryPrompt";
import type { ItineraryPreferences } from "../../../../types";

export const prerender = false;

const preferencesSchema = z.object({
  interests: z.array(z.string()),
  travelStyle: z.enum(["Relaxed", "Balanced", "Intense"]),
  budget: z.string(),
  language: z.string().min(2),
});

// Assume GEMINI_API_KEY is set in your environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

function json(data: unknown, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : init.status,
    headers: { "content-type": "application/json" },
    ...(typeof init === "object" ? init : {}),
  });
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { tripId } = params;
  const { supabase } = locals;

  if (!tripId) {
    return json({ error: "Trip ID is required" }, 400);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  // 1. Validate user preferences from request body
  let preferences: ItineraryPreferences;
  try {
    const body = await request.json();
    preferences = preferencesSchema.parse(body);
  } catch (e) {
    const error = e as { issues?: unknown; message: string };
    return json({ error: "ValidationError", details: error.issues ?? error.message }, 400);
  }

  // 2. Verify trip ownership and get trip details
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("destination, start_date, end_date, budget")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .single();

  if (tripError || !trip) {
    return json({ error: "Trip not found or you do not have access." }, 404);
  }

  // 3. Determine final budget and create final preferences object
  const finalBudget = trip.budget ? String(trip.budget) : preferences.budget;
  const finalPreferences: ItineraryPreferences = {
    ...preferences,
    budget: finalBudget,
  };

  // 4. Create a record in GeneratedItineraries
  const { data: itineraryRecord, error: insertError } = await supabase
    .from("GeneratedItineraries")
    .insert({
      trip_id: tripId,
      preferences_json: finalPreferences,
      status: "GENERATING",
    })
    .select("id")
    .single();

  if (insertError || !itineraryRecord) {
    return json({ error: "Failed to create itinerary record", details: insertError?.message }, 500);
  }

  const itineraryId = itineraryRecord.id;

  // 5. Asynchronously generate itinerary
  generateItinerary(itineraryId, trip, finalPreferences, supabase, finalPreferences.language);

  // Immediately return a response to the client
  return json({ message: "Itinerary generation started.", itineraryId }, 202);
};

async function generateItinerary(
  itineraryId: string,
  trip: { destination: string; start_date: string; end_date: string },
  preferences: ItineraryPreferences,
  supabase: SupabaseClient,
  language: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = createAdvancedItineraryPrompt(trip, preferences, language);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to get valid JSON
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const generatedPlan = JSON.parse(jsonString);

    await supabase
      .from("GeneratedItineraries")
      .update({
        generated_plan_json: generatedPlan,
        status: "COMPLETED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", itineraryId);

  } catch (error) {
    console.error("Error generating itinerary:", error);
    await supabase
      .from("GeneratedItineraries")
      .update({
        status: "FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", itineraryId);
  }
}
