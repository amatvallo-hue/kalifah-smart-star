import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function usePoints() {
  const { user } = useAuth();
  const [mata, setMata] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_points")
        .select("jumlah_mata")
        .eq("user_id", user.id)
        .maybeSingle();
      setMata(data?.jumlah_mata ?? 0);
    })();
  }, [user]);

  return mata;
}
