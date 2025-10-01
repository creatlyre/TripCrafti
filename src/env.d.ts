interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_URL?: string; // backward compat
  readonly SUPABASE_KEY?: string; // backward compat
  /** Optional legacy key (currently unused in code) */
  readonly OPENROUTER_API_KEY?: string;
  /** Gemini / Google AI Studio API key used for itinerary generation */
  readonly GEMINI_API_KEY?: string; // required for itinerary AI endpoint
  /** Override default Gemini model selection (e.g. gemini-1.5-flash) */
  readonly GEMINI_MODEL?: string;
  /** Unsplash access key for destination image fetching */
  readonly UNSPLASH_ACCESS_KEY?: string;
  /** Public FX API base URL (must be prefixed with PUBLIC_ to be exposed client-side if needed) */
  readonly PUBLIC_FX_API_BASE?: string;
  // add new env variables above this line
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Astro.locals to include language selected in middleware
/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    lang: "en" | "pl";
    supabase: import("@supabase/supabase-js").SupabaseClient;
    session: import("@supabase/supabase-js").Session | null;
  }
}
