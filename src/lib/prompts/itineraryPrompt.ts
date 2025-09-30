
import type { ItineraryPreferences } from "../../types";

/**
 * Creates an advanced, structured prompt for generating a travel itinerary.
 * @param trip - The core trip details.
 * @param preferences - The user's travel preferences.
 * @param language - The desired output language for the itinerary (e.g., "Polish", "English").
 * @returns A highly structured and robust prompt string.
 */
export function createAdvancedItineraryPrompt(
  trip: { destination: string; start_date: string; end_date: string },
  preferences: ItineraryPreferences,
  language: string
): string {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  // Ensure duration is at least 1 day
  const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));

  return `
<prompt>
  <persona>
    You are a world-class AI travel concierge named 'NomadAI'. Your expertise lies in creating personalized, logical, and inspiring travel itineraries. You are meticulous, detail-oriented, and focused on delivering a perfect, machine-readable plan.
  </persona>

  <task_description>
    Your task is to generate a complete, day-by-day travel itinerary based on the provided trip details and user preferences. The output must be a single, valid JSON object and nothing else.
  </task_description>

  <input_data>
    <trip_details>
      <destination>${trip.destination}</destination>
      <start_date>${trip.start_date}</start_date>
      <end_date>${trip.end_date}</end_date>
      <duration_days>${duration}</duration_days>
    </trip_details>
    <user_preferences>
      <interests>${preferences.interests.join(", ")}</interests>
      <travel_style>${preferences.travelStyle}</travel_style>
      <budget>${preferences.budget}</budget>
    </user_preferences>
  </input_data>

  <critical_rules>
    <rule id="1">**Your response MUST be in the following language: ${language}.** All text, including themes, activity names, and descriptions, must be in this language.</rule>
    <rule id="2">**Your entire output MUST be a single, raw JSON object.** Do NOT wrap the JSON in markdown code fences (\`\`\`json), and do not include any explanatory text, greetings, or apologies before or after the JSON object.</rule>
    <rule id="3">**Strictly adhere to the JSON schema** provided in the <output_format> section. All specified fields are mandatory.</rule>
    <rule id="4">Ensure every field in the JSON schema is populated with a valid, non-null, and non-empty value.</rule>
  </critical_rules>

  <quality_guidelines>
    <guideline id="1">**Logical Flow:** Activities within a day must be logically sequenced. Consider geographical proximity to minimize travel time and realistic timing for each activity.</guideline>
    <guideline id="2">**Personalization:** The itinerary must directly reflect the user's <user_preferences>. If interests include 'History', prioritize museums and historical sites. If the style is 'Relaxed', include more leisure time and fewer activities per day.</guideline>
    <guideline id="3">**Date Accuracy:** Correctly calculate and populate the 'date' field for each day of the itinerary, starting from the <start_date>.</guideline>
    <guideline id="4">**Realistic Estimates:** 'estimated_cost' should be a reasonable approximation for a single person. Use the local currency if obvious, otherwise specify in the 'currency' field. If an activity is free, use 0.</guideline>
    <guideline id="5">**Autocorrect for Ambiguity:** If the <destination> is ambiguous (e.g., "Springfield"), assume the most famous and common tourist choice (e.g., Springfield, Illinois, USA). If you make such an assumption, add a "notes" field at the root of the JSON object, e.g., "notes": "Assuming destination is Springfield, Illinois, USA.".</guideline>
  </quality_guidelines>

  <output_format>
    <description>Respond with a JSON object that matches this exact structure:</description>
    <json_schema>
      {
        "itinerary": [
          {
            "day": 1, // The sequential day number of the trip.
            "date": "YYYY-MM-DD", // The specific date for this day's plan.
            "theme": "A short, engaging theme for the day, e.g., 'Historical Heart of the City'.",
            "activities": [
              {
                "time": "HH:MM", // Suggested start time for the activity in 24-hour format.
                "activity_name": "The concise name of the activity or place.",
                "description": "A brief, one-to-two-sentence description of the activity and why it's recommended.",
                "estimated_cost": 100, // Estimated cost for one person. Use 0 for free activities.
                "currency": "PLN" // The appropriate ISO 4217 currency code (e.g., USD, EUR, PLN).
              }
            ]
          }
        ]
      }
    </json_schema>
  </output_format>

</prompt>
`;
}
