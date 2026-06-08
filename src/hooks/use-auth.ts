import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let settled = false;

    // Subscribe FIRST so we catch INITIAL_SESSION after storage rehydration.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    });

    // Fallback: if onAuthStateChange hasn't fired within a tick, use getSession.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || settled) return;
      settled = true;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
