import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const createSupabaseServer = (cookies: AstroCookies) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options: CookieOptions) {
        cookies.set(key, value, options);
      },
      remove(key: string, options: CookieOptions) {
        cookies.delete(key, options);
      },
    },
  });
};

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const createSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export type SupabaseClientType = SupabaseClient;
