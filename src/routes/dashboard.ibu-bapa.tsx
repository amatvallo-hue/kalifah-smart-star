import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  PlusCircle,
  Target,
  Trash2,
  TrendingUp,
  Users,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SUBJEK_LIST as ALL_SUBJEK, DARJAH_LIST } from "@/lib/curriculum";
// Ibu bapa tidak boleh nampak Jawi
const SUBJEK_LIST = ALL_SUBJEK.filter((s) => s.id !== "jawi");
import { padamAnak, senaraikanAnak, type ChildProfile } from "@/lib/parent";
import { ciptaAkaunAnak, normalizeUsername, CHILD_EMAIL_DOMAIN } from "@/lib/child-auth";

export const Route = createFileRoute("/dashboard/ibu-bapa")({
  head: () => ({ meta: [{ title: "Dashboard Ibu Bapa — Kalifah.my" }] }),
  ssr: false,
  component: ParentDashboard,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

interface ProgressRow {
  id: string;
  darjah: string;
  subjek: string;
  aktiviti: string;
  markah: number;
  jumlah_soalan: number;
  peratus: number;
  masa_ambil: number;
  created_at: string;
  topik?: string | null;
}
interface StatsRow {
  tarikh: string;
  soalan_dijawab: number;
  masa_belajar: number;
  bab_selesai: number;
}
interface BadgeRow {
  id: string;
  kod: string;
  nama: string;
  ikon: string;
  created_at: string;
}

function todayKL(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}
function daysAgoKL(n: number): string {
  const t = new Date(todayKL() + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - n);
  return t.toISOString().slice(0, 10);
}
function kiraStreak(rows: StatsRow[]): number {
  const set = new Set(rows.map((r) => r.tarikh));
  let mula = set.has(todayKL()) ? 0 : set.has(daysAgoKL(1)) ? 1 : -1;
  if (mula < 0) return 0;
  let s = 0;
  while (set.has(daysAgoKL(mula))) {
    s++;
    mula++;
  }
  return s;
}
function formatMasa(minit: number): string {
  if (minit < 60) return `${minit} min`;
  const jam = Math.floor(minit / 60);
  const sisa = minit % 60;
  return sisa === 0 ? `${jam} jam` : `${jam} jam ${sisa} min`;
}

function parseIsoUTC(iso: string): Date {
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso.replace(" ", "T") + "Z");
}
function formatTarikh(iso: string): string {
  const d = parseIsoUTC(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.round(diff / 60000);
  if (min < 1) return "Sebentar tadi";
  if (min < 60) return `${min} minit lalu`;
  const jam = Math.round(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  return `${hari} hari lalu`;
}

const AKTIVITI_LABEL: Record<string, string> = {
  kuiz: "Kuiz",
  latihan: "Latihan Bertulis",
  "latih-tubi": "Latih Tubi",
  nota: "Nota Ringkas",
  "game-race": "Quiz Race",
  "game-cari": "Cari Perkataan",
  "game-betul": "Betul atau Salah",
  "game-padan": "Padankan",
  "game-susun": "Susun Ayat",
};

const HARI_PENDEK = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];

function TrendChart({ stats }: { stats: StatsRow[] }) {
  const hari = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const tarikh = daysAgoKL(6 - i);
      const row = stats.find((s) => s.tarikh === tarikh);
      const d = new Date(tarikh + "T00:00:00Z");
      return {
        tarikh,
        label: HARI_PENDEK[d.getUTCDay()],
        soalan: row?.soalan_dijawab ?? 0,
        isToday: i === 6,
      };
    });
  }, [stats]);

  const max = Math.max(...hari.map((h) => h.soalan), 1);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-end justify-between gap-2 h-28">
        {hari.map((h) => (
          <div key={h.tarikh} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              {h.soalan > 0 ? h.soalan : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: "72px" }}>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(4, (h.soalan / max) * 72)}px`,
                  backgroundColor: h.isToday ? HIJAU : h.soalan > 0 ? `${HIJAU}88` : `${HIJAU}1a`,
                }}
              />
            </div>
            <span
              className="text-[10px] font-extrabold"
              style={{ color: h.isToday ? HIJAU : "hsl(var(--muted-foreground))" }}
            >
              {h.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Soalan dijawab 7 hari lepas
      </p>
    </div>
  );
}

interface TopikAgg {
  subjek: string;
  darjah: string;
  topik: string;
  markah: number;
  jumlah: number;
  peratus: number;
  created_at: string;
}

function grupTopik(progress: ProgressRow[]): Map<string, TopikAgg[]> {
  const rows = progress.filter((r) => r.aktiviti === "latih-tubi" && r.topik);
  // subjek -> topik -> agg
  const bySubjek = new Map<string, Map<string, TopikAgg>>();
  rows.forEach((r) => {
    const topik = r.topik as string;
    if (!bySubjek.has(r.subjek)) bySubjek.set(r.subjek, new Map());
    const tmap = bySubjek.get(r.subjek)!;
    const cur = tmap.get(topik);
    const markah = Number(r.markah ?? 0);
    const jumlah = Number(r.jumlah_soalan ?? 0);
    if (cur) {
      cur.markah += markah;
      cur.jumlah += jumlah;
      if (r.created_at > cur.created_at) cur.created_at = r.created_at;
    } else {
      tmap.set(topik, {
        subjek: r.subjek,
        darjah: r.darjah,
        topik,
        markah,
        jumlah,
        peratus: 0,
        created_at: r.created_at,
      });
    }
  });
  const out = new Map<string, TopikAgg[]>();
  bySubjek.forEach((tmap, subjek) => {
    const arr = Array.from(tmap.values()).map((v) => ({
      ...v,
      peratus: v.jumlah > 0 ? Math.round((v.markah / v.jumlah) * 100) : 0,
    }));
    out.set(subjek, arr);
  });
  return out;
}

function warnaTopik(p: number): string {
  if (p >= 80) return HIJAU;
  if (p < 60) return "#dc2626";
  return "#7a5300";
}

function ParentDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [anakList, setAnakList] = useState<ChildProfile[]>([]);
  const [aktifId, setAktifId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState<ChildProfile | null>(null);

  const isChild = !!user?.email?.includes(CHILD_EMAIL_DOMAIN);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    else if (!loading && isChild) navigate({ to: "/dashboard/progress" });
  }, [loading, user, isChild, navigate]);

  useEffect(() => {
    if (!user) return;
    senaraikanAnak().then((list) => {
      setAnakList(list);
      if (!aktifId && list.length > 0) setAktifId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const anakAktif = anakList.find((a) => a.id === aktifId) ?? null;
  const anakUserId = anakAktif?.child_user_id ?? null;

  async function fetchAnakData(uid: string, showSpinner = true) {
    if (showSpinner) setFetching(true);
    const [{ data: p, error: pError }, { data: s, error: sError }, { data: b, error: bError }] = await Promise.all([
      supabase
        .from("user_progress")
        .select("id, darjah, subjek, aktiviti, markah, jumlah_soalan, peratus, masa_ambil, created_at, topik")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_stats")
        .select("tarikh, soalan_dijawab, masa_belajar, bab_selesai")
        .eq("user_id", uid)
        .order("tarikh", { ascending: false })
        .limit(60),
      supabase
        .from("user_badges")
        .select("id, kod, nama, ikon, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
    ]);
    console.log("[ParentDashboard] fetchAnakData", {
      user_id: uid,
      user_progress_rows: p?.length ?? 0,
      user_stats_rows: s?.length ?? 0,
      user_badges_rows: b?.length ?? 0,
      errors: {
        user_progress: pError,
        user_stats: sError,
        user_badges: bError,
      },
    });
    setProgress((p ?? []) as ProgressRow[]);
    setStats((s ?? []) as StatsRow[]);
    setBadges((b ?? []) as BadgeRow[]);
    if (showSpinner) setFetching(false);
  }

  async function refreshAnak() {
    const list = await senaraikanAnak();
    setAnakList(list);
    const nextAktifId = aktifId ?? list[0]?.id ?? null;
    if (!aktifId && list.length > 0) setAktifId(list[0].id);
    const uid =
      list.find((a) => a.id === nextAktifId)?.child_user_id ?? anakUserId ?? null;
    if (uid) {
      await fetchAnakData(uid, true);
    } else {
      // No linked child yet — clear stale data so UI reflects reality
      setProgress([]);
      setStats([]);
      setBadges([]);
    }
  }

  useEffect(() => {
    if (!anakUserId) {
      setProgress([]);
      setStats([]);
      setBadges([]);
      return;
    }
    let cancelled = false;
    (async () => {
      await fetchAnakData(anakUserId, true);
      if (cancelled) return;
    })();

    // Realtime: auto-refresh when new progress/stats/badges arrive for this child
    const channel = supabase
      .channel(`anak-${anakUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_progress", filter: `user_id=eq.${anakUserId}` },
        () => { if (!cancelled) fetchAnakData(anakUserId, false); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${anakUserId}` },
        () => { if (!cancelled) fetchAnakData(anakUserId, false); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_badges", filter: `user_id=eq.${anakUserId}` },
        () => { if (!cancelled) fetchAnakData(anakUserId, false); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anakUserId]);

  // ── Pengiraan ringkasan
  const tarikhMingguIni = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) arr.push(daysAgoKL(i));
    return new Set(arr);
  }, []);
  const tarikhBulanIni = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 30; i++) arr.push(daysAgoKL(i));
    return new Set(arr);
  }, []);

  const minggu = useMemo(() => {
    const p = progress.filter((r) => tarikhMingguIni.has(r.created_at.slice(0, 10)));
    const s = stats.filter((r) => tarikhMingguIni.has(r.tarikh));
    const soalanStats = s.reduce((a, r) => a + (r.soalan_dijawab ?? 0), 0);
    const masaStats = s.reduce((a, r) => a + (r.masa_belajar ?? 0), 0);
    const soalanProg = p.reduce((a, r) => a + (r.jumlah_soalan ?? 0), 0);
    const masaProg = Math.round(p.reduce((a, r) => a + (r.masa_ambil ?? 0), 0) / 60);
    const soalan = Math.max(soalanStats, soalanProg);
    const masa = Math.max(masaStats, masaProg);
    const bab = Math.max(s.reduce((a, r) => a + (r.bab_selesai ?? 0), 0), p.length);
    const peratus = p.length === 0 ? 0 : Math.round(p.reduce((a, r) => a + Number(r.peratus), 0) / p.length);
    return { soalan, masa, bab, peratus };
  }, [progress, stats, tarikhMingguIni]);

  const bulan = useMemo(() => {
    const p = progress.filter((r) => tarikhBulanIni.has(r.created_at.slice(0, 10)));
    const s = stats.filter((r) => tarikhBulanIni.has(r.tarikh));
    const soalanStats = s.reduce((a, r) => a + (r.soalan_dijawab ?? 0), 0);
    const masaStats = s.reduce((a, r) => a + (r.masa_belajar ?? 0), 0);
    const soalanProg = p.reduce((a, r) => a + (r.jumlah_soalan ?? 0), 0);
    const masaProg = Math.round(p.reduce((a, r) => a + (r.masa_ambil ?? 0), 0) / 60);
    const soalan = Math.max(soalanStats, soalanProg);
    const masa = Math.max(masaStats, masaProg);

    const perSubjek = new Map<string, { jumlah: number; bil: number }>();
    p.forEach((r) => {
      const cur = perSubjek.get(r.subjek) ?? { jumlah: 0, bil: 0 };
      cur.jumlah += Number(r.peratus);
      cur.bil += 1;
      perSubjek.set(r.subjek, cur);
    });
    const ranked = Array.from(perSubjek.entries())
      .map(([sj, v]) => ({ subjek: sj, purata: Math.round(v.jumlah / v.bil), bil: v.bil }))
      .sort((a, b) => b.purata - a.purata);
    const terkuat = ranked[0] ?? null;
    const lemah = ranked.length > 0 ? ranked[ranked.length - 1] : null;
    return { soalan, masa, terkuat, lemah };
  }, [progress, stats, tarikhBulanIni]);

  const kemajuanSubjek = useMemo(() => {
    return SUBJEK_LIST.map((sj) => {
      const rows = progress.filter((p) => p.subjek === sj.id);
      const aktivitiUnik = new Set(rows.map((r) => r.aktiviti)).size;
      const peratusSiap = Math.min(100, Math.round((aktivitiUnik / 5) * 100));
      const purata = rows.length === 0 ? 0 : Math.round(rows.reduce((a, r) => a + Number(r.peratus), 0) / rows.length);
      const terkini = rows[0] ?? null;
      return { subjek: sj, peratusSiap, purata, terkini, jumlah: rows.length };
    });
  }, [progress]);

  const streak = kiraStreak(stats);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={badges.length} userName={user.email?.split("@")[0]} onLogout={handleLogout} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          to="/pilih-darjah"
          className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Utama
        </Link>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold text-foreground">Dashboard Ibu Bapa</h1>
              <p className="text-sm text-muted-foreground">Pantau pembelajaran anak anda dengan mudah.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={refreshAnak}
              className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 font-display text-sm font-extrabold text-muted-foreground shadow-soft hover:text-foreground"
            >
              Muat Semula
            </button>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              <PlusCircle className="h-4 w-4" /> Tambah Anak
            </button>
          </div>
        </div>

        {/* Borang tambah anak (cipta akaun + auto-link) */}
        {showAdd && (
          <FormTambahAnak
            onAdded={async () => {
              const list = await senaraikanAnak();
              setAnakList(list);
              setShowAdd(false);
              // Fokus pada anak yang baru ditambah (terakhir mengikut created_at asc)
              if (list.length > 0) setAktifId(list[list.length - 1].id);
            }}
          />
        )}


        {/* Pemilih anak */}
        {anakList.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
            <p className="font-display text-lg font-extrabold text-foreground">Belum ada profil anak</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Klik <b>Tambah Anak</b> untuk mula. Anda akan dapat kod jemputan untuk diberikan kepada anak.
            </p>
          </div>
        ) : (
          <>
            <section className="mt-6 flex flex-wrap gap-2">
              {anakList.map((a) => {
                const aktif = a.id === aktifId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAktifId(a.id)}
                    className="rounded-full px-4 py-2 font-display text-sm font-extrabold transition"
                    style={{
                      backgroundColor: aktif ? HIJAU : `${HIJAU}14`,
                      color: aktif ? "#fff" : HIJAU,
                      border: `2px solid ${aktif ? HIJAU : `${HIJAU}33`}`,
                    }}
                  >
                    {a.nama} • D{a.darjah}
                    {!a.child_user_id && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Belum link</span>
                    )}
                  </button>
                );
              })}
            </section>

            {/* Reset Password Anak */}
            <Seksyen tajuk="Reset Password Anak" ikon={<KeyRound className="h-5 w-5" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {anakList.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-soft"
                    style={{ border: `2px solid ${HIJAU}1f` }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-extrabold text-foreground">{a.nama}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{a.username ?? "—"} • Darjah {a.darjah}
                      </p>
                    </div>
                    <button
                      onClick={() => setResetFor(a)}
                      disabled={!a.child_user_id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 font-display text-xs font-extrabold text-white shadow-soft disabled:opacity-50"
                      style={{ backgroundColor: HIJAU }}
                      title={!a.child_user_id ? "Anak belum dipautkan" : "Reset password anak"}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset Password
                    </button>
                  </div>
                ))}
              </div>
            </Seksyen>




            {anakAktif && anakAktif.child_user_id && (
              <>
                {fetching ? (
                  <div className="mt-6 rounded-3xl bg-card p-10 text-center shadow-card">
                    <p className="text-muted-foreground">Memuatkan data anak...</p>
                  </div>
                ) : (
                  <>
                    {/* MINGGU INI */}
                    <Seksyen tajuk="Minggu Ini" ikon={<Calendar className="h-5 w-5" />}>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Stat label="Soalan Dijawab" nilai={minggu.soalan} icon={<BookOpen className="h-5 w-5" />} warna={HIJAU} />
                        <Stat label="Ketepatan" nilai={`${minggu.peratus}%`} icon={<Target className="h-5 w-5" />} warna={EMAS} light />
                        <Stat label="Masa Belajar" nilai={formatMasa(minggu.masa)} icon={<Clock className="h-5 w-5" />} warna={HIJAU} light />
                        <Stat label="Bab Selesai" nilai={minggu.bab} icon={<TrendingUp className="h-5 w-5" />} warna={EMAS} />
                      </div>
                    </Seksyen>

                    {/* TREND 7 HARI */}
                    <Seksyen tajuk="Trend 7 Hari" ikon={<TrendingUp className="h-5 w-5" />}>
                      <TrendChart stats={stats} />
                    </Seksyen>

                    {/* BULAN INI */}
                    <Seksyen tajuk="Bulan Ini" ikon={<TrendingUp className="h-5 w-5" />}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid grid-cols-2 gap-3">
                          <Stat label="Jumlah Soalan" nilai={bulan.soalan} icon={<BookOpen className="h-5 w-5" />} warna={HIJAU} />
                          <Stat label="Jumlah Masa" nilai={formatMasa(bulan.masa)} icon={<Clock className="h-5 w-5" />} warna={EMAS} light />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <KadSubjekTrend label="Subjek Terkuat 💪" sj={bulan.terkuat} warna={HIJAU} />
                          <KadSubjekTrend label="Perlukan Perhatian ⚠️" sj={bulan.lemah && bulan.terkuat?.subjek !== bulan.lemah.subjek ? bulan.lemah : null} warna="#dc2626" />
                        </div>
                      </div>
                    </Seksyen>

                    {/* KEMAJUAN SUBJEK */}
                    <Seksyen tajuk="Kemajuan Subjek" ikon={<BookOpen className="h-5 w-5" />}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {kemajuanSubjek.map((k) => (
                          <div
                            key={k.subjek.id}
                            className="rounded-2xl bg-card p-4 shadow-soft"
                            style={{ border: `2px solid ${HIJAU}1f` }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-base font-extrabold text-foreground">{k.subjek.title}</h3>
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-extrabold"
                                style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}
                              >
                                ⭐ {k.purata}%
                              </span>
                            </div>
                            <div className="mt-2 h-3 overflow-hidden rounded-full" style={{ backgroundColor: `${HIJAU}1a` }}>
                              <div className="h-full transition-all" style={{ width: `${k.peratusSiap}%`, backgroundColor: HIJAU }} />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {k.peratusSiap}% siap • {k.jumlah} aktiviti
                              {k.terkini && (
                                <>
                                  {" "}
                                  • Terkini: <b>{k.terkini.markah}/{k.terkini.jumlah_soalan}</b>
                                </>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Seksyen>

                    {(() => {
                      const topikMap = grupTopik(progress);
                      if (topikMap.size === 0) return null;
                      return (
                        <Seksyen tajuk="Latih Tubi — Rekod Topik" ikon={<Target className="h-5 w-5" />}>
                          <div className="flex flex-col gap-4">
                            {Array.from(topikMap.entries()).map(([subjekId, rows]) => {
                              const sj = SUBJEK_LIST.find((s) => s.id === subjekId);
                              return (
                                <div key={subjekId}>
                                  <p className="mb-2 font-display text-sm font-extrabold text-foreground">
                                    {sj?.title ?? subjekId}
                                  </p>
                                  <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
                                    {rows.sort((a, b) => b.peratus - a.peratus).map((r, i) => {
                                      const warna = warnaTopik(r.peratus);
                                      return (
                                        <div
                                          key={r.topik}
                                          className="flex items-center justify-between gap-3 px-4 py-3"
                                          style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground">{r.topik}</p>
                                            <p className="text-xs text-muted-foreground">
                                              Darjah {r.darjah} • {r.jumlah} soalan dijawab • {formatTarikh(r.created_at)}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0">
                                            <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${HIJAU}1a` }}>
                                              <div
                                                className="h-full rounded-full"
                                                style={{ width: `${Math.min(100, r.peratus)}%`, backgroundColor: warna }}
                                              />
                                            </div>
                                            <div className="text-right w-16">
                                              <p className="font-display text-sm font-extrabold leading-tight" style={{ color: warna }}>
                                                {r.markah}/{r.jumlah}
                                              </p>
                                              <p className="text-[10px] font-bold leading-tight" style={{ color: warna }}>
                                                {r.peratus}%
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Seksyen>
                      );
                    })()}

                    {/* STREAK & LENCANA */}
                    <Seksyen tajuk="Streak & Lencana" ikon={<Flame className="h-5 w-5" />}>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Stat label="Streak Semasa" nilai={`${streak} hari 🔥`} icon={<Flame className="h-5 w-5" />} warna="#dc2626" />
                        <Stat label="Jumlah Lencana" nilai={badges.length} icon={<Award className="h-5 w-5" />} warna={EMAS} light />
                        <Stat label="Bab Disiapkan" nilai={stats.reduce((a, r) => a + r.bab_selesai, 0)} icon={<TrendingUp className="h-5 w-5" />} warna={HIJAU} />
                      </div>
                      {badges.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {badges.map((b) => (
                            <div
                              key={b.id}
                              className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-soft"
                              style={{ border: `2px solid ${EMAS}55` }}
                            >
                              <span className="text-xl leading-none">{b.ikon}</span>
                              <span className="font-display text-xs font-extrabold text-foreground">{b.nama}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Seksyen>

                    {/* AKTIVITI TERKINI */}
                    <Seksyen tajuk="Aktiviti Terkini" ikon={<BookOpen className="h-5 w-5" />}>
                      {progress.length === 0 ? (
                        <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
                          <p className="text-sm text-muted-foreground">Belum ada aktiviti direkodkan.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
                          {progress.slice(0, 10).map((row, i) => {
                            const sj = SUBJEK_LIST.find((s) => s.id === row.subjek);
                            const peratus = Number(row.peratus);
                            return (
                              <div
                                key={row.id}
                                className="flex items-center justify-between gap-3 p-4"
                                style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-display text-sm font-extrabold text-foreground">
                                    {sj?.title ?? row.subjek}
                                    <span className="ml-1 font-normal text-muted-foreground">
                                      • {AKTIVITI_LABEL[row.aktiviti] ?? row.aktiviti}
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Darjah {row.darjah} • {formatTarikh(row.created_at)}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p
                                    className="font-display text-lg font-extrabold"
                                    style={{ color: peratus >= 60 ? HIJAU : "#dc2626" }}
                                  >
                                    {row.markah}/{row.jumlah_soalan}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{Math.round(peratus)}%</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Seksyen>

                    <div className="mt-6 mb-12 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Padam profil ${anakAktif.nama}? Pautan ke akaun anak akan hilang.`)) return;
                          const ok = await padamAnak(anakAktif.id);
                          if (ok) {
                            const list = await senaraikanAnak();
                            setAnakList(list);
                            setAktifId(list[0]?.id ?? null);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Padam profil ini
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
      {resetFor && (
        <ResetPasswordModal child={resetFor} onClose={() => setResetFor(null)} />
      )}
    </div>
  );
}

function ResetPasswordModal({
  child,
  onClose,
}: {
  child: ChildProfile;
  onClose: () => void;
}) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw1.length < 6) {
      setErr("Password minimum 6 aksara.");
      return;
    }
    if (pw1 !== pw2) {
      setErr("Password tidak sepadan.");
      return;
    }
    if (!child.child_user_id) {
      setErr("Anak belum dipautkan.");
      return;
    }
    setLoading(true);
    try {
      // Get session — try refresh if null (mobile browsers sometimes lose session)
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn("[reset-child-password] no session, trying refresh");
        const refreshed = await supabase.auth.refreshSession();
        session = refreshed.data.session;
      }
      const token = session?.access_token;
      if (!token) {
        const msg = "Sesi tamat. Sila log masuk semula.";
        setErr(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const url =
        "https://pgpkqbdyxoejwvubluqq.supabase.co/functions/v1/reset-child-password";
      console.log("[reset-child-password] calling", url, {
        child_user_id: child.child_user_id,
        hasToken: !!token,
      });

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            child_user_id: child.child_user_id,
            new_password: pw1,
          }),
        });
      } catch (netErr) {
        console.error("[reset-child-password] network error", netErr);
        const msg = "Tiada sambungan internet. Cuba semula.";
        setErr(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const raw = await res.text();
      let data: { ok?: boolean; success?: boolean; error?: string; message?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        console.error("[reset-child-password] non-JSON response", res.status, raw);
      }
      console.log("[reset-child-password] response", res.status, "body:", raw);

      setLoading(false);
      const succeeded = res.ok && (data?.ok === true || data?.success === true || (data?.error == null && res.status === 200));
      if (!succeeded) {
        console.error("[reset-child-password] failed", res.status, raw);
        const msg = data?.error || data?.message || `Gagal reset password (HTTP ${res.status}).`;
        setErr(msg);
        toast.error(msg);
        return;
      }
      toast.success("Password berjaya ditukar!");
      onClose();
    } catch (e) {
      console.error("[reset-child-password] unexpected error", e);
      const msg = e instanceof Error ? e.message : "Ralat tidak dijangka.";
      setErr(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card"
      >
        <h3 className="font-display text-xl font-extrabold text-foreground">
          Reset Password — {child.nama}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Tetapkan password baharu untuk akaun <b>@{child.username ?? "—"}</b>.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Password Baharu</span>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="Minimum 6 aksara"
            minLength={6}
            required
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Sahkan Password</span>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Taip semula password"
            minLength={6}
            required
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          />
        </label>
        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-muted px-4 py-2.5 font-display text-sm font-extrabold text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
            style={{ backgroundColor: HIJAU }}
          >
            {loading ? "Menukar..." : "Sahkan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormTambahAnak({ onAdded }: { onAdded: () => void }) {
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [darjah, setDarjah] = useState("1");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const unameLive = normalizeUsername(username);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    const res = await ciptaAkaunAnak(nama, username, password, darjah);
    setLoading(false);
    if (!res.ok) {
      setErr(res.mesej ?? "Gagal mencipta akaun anak.");
      return;
    }
    setOk(`Akaun ${nama} berjaya dicipta! Anak boleh log masuk dengan username: ${unameLive}`);
    setNama("");
    setUsername("");
    setPassword("");
    onAdded();
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-card p-5 shadow-card" style={{ border: `2px solid ${HIJAU}33` }}>
      <h3 className="font-display text-lg font-extrabold text-foreground">Cipta Akaun Anak</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Anak akan log masuk dengan <b>username & password</b> sahaja — tiada emel diperlukan.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Nama Anak</span>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth: Aisyah binti Ali"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
            required
            maxLength={60}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Darjah</span>
          <select
            value={darjah}
            onChange={(e) => setDarjah(e.target.value)}
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          >
            {DARJAH_LIST.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cth: aisyah123"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
            required
            minLength={3}
            maxLength={30}
          />
          {username && unameLive !== username && (
            <span className="mt-1 block text-[10px] text-muted-foreground">Akan disimpan sebagai: <b>{unameLive}</b></span>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 aksara"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
            required
            minLength={6}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-xl px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
        style={{ backgroundColor: HIJAU }}
      >
        {loading ? "Mencipta akaun..." : "Cipta Akaun Anak"}
      </button>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      {ok && <p className="mt-2 rounded-xl bg-primary/10 p-2 text-xs font-bold text-primary">{ok}</p>}
    </form>
  );
}




function Seksyen({ tajuk, ikon, children }: { tajuk: string; ikon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: HIJAU }}>
          {ikon}
        </span>
        <h2 className="font-display text-xl font-extrabold text-foreground">{tajuk}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  nilai,
  icon,
  warna,
  light,
}: {
  label: string;
  nilai: string | number;
  icon: React.ReactNode;
  warna: string;
  light?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 shadow-soft"
      style={{ backgroundColor: light ? `${warna}1f` : warna, color: light ? "#1a1a1a" : "#fff" }}
    >
      <div className="flex items-center gap-2 text-xs font-extrabold opacity-90">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold">{nilai}</p>
    </div>
  );
}

function KadSubjekTrend({
  label,
  sj,
  warna,
}: {
  label: string;
  sj: { subjek: string; purata: number; bil: number } | null;
  warna: string;
}) {
  const meta = sj ? SUBJEK_LIST.find((s) => s.id === sj.subjek) : null;
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft" style={{ border: `2px solid ${warna}33` }}>
      <p className="text-xs font-extrabold text-muted-foreground">{label}</p>
      {meta && sj ? (
        <>
          <p className="mt-1 font-display text-xl font-extrabold text-foreground">{meta.title}</p>
          <p className="text-xs text-muted-foreground">
            Purata {sj.purata}% • {sj.bil} aktiviti
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Belum cukup data</p>
      )}
    </div>
  );
}
