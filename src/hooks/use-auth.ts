import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { user: User | null; loading: boolean };

let state: AuthState = { user: null, loading: true };
let initStarted = false;
const listeners = new Set<(s: AuthState) => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l(state));
}

function ensureInit() {
  if (initStarted) return;
  initStarted = true;

  // Subscribe FIRST to catch any auth changes during initial restore.
  supabase.auth.onAuthStateChange((_evt, session) => {
    setState({ user: session?.user ?? null, loading: false });
  });

  // Authoritative initial read: getSession() rehydrates from localStorage
  // before resolving. Runs ONCE for the whole app lifetime (singleton),
  // regardless of how many components call useAuth() concurrently.
  supabase.auth.getSession().then(({ data }) => {
    setState({ user: data.session?.user ?? null, loading: false });
  });
}

export function useAuth(): AuthState {
  const [local, setLocal] = useState(state);

  useEffect(() => {
    ensureInit();
    listeners.add(setLocal);
    // Sync immediately in case singleton already resolved before this effect ran.
    setLocal(state);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);

  return local;
}
