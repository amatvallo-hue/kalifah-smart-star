import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Profile {
  id: string;
  darjah_akses: number[];
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, darjah_akses")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        setProfile(data as Profile);
      } else {
        // Backfill if missing
        const { data: inserted } = await supabase
          .from("profiles")
          .insert({ id: user.id, darjah_akses: [1] })
          .select("id, darjah_akses")
          .single();
        setProfile((inserted as Profile) ?? { id: user.id, darjah_akses: [1] });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  return { profile, loading: authLoading || loading };
}
