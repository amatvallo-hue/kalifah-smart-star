import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, Trophy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminAffiliateNav } from "@/components/AdminAffiliateNav";

export const Route = createFileRoute("/admin_/affiliates/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Affiliate — Admin Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliatesDashboard,
});

type AffRow = {
  id: string;
  nama: string;
  avatar_url?: string | null;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
  last_klik_at?: string | null;
  created_at?: string | null;
};

function rm(ringgit: number) {
  return `RM ${(ringgit ?? 0).toFixed(2)}`;
}

function isInactive(ts: string | null | undefined): boolean {
  if (!ts) return true;
  const d = new Date(ts);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 14;
}

function AdminAffiliatesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [rows, setRows] = useState<AffRow[]>([]);
  const [komisenBulanIni, setKomisenBulanIni] = useState(0);
  const [jualanBulanIniCount, setJualanBulanIniCount] = useState(0);
  const [klikHariIniCount, setKlikHariIniCount] = useState(0);
  const [jualanHariIniCount, setJualanHariIniCount] = useState(0);
  const [affiliateBaruHariIni, setAffiliateBaruHariIni] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data: affData } = await supabase
        .from("affiliates")
        .select("id, nama, avatar_url, total_klik, total_jualan, total_komisyen, total_dibayar, last_klik_at, created_at")
        .order("created_at", { ascending: false });

      const affiliates = (affData ?? []) as AffRow[];
      setRows(affiliates);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      setAffiliateBaruHariIni(
        affiliates.filter((a) => (a.created_at ? a.created_at >= todayStart : false)).length,
      );

      const { data: jBulanAll } = await supabase
        .from("affiliate_jualan")
        .select("komisyen")
        .gte("created_at", firstDay);
      const jBulanRows = (jBulanAll ?? []) as { komisyen: number | null }[];
      setJualanBulanIniCount(jBulanRows.length);
      setKomisenBulanIni(jBulanRows.reduce((acc, r) => acc + Number(r.komisyen ?? 0), 0));

      const { count: klikToday } = await supabase
        .from("affiliate_klik_log")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);
      setKlikHariIniCount(klikToday ?? 0);

      const { count: jualanToday } = await supabase
        .from("affiliate_jualan")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart);
      setJualanHariIniCount(jualanToday ?? 0);

      setLoading(false);
    })();
  }, [isAdmin]);

  const aktifCount = useMemo(
    () => rows.filter((r) => !isInactive(r.last_klik_at)).length,
    [rows],
  );
  const conversionHariIni =
    klikHariIniCount > 0
      ? ((jualanHariIniCount / klikHariIniCount) * 100).toFixed(1) + "%"
      : "0%";

  const totals = useMemo(() => {
    const totalKomisyen = rows.reduce((sum, r) => sum + (r.total_komisyen ?? 0), 0);
    const totalDibayar = rows.reduce((sum, r) => sum + (r.total_dibayar ?? 0), 0);
    return { belumDibayar: totalKomisyen - totalDibayar };
  }, [rows]);

  const topPerformer = useMemo(() => {
    if (rows.length === 0) return null;
    const champ = [...rows].sort((a, b) => (b.total_komisyen ?? 0) - (a.total_komisyen ?? 0))[0];
    if ((champ.total_komisyen ?? 0) === 0) return null;
    return champ;
  }, [rows]);

  const needAttention = useMemo(() => {
    return [...rows]
      .filter((r) => (r.total_klik ?? 0) > 0 && (r.total_jualan ?? 0) === 0)
      .sort((a, b) => (b.total_klik ?? 0) - (a.total_klik ?? 0))
      .slice(0, 3);
  }, [rows]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="mt-3 text-muted-foreground">Akses ditolak.</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Memuat…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <AdminAffiliateNav />
      <h1 className="text-3xl font-extrabold">Dashboard Affiliate</h1>
      <p className="mt-1 text-muted-foreground">Ringkasan prestasi keseluruhan program affiliate.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="👥 Affiliate Aktif" value={`${aktifCount} / ${rows.length}`} />
        <StatCard label="💰 Komisen Bulan Ini" value={rm(komisenBulanIni)} />
        <StatCard label="📚 Jualan Bulan Ini" value={String(jualanBulanIniCount)} />
        <StatCard label="⏳ Pending Payout" value={rm(totals.belumDibayar)} highlight />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-extrabold">Prestasi Hari Ini</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Klik Hari Ini" value={String(klikHariIniCount)} />
          <StatCard label="Conversion" value={conversionHariIni} />
          <StatCard label="Affiliate Baru" value={String(affiliateBaruHariIni)} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-100 to-yellow-50 p-5 shadow-soft">
          <div className="absolute right-3 top-3 text-4xl opacity-30">🏆</div>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold text-amber-900">
            <Trophy className="h-5 w-5 text-amber-600" /> Top Performer
          </h2>
          {topPerformer ? (
            <div className="flex items-start gap-4">
              {topPerformer.avatar_url ? (
                <img
                  src={topPerformer.avatar_url}
                  alt={topPerformer.nama}
                  className="h-14 w-14 rounded-full border-2 border-amber-300 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-200 font-bold text-amber-800 shadow-sm">
                  {topPerformer.nama.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="font-display text-xl font-extrabold text-amber-950">{topPerformer.nama}</div>
                <div className="mt-1 font-display text-4xl font-extrabold text-amber-700">
                  {rm(topPerformer.total_komisyen)}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-amber-800">
                  <span className="rounded-full bg-white/60 px-2.5 py-0.5 font-bold">
                    {topPerformer.total_jualan ?? 0} jualan
                  </span>
                  <span className="rounded-full bg-white/60 px-2.5 py-0.5 font-bold">
                    {topPerformer.total_klik > 0
                      ? (((topPerformer.total_jualan ?? 0) / topPerformer.total_klik) * 100).toFixed(1) + "%"
                      : "0%"} conversion
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-amber-800/80">
              <Trophy className="mb-2 h-8 w-8 opacity-40" />
              <p className="font-bold">Belum ada jualan lagi</p>
              <p className="text-sm opacity-80">Top performer akan muncul selepas affiliate mula menjana komisen.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-card p-5 shadow-soft">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-extrabold text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Perlu Perhatian
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Klik tinggi tapi tiada jualan — mungkin isu landing page, follow-up, atau kualiti traffic.
          </p>
          {needAttention.length > 0 ? (
            <ul className="space-y-3">
              {needAttention.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                  <div className="flex items-center gap-3">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.nama} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-800">
                        {r.nama.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-foreground">{r.nama}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-700">{r.total_klik ?? 0} klik</div>
                    <div className="text-xs font-bold text-red-600">0 jualan</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <AlertTriangle className="mb-2 h-8 w-8 opacity-30" />
              <p className="font-bold">Tiada affiliate perlu perhatian sekarang 👍</p>
              <p className="text-sm">Semua affiliate yang ada klik sudah menjana sekurang-kurangnya satu jualan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}
