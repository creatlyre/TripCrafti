import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Auth error");
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, session, user, error, refresh: load };
}
