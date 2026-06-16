import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

function todayKL(): string {
  const now = new Date();
  const ms = now.getTime() + (8 * 60 - now.getTimezoneOffset()) * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function daysAgoKL(n: number): string {
  const t = new Date(todayKL() + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - n);
  return t.toISOString().slice(0, 10);
}

function kiraStreak(tarikhSet: Set<string>): number {
  let mula = tarikhSet.has(todayKL()) ? 0 : tarikhSet.has(daysAgoKL(1)) ? 1 : -1;
  if (mula < 0) return 0;
  let streak = 0;
  while (tarikhSet.has(daysAgoKL(mula))) { streak++; mula++; }
  return streak;
}

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("tarikh")
        .eq("user_id", user.id)
        .order("tarikh", { ascending: false })
        .limit(60);
      setStreak(kiraStreak(new Set((data ?? []).map((r: any) => r.tarikh))));
    })();
  }, [user]);

  return streak;
}
