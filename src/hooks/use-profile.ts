import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Profile {
  id: string;
  darjah_akses: number[];
}

function normalizeDarjahAkses(raw: unknown): number[] {
  const arr = Array.isArray(raw)
    ? raw.map(Number)
    : typeof raw === "string"
    ? raw.replace(/[{}]/g, "").split(",").map(Number).filter(Boolean)
    : [];
  return arr.filter((n) => Number.isFinite(n));
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
      const { data, error } = await supabase
        .from("profiles")
        .select("id, darjah_akses")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("[useProfile] SELECT error:", error);
      }

      if (data) {
        setProfile({
          id: (data as Profile).id,
          darjah_akses: normalizeDarjahAkses((data as { darjah_akses: unknown }).darjah_akses),
        });
        setLoading(false);
        return;
      }


      // No row visible. Use upsert with ignoreDuplicates so we NEVER
      // overwrite an existing row's darjah_akses with an empty array.
      const { data: upserted, error: upErr } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, darjah_akses: [] },
          { onConflict: "id", ignoreDuplicates: true },
        )
        .select("id, darjah_akses");

      if (!mounted) return;

      if (upErr) {
        console.error("[useProfile] upsert error:", upErr);
      }

      // Re-read after upsert to get authoritative row (handles the case
      // where the row already existed and ignoreDuplicates returned []).
      const { data: reread } = await supabase
        .from("profiles")
        .select("id, darjah_akses")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const finalRow =
        (reread as Profile | null) ??
        (Array.isArray(upserted) && upserted.length > 0
          ? (upserted[0] as Profile)
          : null);

      if (finalRow) {
        setProfile({
          id: finalRow.id,
          darjah_akses: Array.isArray(finalRow.darjah_akses)
            ? finalRow.darjah_akses
            : [],
        });
      } else {
        // Truly nothing readable — likely RLS denying SELECT.
        console.warn(
          "[useProfile] tiada profile boleh dibaca untuk user",
          user.id,
          "— semak RLS policy SELECT pada public.profiles",
        );
        setProfile({ id: user.id, darjah_akses: [] });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  return { profile, loading: authLoading || loading };
}
