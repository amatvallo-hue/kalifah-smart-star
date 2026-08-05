import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin_/funnel")({
  head: () => ({
    meta: [
      { title: "Funnel Hari Ini — Admin Kalifah.my" },
      { name: "description", content: "Ringkasan funnel pengguna hari ini." },
    ],
  }),
  ssr: false,
  component: AdminFunnelPage,
});

const LANGKAH: { event: string; label: string }[] = [
  { event: "signup", label: "Signup" },
  { event: "tambah_anak", label: "Tambah Anak" },
  { event: "mpt4_mula", label: "MPT4 Mula" },
  { event: "mpt4_tamat", label: "MPT4 Tamat" },
  { event: "plan_day1_viewed", label: "Hari 1 Dibuka" },
  { event: "plan_unlock_clicked", label: "Klik Unlock" },
  { event: "payment_success", label: "Bayar" },
];

function tarikhMalaysia(): string {
  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function AdminFunnelPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [kiraan, setKiraan] = useState<Record<string, number>>({});
  const [memuat, setMemuat] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if ((data as { role?: string } | null)?.role === "admin") {
        setIsAdmin(true);
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const muatFunnel = useCallback(async () => {
    setMemuat(true);
    setRalat(null);
    const { data, error } = await supabase.rpc("get_funnel_hari_ini");
    if (error) {
      setRalat(error.message);
    } else {
      const rows = (data ?? []) as { event_name: string; jumlah: number }[];
      const map: Record<string, number> = {};
      for (const r of rows) map[r.event_name] = Number(r.jumlah) || 0;
      setKiraan(map);
    }
    setMemuat(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void muatFunnel();
  }, [isAdmin, muatFunnel]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="mt-3 text-muted-foreground">Akses ditolak.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link to="/admin" className="text-sm font-bold text-primary hover:underline">
          ← Admin Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Hari Ini</h1>
            <p className="text-sm text-muted-foreground">{tarikhMalaysia()} (waktu Malaysia)</p>
          </div>
          <button
            type="button"
            onClick={() => void muatFunnel()}
            disabled={memuat}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
          >
            🔄 Refresh
          </button>
        </div>

        {ralat && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {ralat}
          </p>
        )}

        <div className="mt-6 divide-y divide-border rounded-md border border-border">
          {LANGKAH.map((l) => (
            <div key={l.event} className="flex items-baseline justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{l.label}</span>
              <span className="font-display text-3xl font-bold text-foreground">
                {memuat ? "—" : (kiraan[l.event] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
