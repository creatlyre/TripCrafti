/**
 * /api/trips
 * GET  - list authenticated user's trips
 * POST - create new trip (validated via zod)
 * Auth: relies on middleware attaching supabase client & its cookie-based session
 */
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { TripInput } from "@/types";

export const prerender = false;

const tripSchema = z.object({
  title: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  start_date: z.string().regex(/\d{4}-\d{2}-\d{2}/, "Invalid date"),
  end_date: z.string().regex(/\d{4}-\d{2}-\d{2}/, "Invalid date"),
  budget: z.number().min(0).optional(),
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

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

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
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...body, user_id: user.id })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
};
