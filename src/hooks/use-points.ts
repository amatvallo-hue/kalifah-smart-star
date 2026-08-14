import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function usePoints() {
  const { user } = useAuth();
  const [mata, setMata] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Muat nilai star semasa
    (async () => {
      const { data } = await supabase
        .from("user_points")
        .select("jumlah_mata")
        .eq("user_id", user.id)
        .maybeSingle();
      setMata(data?.jumlah_mata ?? 0);
    })();

    // Langgan perubahan real-time (INSERT/UPDATE) untuk row user ini
    const channel = supabase
      .channel(`user-points-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_points",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as { jumlah_mata?: number | null } | null;
          setMata(newRow?.jumlah_mata ?? 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return mata;
}
