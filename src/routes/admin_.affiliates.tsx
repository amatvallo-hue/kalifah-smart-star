import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, MessageCircle, BarChart3, Wallet, Search, Trophy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin_/affiliates")({
  head: () => ({ meta: [{ title: "Admin Affiliates — Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliates,
});

type AffRow = {
  id: string;
  nama: string;
  email: string;
  ref_code: string;
  custom_ref_code?: string;
  avatar_url?: string | null;
  nama_bank: string;
  no_akaun_bank: string;
  nama_pemilik_bank?: string | null;
  no_telefon?: string | null;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
  platform_promosi?: string[] | null;
  last_klik_at?: string | null;
  created_at?: string | null;
};




function waLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "60" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

function statusBadge(r: AffRow): { label: string; className: string } {
  const now = Date.now();
  const createdAt = r.created_at ? new Date(r.created_at).getTime() : 0;
  const ageDays = createdAt ? (now - createdAt) / (1000 * 60 * 60 * 24) : Infinity;
  if (ageDays <= 7) {
    return { label: "🟡 Baru", className: "bg-amber-100 text-amber-700" };
  }
  if (!isInactive(r.last_klik_at)) {
    return { label: "🟢 Aktif", className: "bg-emerald-100 text-emerald-700" };
  }
  return { label: "🔴 Tidak Aktif", className: "bg-red-100 text-red-700" };
}

function rm(ringgit: number) {
  return `RM ${(ringgit ?? 0).toFixed(2)}`;
}

function fmtDateTimeMY(ts: string | null | undefined): string {
  if (!ts) return "Tiada";
  const d = new Date(ts);
  const months = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

function isInactive(ts: string | null | undefined): boolean {
  if (!ts) return true;
  const d = new Date(ts);
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 14;
}

function platformLabel(raw: string): { icon: string; label: string } {
  switch (raw) {
    case "WhatsApp/Telegram":
      return { icon: "📱", label: "WhatsApp" };
    case "Instagram/Facebook":
      return { icon: "📘", label: "Facebook" };
    case "TikTok":
      return { icon: "🎵", label: "TikTok" };
    case "Threads":
      return { icon: "🧵", label: "Threads" };
    case "Lain-lain":
      return { icon: "✨", label: "Lain-lain" };
    default:
      return { icon: "🔗", label: raw };
  }
}

function AdminAffiliates() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const [rows, setRows] = useState<AffRow[]>([]);
  const [jualanCounts, setJualanCounts] = useState<Record<string, number>>({});
  const [komisenBulanIni, setKomisenBulanIni] = useState(0);
  const [jualanBulanIniCount, setJualanBulanIniCount] = useState(0);
  const [klikHariIniCount, setKlikHariIniCount] = useState(0);
  const [jualanHariIniCount, setJualanHariIniCount] = useState(0);
  const [affiliateBaruHariIni, setAffiliateBaruHariIni] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prestasiAff, setPrestasiAff] = useState<AffRow | null>(null);
  const [prestasiData, setPrestasiData] = useState<{ date: string; klik: number; jualan: number; komisen: number }[] | null>(null);
  const [prestasiLoading, setPrestasiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"semua" | "aktif" | "belum_aktif" | "ada_pending" | "tiada_jualan" | "top_seller" | "baru_daftar">("semua");



  const openPrestasi = async (r: AffRow) => {
    setPrestasiAff(r);
    setPrestasiData(null);
    setPrestasiLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [klikRes, jualRes] = await Promise.all([
      supabase.from("affiliate_klik_log").select("created_at").eq("affiliate_id", r.id).gte("created_at", sinceIso),
      supabase.from("affiliate_jualan").select("created_at, komisyen").eq("affiliate_id", r.id).gte("created_at", sinceIso),
    ]);

    const buckets = new Map<string, { date: string; klik: number; jualan: number; komisen: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, klik: 0, jualan: 0, komisen: 0 });
    }
    for (const row of (klikRes.data ?? []) as { created_at: string }[]) {
      const k = row.created_at.slice(0, 10);
      const b = buckets.get(k);
      if (b) b.klik += 1;
    }
    for (const row of (jualRes.data ?? []) as { created_at: string; komisyen: number | null }[]) {
      const k = row.created_at.slice(0, 10);
      const b = buckets.get(k);
      if (b) {
        b.jualan += 1;
        b.komisen += Number(row.komisyen ?? 0);
      }
    }
    setPrestasiData(Array.from(buckets.values()));
    setPrestasiLoading(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: affData } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      const affiliates = (affData ?? []) as AffRow[];
      setRows(affiliates);

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      setAffiliateBaruHariIni(
        affiliates.filter((a) => {
          const c = (a as unknown as { created_at?: string }).created_at;
          return c ? c >= todayStart : false;
        }).length,
      );

      if (affiliates.length > 0) {
        const ids = affiliates.map((a) => a.id);
        const { data: jualanData } = await supabase
          .from("affiliate_jualan")
          .select("affiliate_id")
          .in("affiliate_id", ids)
          .gte("created_at", firstDay);

        const counts: Record<string, number> = {};
        for (const j of (jualanData ?? []) as { affiliate_id: string }[]) {
          counts[j.affiliate_id] = (counts[j.affiliate_id] || 0) + 1;
        }
        setJualanCounts(counts);
      }

      const { data: jBulanAll } = await supabase
        .from("affiliate_jualan")
        .select("komisyen")
        .gte("created_at", firstDay);
      const jBulanRows = (jBulanAll ?? []) as { komisyen: number | null }[];
      setJualanBulanIniCount(jBulanRows.length);
      setKomisenBulanIni(
        jBulanRows.reduce((acc, r) => acc + Number(r.komisyen ?? 0), 0),
      );

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
  }, []);

  const aktifCount = useMemo(
    () => rows.filter((r) => !isInactive(r.last_klik_at)).length,
    [rows],
  );
  const conversionHariIni =
    klikHariIniCount > 0
      ? ((jualanHariIniCount / klikHariIniCount) * 100).toFixed(1) + "%"
      : "0%";

  const totals = useMemo(() => {
    const totalAffiliates = rows.length;
    const totalKomisyen = rows.reduce((sum, r) => sum + (r.total_komisyen ?? 0), 0);
    const totalDibayar = rows.reduce((sum, r) => sum + (r.total_dibayar ?? 0), 0);
    const belumDibayar = totalKomisyen - totalDibayar;
    return { totalAffiliates, totalKomisyen, totalDibayar, belumDibayar };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const topSellerIds = new Set(
      [...rows]
        .filter((r) => (r.total_jualan ?? 0) > 0)
        .sort((a, b) => (b.total_jualan ?? 0) - (a.total_jualan ?? 0))
        .slice(0, 3)
        .map((r) => r.id),
    );
    const now = Date.now();
    return rows.filter((r) => {
      if (q) {
        const code = (r.custom_ref_code ?? r.ref_code ?? "").toLowerCase();
        const hay = `${r.nama ?? ""} ${r.email ?? ""} ${code}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const createdAt = r.created_at ? new Date(r.created_at).getTime() : 0;
      const ageDays = createdAt ? (now - createdAt) / (1000 * 60 * 60 * 24) : Infinity;
      const isBaru = ageDays <= 7;
      switch (filterMode) {
        case "semua": return true;
        case "aktif": return !isInactive(r.last_klik_at) && !isBaru;
        case "belum_aktif": return isInactive(r.last_klik_at) && !isBaru;
        case "ada_pending": return (r.total_komisyen ?? 0) - (r.total_dibayar ?? 0) > 0;
        case "tiada_jualan": return (r.total_jualan ?? 0) === 0;
        case "top_seller": return topSellerIds.has(r.id);
        case "baru_daftar": return isBaru;
        default: return true;
      }
    });
  }, [rows, searchQuery, filterMode]);

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
}
  }, [rows]);

  const markPaid = async (row: AffRow) => {
    const baki = Number(row.total_komisyen || 0) - Number(row.total_dibayar || 0);
    if (baki <= 0) {
      window.alert("Tiada baki belum dibayar untuk affiliate ini.");
      return;
    }
    if (!window.confirm(`Sahkan bayaran RM${baki.toFixed(2)} kepada ${row.nama}?`)) {
      return;
    }
    await supabase
      .from("affiliates")
      .update({ total_dibayar: row.total_komisyen })
      .eq("id", row.id);
    await supabase
      .from("affiliate_jualan")
      .update({ status_bayar: "dibayar" })
      .eq("affiliate_id", row.id)
      .eq("status_bayar", "belum_dibayar");
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, total_dibayar: Number(r.total_komisyen || 0) }
          : r,
      ),
    );
  };

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
      <h1 className="text-3xl font-extrabold">Admin — Affiliates</h1>
      <p className="mt-1 text-muted-foreground">Senarai semua affiliate dan komisyen mereka.</p>

      {/* Quick nav */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/admin/challenge"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          🏆 Urus Challenge Bulanan
        </Link>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-muted"
        >
          ← Kembali ke Admin
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="👥 Affiliate Aktif" value={`${aktifCount} / ${rows.length}`} />
        <StatCard label="💰 Komisen Bulan Ini" value={rm(komisenBulanIni)} />
        <StatCard label="📚 Jualan Bulan Ini" value={String(jualanBulanIniCount)} />
        <StatCard label="⏳ Pending Payout" value={rm(totals.belumDibayar)} highlight />
      </div>

      {/* Prestasi Hari Ini */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-extrabold">Prestasi Hari Ini</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Klik Hari Ini" value={String(klikHariIniCount)} />
          <StatCard label="Conversion" value={conversionHariIni} />
          <StatCard label="Affiliate Baru" value={String(affiliateBaruHariIni)} />
        </div>
      </div>

      {/* Search + filter */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari affiliate..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Menunjukkan {filteredRows.length} daripada {rows.length} affiliate
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["semua", "Semua"],
            ["aktif", "🟢 Aktif"],
            ["belum_aktif", "🔴 Belum Aktif"],
            ["ada_pending", "⏳ Ada Pending"],
            ["tiada_jualan", "📭 Tiada Jualan"],
            ["top_seller", "🏆 Top Seller"],
            ["baru_daftar", "🟡 Baru Daftar"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterMode(key)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                filterMode === key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Klik</TableHead>
              <TableHead>Klik Terakhir</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Platform Promosi</TableHead>
              <TableHead className="text-right">Lifetime (Klik / Jualan / Conv%)</TableHead>
              <TableHead className="text-right">Jualan Bulan Ini</TableHead>
              <TableHead className="text-right">Komisyen</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-6 text-center text-muted-foreground">
                  {rows.length === 0 ? "Tiada affiliate berdaftar lagi." : "Tiada affiliate sepadan dengan carian/tapisan."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      to="/admin_/affiliates/$id"
                      params={{ id: r.id }}
                      className="group flex items-center gap-3"
                    >
                      {r.avatar_url ? (
                        <img
                          src={r.avatar_url}
                          alt={r.nama}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                          {r.nama.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary group-hover:underline">{r.nama}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.custom_ref_code ?? r.ref_code}
                        </span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const s = statusBadge(r);
                      return (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.className}`}>
                          {s.label}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell className="text-right">{r.total_klik ?? 0}</TableCell>
                  <TableCell>
                    <span className={isInactive(r.last_klik_at) ? "text-amber-600" : "text-emerald-600"}>
                      {fmtDateTimeMY(r.last_klik_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.nama_bank} {r.no_akaun_bank}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(r.platform_promosi ?? []).map((p) => {
                        const mapped = platformLabel(p);
                        return (
                          <span
                            key={p}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {mapped.icon} {mapped.label}
                          </span>
                        );
                      })}
                      {(!r.platform_promosi || r.platform_promosi.length === 0) && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const k = r.total_klik ?? 0;
                      const j = r.total_jualan ?? 0;
                      const conv = k > 0 ? ((j / k) * 100).toFixed(1) + "%" : "0%";
                      return (
                        <div className="flex flex-col items-end text-xs">
                          <span><span className="text-muted-foreground">Klik:</span> <span className="font-bold">{k}</span></span>
                          <span><span className="text-muted-foreground">Jualan:</span> <span className="font-bold">{j}</span></span>
                          <span><span className="text-muted-foreground">Conv:</span> <span className="font-bold text-emerald-700">{conv}</span></span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">{jualanCounts[r.id] ?? 0}</TableCell>
                  <TableCell className="text-right">
                    RM {Number(r.total_komisyen).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    RM {Number(r.total_dibayar).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const wa = waLink(r.no_telefon);
                      return (
                        <div className="flex gap-1">

                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`WhatsApp ${r.no_telefon}`}
                              className="rounded border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Tiada nombor telefon"
                              className="cursor-not-allowed rounded border border-border bg-muted p-2 text-muted-foreground opacity-50"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Prestasi 30 hari"
                            onClick={() => openPrestasi(r)}
                            className="rounded border border-sky-200 bg-sky-50 p-2 text-sky-700 hover:bg-sky-100"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => markPaid(r)}
                            title="Tandakan Dibayar"
                            className="inline-flex items-center gap-1 rounded border border-amber-600 bg-amber-600 px-2 py-1 text-xs font-bold text-white hover:bg-amber-700"
                          >
                            <Wallet className="h-4 w-4" /> Bayar
                          </button>
                        </div>
                      );
                    })()}
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>




      <Dialog open={!!prestasiAff} onOpenChange={(o) => { if (!o) { setPrestasiAff(null); setPrestasiData(null); } }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {prestasiAff && (
            <>
              <DialogHeader>
                <DialogTitle>Prestasi 30 Hari — {prestasiAff.nama}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {prestasiLoading || !prestasiData ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : prestasiData.every((d) => d.klik === 0 && d.jualan === 0 && d.komisen === 0) ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    Tiada data 30 hari lepas
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Klik & Jualan (harian)</div>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={prestasiData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="klik" stroke="#0ea5e9" name="Klik" dot={false} />
                          <Line type="monotone" dataKey="jualan" stroke="#10b981" name="Jualan" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Komisen Harian (RM)</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={prestasiData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="komisen" fill="#f59e0b" name="Komisen (RM)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setPrestasiAff(null); setPrestasiData(null); }}
                  className="rounded border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted"
                >
                  Tutup
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
