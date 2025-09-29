interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_URL?: string; // backward compat
  readonly SUPABASE_KEY?: string; // backward compat
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Astro.locals to include language selected in middleware
/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    lang: 'en' | 'pl';
    supabase: import('@supabase/supabase-js').SupabaseClient;
    session: import('@supabase/supabase-js').Session | null;
  }
}
