import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, BookOpen, Clock, Download, Flame, HelpCircle, RefreshCw, Share2, TrendingUp, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { subjekListUntukRole } from "@/lib/curriculum";

import { sertaiDenganKod } from "@/lib/parent";
import { CHILD_EMAIL_DOMAIN } from "@/lib/child-auth";
import { downloadSijil, shareSijil, type SijilInput } from "@/lib/sijil";
import { usePoints } from "@/hooks/use-points";

export const Route = createFileRoute("/dashboard/progress")({
  head: () => ({ meta: [{ title: "Progress Saya — Kalifah.my" }] }),
  ssr: false,
  component: ProgressDashboard,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
// Sistem warna kad statistik (semantik, gaya pale/soft konsisten)
const STAT_HIJAU = "#16A34A";
const STAT_BIRU = "#3B82F6";
const STAT_OREN = "#FB923C";
const STAT_EMAS = "#F5B82E";

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

function todayKL(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function daysAgoKL(n: number): string {
  const t = new Date(todayKL() + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - n);
  return t.toISOString().slice(0, 10);
}

function toKLDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}


function kiraStreak(rows: StatsRow[]): number {
  if (rows.length === 0) return 0;
  const set = new Set(rows.map((r) => r.tarikh));
  let streak = 0;
  // boleh mula dari hari ini ATAU semalam (kalau belum belajar hari ini)
  let mula = set.has(todayKL()) ? 0 : set.has(daysAgoKL(1)) ? 1 : -1;
  if (mula < 0) return 0;
  while (set.has(daysAgoKL(mula))) {
    streak++;
    mula++;
  }
  return streak;
}

function parseIsoUTC(iso: string): Date {
  // Treat timestamps without timezone info as UTC (Postgres timestamptz
  // returned by PostgREST is UTC; if the suffix is missing, JS would
  // otherwise parse it as local browser time and skew "time ago" output).
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso.replace(" ", "T") + "Z");
}

function formatTarikh(iso: string) {
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

function ProgressDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const SUBJEK_LIST = useMemo(() => subjekListUntukRole(profile?.role), [profile?.role]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const [{ data: p }, { data: s }, { data: b }] = await Promise.all([
        supabase
          .from("user_progress")
          .select("id, darjah, subjek, aktiviti, markah, jumlah_soalan, peratus, masa_ambil, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_stats")
          .select("tarikh, soalan_dijawab, masa_belajar, bab_selesai")
          .eq("user_id", user.id)
          .order("tarikh", { ascending: false })
          .limit(60),
        supabase
          .from("user_badges")
          .select("id, kod, nama, ikon, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setProgress((p ?? []) as ProgressRow[]);
      setStats((s ?? []) as StatsRow[]);
      setBadges((b ?? []) as BadgeRow[]);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const hariIni = todayKL();
  const statsHariIni = stats.find((s) => s.tarikh === hariIni);
  const streak = kiraStreak(stats);

  // Fallback: if user_stats kosong/outdated, kira dari user_progress hari ini
  const progressHariIni = useMemo(
    () => progress.filter((r) => toKLDate(r.created_at ?? new Date().toISOString()) === hariIni),
    [progress, hariIni],
  );
  const soalanHariIni = Math.max(
    statsHariIni?.soalan_dijawab ?? 0,
    progressHariIni.reduce((a, r) => a + (r.jumlah_soalan ?? 0), 0),
  );
  const masaHariIni = Math.max(
    statsHariIni?.masa_belajar ?? 0,
    Math.round(progressHariIni.reduce((a, r) => a + (r.masa_ambil ?? 0), 0) / 60),
  );

  // Untuk sijil: 4 aktiviti tetap + sekurang-kurangnya 1 varian "game-*".
  // Untuk bar kemajuan: kira semua aktiviti unik (cap pada 5) supaya setiap
  // game variant yang berbeza tetap diiktiraf sebagai aktiviti yang disiapkan.
  const TERAS_TETAP = ["kuiz", "latihan", "latih-tubi", "nota"] as const;
  function adaGame(rows: { aktiviti: string }[]): boolean {
    return rows.some((r) => r.aktiviti.startsWith("game"));
  }
  function siapSijil(rows: { aktiviti: string }[]): boolean {
    const set = new Set(rows.map((r) => r.aktiviti));
    return TERAS_TETAP.every((a) => set.has(a)) && adaGame(rows);
  }

  const ringkasanSubjek = useMemo(() => {
    return SUBJEK_LIST.map((sj) => {
      const rows = progress.filter((p) => p.subjek === sj.id);
      const aktivitiUnik = Math.min(5, new Set(rows.map((r) => r.aktiviti)).size);
      const peratusSiap = Math.min(100, Math.round((aktivitiUnik / 5) * 100));
      const purata = rows.length === 0 ? 0 : Math.round(rows.reduce((a, r) => a + Number(r.peratus), 0) / rows.length);
      const darjahTerkini = rows[0]?.darjah ?? "1";
      return { subjek: sj, aktivitiUnik, peratusSiap, purata, jumlahAktiviti: rows.length, darjahTerkini };
    });
  }, [progress]);

  const lencana = badges.length;
  const mata = usePoints();

  const babLemah = ringkasanSubjek.filter((r) => r.jumlahAktiviti > 0 && r.purata < 60);

  // ── Sijil tersedia (kumpul per-subjek sahaja supaya aktiviti merentas darjah
  //    yang sama subjek tetap dikira; darjah pada sijil = darjah paling terkini).
  const sijilSubjek = useMemo(() => {
    const grouped = new Map<string, ProgressRow[]>();
    progress.forEach((r) => {
      if (!grouped.has(r.subjek)) grouped.set(r.subjek, []);
      grouped.get(r.subjek)!.push(r);
    });
    const out: Array<{ darjah: string; subjekId: string; subjekTitle: string; purata: number; tarikh: string }> = [];
    grouped.forEach((rows, subjekId) => {
      const set = new Set(rows.map((r) => r.aktiviti));
      const ok = siapSijil(rows);
      // Diagnostik supaya senang kesan kenapa sijil tak keluar
      console.debug("[sijilSubjek]", subjekId, {
        aktiviti: Array.from(set),
        teras: TERAS_TETAP.map((a) => `${a}:${set.has(a) ? "✓" : "✗"}`),
        adaGame: adaGame(rows),
        layak: ok,
      });
      if (!ok) return;
      const subj = SUBJEK_LIST.find((s) => s.id === subjekId);
      if (!subj) return;
      const purata = Math.round(rows.reduce((a, r) => a + Number(r.peratus), 0) / rows.length);
      const sortedByTarikh = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const tarikh = sortedByTarikh[sortedByTarikh.length - 1].created_at;
      const darjah = sortedByTarikh[sortedByTarikh.length - 1].darjah;
      out.push({ darjah, subjekId, subjekTitle: subj.title, purata, tarikh });
    });
    return out;
  }, [progress]);

  const sijilDarjah = useMemo(() => {
    const grouped = new Map<string, Map<string, ProgressRow[]>>(); // darjah -> subjek -> rows
    progress.forEach((r) => {
      if (!grouped.has(r.darjah)) grouped.set(r.darjah, new Map());
      const m = grouped.get(r.darjah)!;
      if (!m.has(r.subjek)) m.set(r.subjek, []);
      m.get(r.subjek)!.push(r);
    });
    const out: Array<{ darjah: string; purata: number; tarikh: string }> = [];
    grouped.forEach((subMap, darjah) => {
      const semuaSubjekSiap = SUBJEK_LIST.every((sj) => {
        const rows = subMap.get(sj.id);
        return !!rows && siapSijil(rows);
      });
      if (!semuaSubjekSiap) return;
      const rows = progress.filter((r) => r.darjah === darjah);
      const purata = Math.round(rows.reduce((a, r) => a + Number(r.peratus), 0) / rows.length);
      const tarikh = rows.map((r) => r.created_at).sort().slice(-1)[0];
      out.push({ darjah, purata, tarikh });
    });
    return out;
  }, [progress]);



  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={user.user_metadata?.name as string | undefined} onLogout={handleLogout} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          to="/pilih-darjah"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Pilih Darjah
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">Progress Saya</h1>
            <p className="text-sm text-muted-foreground">
              Pantau pencapaian dan teruskan belajar setiap hari!
            </p>
        </div>

        {!user?.email?.includes(CHILD_EMAIL_DOMAIN) && <KadSertaiKod />}

        </div>

        {/* Statistik harian */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatKad
            label="Soalan Hari Ini"
            nilai={soalanHariIni}
            icon={<BookOpen className="h-5 w-5" />}
            warna={STAT_HIJAU}
            light
          />
          <StatKad
            label="Masa Belajar"
            nilai={`${masaHariIni} min`}
            icon={<Clock className="h-5 w-5" />}
            warna={STAT_BIRU}
            light
          />
          <StatKad
            label="Streak"
            nilai={`${streak} 🔥`}
            icon={<Flame className="h-5 w-5" />}
            warna={STAT_OREN}
            light
          />
          <StatKad
            label="Lencana"
            nilai={lencana}
            icon={<Award className="h-5 w-5" />}
            warna={STAT_EMAS}
            light
          />
        </section>

        {fetching ? (
          <div className="mt-8 rounded-3xl bg-card p-10 text-center shadow-card">
            <p className="text-muted-foreground">Memuatkan data progress...</p>
          </div>
        ) : (
          <>
            {/* Lencana */}
            <section className="mt-8">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-foreground">Lencana Saya</h2>
                <BadgeInfoButton />
              </div>
              {badges.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-card p-5 text-center shadow-soft">
                  <p className="text-sm text-muted-foreground">
                    Belum ada lencana. Siapkan aktiviti untuk mengumpul lencana! 🏅
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  {badges.map((bg) => (
                    <div
                      key={bg.id}
                      className="flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-soft"
                      style={{ border: `2px solid ${EMAS}55` }}
                      title={new Date(bg.created_at).toLocaleDateString("ms-MY")}
                    >
                      <span className="text-2xl leading-none">{bg.ikon}</span>
                      <span className="font-display text-sm font-extrabold text-foreground">{bg.nama}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sijil Saya */}
            <SeksyenSijil
              namaMurid={user.email?.split("@")[0] ?? "Pelajar"}
              sijilSubjek={sijilSubjek}
              sijilDarjah={sijilDarjah}
            />



            {/* Kad Subjek */}
            <section className="mt-8">
              <h2 className="font-display text-xl font-extrabold text-foreground">Ringkasan Subjek</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ringkasanSubjek.map((r) => (
                  <Link
                    key={r.subjek.id}
                    to="/darjah/$darjahId/$subjekId"
                    params={{ darjahId: r.darjahTerkini, subjekId: r.subjek.id }}
                    className="block rounded-3xl bg-card p-5 shadow-card transition hover:-translate-y-0.5"
                    style={{ border: `2px solid ${HIJAU}22` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-extrabold text-foreground">{r.subjek.title}</h3>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-extrabold"
                        style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}
                      >
                        ⭐ {r.purata}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.aktivitiUnik}/5 aktiviti • {r.jumlahAktiviti} sesi
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full" style={{ backgroundColor: `${HIJAU}1a` }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${r.peratusSiap}%`, backgroundColor: HIJAU }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-bold" style={{ color: HIJAU }}>
                      {r.peratusSiap}% siap
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Bab Lemah */}
            <section className="mt-8">
              <h2 className="font-display text-xl font-extrabold text-foreground">Bab Lemah</h2>
              {babLemah.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-card p-5 text-center shadow-soft">
                  <p className="text-sm text-muted-foreground">
                    Tiada bab lemah! Teruskan usaha yang baik. 🎉
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {babLemah.map((r) => (
                    <div
                      key={r.subjek.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-soft"
                      style={{ border: "2px solid #fecaca" }}
                    >
                      <div>
                        <p className="font-display text-base font-extrabold text-foreground">
                          {r.subjek.title}
                        </p>
                        <p className="text-xs text-destructive">Purata: {r.purata}%</p>
                      </div>
                      <Link
                        to="/darjah/$darjahId/$subjekId"
                        params={{ darjahId: r.darjahTerkini, subjekId: r.subjek.id }}
                        className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-extrabold text-white shadow-soft"
                        style={{ backgroundColor: HIJAU }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Ulang Kaji
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Aktiviti Terkini */}
            <section className="mt-8 mb-12">
              <h2 className="font-display text-xl font-extrabold text-foreground">Aktiviti Terkini</h2>
              {progress.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-card p-5 text-center shadow-soft">
                  <p className="text-sm text-muted-foreground">
                    Belum ada aktiviti. Mula belajar sekarang!
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-soft">
                  {progress.slice(0, 5).map((row, i) => {
                    const sj = SUBJEK_LIST.find((s) => s.id === row.subjek);
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between gap-3 p-4"
                        style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-extrabold text-foreground">
                            {sj?.title ?? row.subjek}
                            <span className="ml-1 text-muted-foreground">
                              • {AKTIVITI_LABEL[row.aktiviti] ?? row.aktiviti}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Darjah {row.darjah} • {formatTarikh(row.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="font-display text-lg font-extrabold"
                            style={{ color: Number(row.peratus) >= 60 ? HIJAU : "#dc2626" }}
                          >
                            {row.markah}/{row.jumlah_soalan}
                          </p>
                          <p className="text-xs text-muted-foreground">{Math.round(Number(row.peratus))}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatKad({
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
      style={{
        backgroundColor: light ? `${warna}1f` : warna,
        color: light ? "#1a1a1a" : "#fff",
      }}
    >
      <div className="flex items-center gap-2 text-xs font-extrabold opacity-90">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold">{nilai}</p>
    </div>
  );
}

function KadSertaiKod() {
  const [open, setOpen] = useState(false);
  const [kod, setKod] = useState("");
  const [loading, setLoading] = useState(false);
  const [mesej, setMesej] = useState<{ ok: boolean; teks: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kod.trim()) return;
    setLoading(true);
    setMesej(null);
    const res = await sertaiDenganKod(kod);
    setLoading(false);
    if (res.ok) {
      setMesej({ ok: true, teks: "Berjaya dipautkan kepada ibu bapa!" });
      setKod("");
    } else {
      setMesej({ ok: false, teks: res.mesej ?? "Kod tidak sah." });
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft" style={{ border: `2px solid ${EMAS}55` }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="font-display text-sm font-extrabold hover:opacity-80"
          style={{ color: HIJAU }}
        >
          🔗 Ada kod dari ibu bapa? Klik untuk pautkan akaun
        </button>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <label className="font-display text-sm font-extrabold text-foreground">Kod jemputan ibu bapa:</label>
          <input
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="rounded-xl border-2 border-border px-3 py-2 font-display text-sm uppercase tracking-widest"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-4 py-2 font-display text-xs font-extrabold text-white disabled:opacity-60"
            style={{ backgroundColor: HIJAU }}
          >
            {loading ? "Memautkan..." : "Pautkan"}
          </button>
          <button type="button" onClick={() => { setOpen(false); setMesej(null); }} className="text-xs text-muted-foreground hover:underline">
            Batal
          </button>
          {mesej && (
            <p className="basis-full text-xs font-bold" style={{ color: mesej.ok ? HIJAU : "#dc2626" }}>
              {mesej.teks}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function formatTarikhMs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" });
}

function SeksyenSijil({
  namaMurid,
  sijilSubjek,
  sijilDarjah,
}: {
  namaMurid: string;
  sijilSubjek: Array<{ darjah: string; subjekId: string; subjekTitle: string; purata: number; tarikh: string }>;
  sijilDarjah: Array<{ darjah: string; purata: number; tarikh: string }>;
}) {
  const semua = [...sijilDarjah.map((s) => ({ ...s, _kind: "darjah" as const })), ...sijilSubjek.map((s) => ({ ...s, _kind: "subjek" as const }))];

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5" style={{ color: EMAS }} />
        <h2 className="font-display text-xl font-extrabold text-foreground">Sijil Saya</h2>
      </div>
      {semua.length === 0 ? (
        <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">
            Sijil PDF akan tersedia bila kamu siapkan semua 5 aktiviti dalam satu subjek atau semua subjek dalam satu darjah. 📜
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sijilDarjah.map((s) => (
            <KadSijil
              key={`d-${s.darjah}`}
              warna={EMAS}
              ikon="🏆"
              tajuk={`Sijil Tamat Darjah ${s.darjah}`}
              sari={`Semua subjek lengkap • Purata ${s.purata}%`}
              input={{
                jenis: "darjah",
                namaMurid,
                tajuk: `Darjah ${s.darjah}`,
                tarikh: formatTarikhMs(s.tarikh),
                purata: s.purata,
                kodSijil: `D${s.darjah}-${namaMurid.slice(0, 3).toUpperCase()}-${s.tarikh.slice(0, 10).replace(/-/g, "")}`,
              }}
              namafile={`Sijil-Darjah-${s.darjah}-${namaMurid}.pdf`}
            />
          ))}
          {sijilSubjek.map((s) => (
            <KadSijil
              key={`s-${s.darjah}-${s.subjekId}`}
              warna={HIJAU}
              ikon="🎓"
              tajuk={`Sijil ${s.subjekTitle}`}
              sari={`Darjah ${s.darjah} • Purata ${s.purata}%`}
              input={{
                jenis: "subjek",
                namaMurid,
                tajuk: `${s.subjekTitle} Darjah ${s.darjah}`,
                tarikh: formatTarikhMs(s.tarikh),
                purata: s.purata,
                kodSijil: `${s.subjekId.slice(0, 3).toUpperCase()}-D${s.darjah}-${namaMurid.slice(0, 3).toUpperCase()}-${s.tarikh.slice(0, 10).replace(/-/g, "")}`,
              }}
              namafile={`Sijil-${s.subjekTitle}-D${s.darjah}-${namaMurid}.pdf`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function KadSijil({
  warna,
  ikon,
  tajuk,
  sari,
  input,
  namafile,
}: {
  warna: string;
  ikon: string;
  tajuk: string;
  sari: string;
  input: SijilInput;
  namafile: string;
}) {
  const [busy, setBusy] = useState<"dl" | "sh" | null>(null);

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft sm:flex-row sm:items-center"
      style={{ border: `2px solid ${warna}55` }}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
        style={{ backgroundColor: `${warna}1f` }}
      >
        {ikon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-extrabold text-foreground truncate">{tajuk}</p>
        <p className="text-xs text-muted-foreground truncate">{sari}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={async () => {
            setBusy("dl");
            try {
              await downloadSijil(input, namafile);
            } finally {
              setBusy(null);
            }
          }}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-xs font-extrabold text-white shadow-soft disabled:opacity-60"
          style={{ backgroundColor: warna }}
        >
          <Download className="h-3.5 w-3.5" /> {busy === "dl" ? "..." : "PDF"}
        </button>
        <button
          onClick={async () => {
            setBusy("sh");
            try {
              await shareSijil(input, namafile);
            } finally {
              setBusy(null);
            }
          }}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-xs font-extrabold disabled:opacity-60"
          style={{ backgroundColor: `${warna}1f`, color: warna, border: `1.5px solid ${warna}` }}
        >
          <Share2 className="h-3.5 w-3.5" /> {busy === "sh" ? "..." : "Kongsi"}
        </button>
      </div>
    </div>
  );
}

function BadgeInfoButton() {
  const [open, setOpen] = useState(false);
  const items = [
    { ikon: "🌟", nama: "Cemerlang", desc: "Dapat skor 100% dalam mana-mana kuiz topik." },
    { ikon: "⭐", nama: "Streak Bintang", desc: "Belajar 7 hari berturut-turut." },
    { ikon: "🥇", nama: "Streak Emas", desc: "Belajar 30 hari berturut-turut." },
    {
      ikon: "🎖️",
      nama: "Pakar Subjek",
      desc: "Untuk setiap subjek: purata kuiz ≥ 70%, latih tubi sekurang-kurangnya 100 soalan dengan purata ≥ 70%, dan semua nota topik dah dibaca (tick).",
    },
  ];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cara dapat lencana"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft hover:text-foreground"
        style={{ border: `1.5px solid ${EMAS}55` }}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-foreground">Cara Dapat Lencana</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-muted-foreground hover:text-foreground"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {items.map((it) => (
                <li key={it.nama} className="flex gap-3 rounded-2xl p-3" style={{ backgroundColor: `${EMAS}14` }}>
                  <span className="text-2xl leading-none">{it.ikon}</span>
                  <div>
                    <p className="font-display text-sm font-extrabold text-foreground">{it.nama}</p>
                    <p className="text-xs text-muted-foreground">{it.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-full px-4 py-2 font-display text-sm font-extrabold text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              Faham
            </button>
          </div>
        </div>
      )}
    </>
  );
}
