/**
 * /api/trips
 * GET  - list authenticated user's trips
 * POST - create new trip (validated via zod)
 * Auth: relies on middleware attaching supabase client & its cookie-based session
 */
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { geocode } from "@/lib/geocoding";
import { z } from "zod";
import type { TripInput } from "@/types";

export const prerender = false;

const tripSchema = z.object({
  title: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  start_date: z.string().regex(/\d{4}-\d{2}-\d{2}/, "Invalid date"),
  end_date: z.string().regex(/\d{4}-\d{2}-\d{2}/, "Invalid date"),
  budget: z.number().min(0).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  lodging: z.string().min(2).max(300).optional(),
});

function json(data: any, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : init.status,
    headers: { "content-type": "application/json" },
    ...(typeof init === "object" ? init : {}),
  });
}

export const GET: APIRoute = async ({ locals }) => {
  const { supabase } = locals;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  // Include related generated itineraries so UI can show plan without an extra fetch.
  // Table names are folded to lowercase in Postgres unless quoted, so use lowercase for relationship.
  let { data, error } = await supabase
    .from("trips")
    .select(`*, itineraries:generateditineraries (id, trip_id, preferences_json, generated_plan_json, status, input_tokens, thought_tokens, created_at, updated_at)`)
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  // Fallback if token columns not yet migrated (avoid 500 for missing column)
  if (error && /input_tokens|thought_tokens|column/.test(error.message)) {
    console.warn('[api/trips] Falling back select without token columns:', error.message);
    const retry = await supabase
      .from("trips")
      .select(`*, itineraries:generateditineraries (id, trip_id, preferences_json, generated_plan_json, status, created_at, updated_at)`)
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });
    data = retry.data;
    error = retry.error;
  }

  if (error) return json({ error: error.message }, 500);
  return json(data);
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase } = locals;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  let body: TripInput;
  try {
    body = tripSchema.parse(await request.json());
  } catch (e: any) {
    return json({ error: "ValidationError", details: e.issues ?? e.message }, 400);
  }
  // Attempt geocode if lodging provided
  let geo: { lat: number; lon: number } | null = null;
  if (body.lodging) {
    try {
      const g = await geocode(`${body.lodging} ${body.destination}`);
      if (g) geo = { lat: g.lat, lon: g.lon };
    } catch (e) {
      console.warn('[api/trips POST] geocode failed', e);
    }
  }

  const insertPayload: any = { ...body, user_id: user.id };
  if (geo) {
    insertPayload.lodging_lat = geo.lat;
    insertPayload.lodging_lon = geo.lon;
  }

  const { data, error } = await supabase
    .from("trips")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
};
