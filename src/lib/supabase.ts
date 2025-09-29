import { createClient } from '@supabase/supabase-js';

// Prefer new PUBLIC_ prefixed variables (Astro exposes those to client). Fallback to legacy names if present.
// In test / Node environments where import.meta.env might not be populated, also fallback to process.env values.
const supabaseUrl = (import.meta.env.PUBLIC_SUPABASE_URL
  || import.meta.env.SUPABASE_URL
  || (typeof process !== 'undefined' ? (process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) : undefined)) as string | undefined;
const supabaseAnonKey = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  || import.meta.env.SUPABASE_KEY
  || (typeof process !== 'undefined' ? (process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY) : undefined)) as string | undefined;

if (!supabaseUrl) {
  console.warn('[supabase] Missing PUBLIC_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  console.warn('[supabase] Missing PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type SupabaseClientType = typeof supabase;
