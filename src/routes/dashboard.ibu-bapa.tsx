import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Flame,
  PlusCircle,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SUBJEK_LIST, DARJAH_LIST } from "@/lib/curriculum";
import { padamAnak, senaraikanAnak, tambahAnak, type ChildProfile } from "@/lib/parent";

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
  const now = new Date();
  const ms = now.getTime() + (8 * 60 - now.getTimezoneOffset()) * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

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

  useEffect(() => {
    if (!anakUserId) {
      setProgress([]);
      setStats([]);
      setBadges([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setFetching(true);
      const [{ data: p }, { data: s }, { data: b }] = await Promise.all([
        supabase
          .from("user_progress")
          .select("id, darjah, subjek, aktiviti, markah, jumlah_soalan, peratus, masa_ambil, created_at")
          .eq("user_id", anakUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_stats")
          .select("tarikh, soalan_dijawab, masa_belajar, bab_selesai")
          .eq("user_id", anakUserId)
          .order("tarikh", { ascending: false })
          .limit(60),
        supabase
          .from("user_badges")
          .select("id, kod, nama, ikon, created_at")
          .eq("user_id", anakUserId)
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
    const soalan = s.reduce((a, r) => a + (r.soalan_dijawab ?? 0), 0);
    const masa = s.reduce((a, r) => a + (r.masa_belajar ?? 0), 0);
    const bab = s.reduce((a, r) => a + (r.bab_selesai ?? 0), 0);
    const peratus = p.length === 0 ? 0 : Math.round(p.reduce((a, r) => a + Number(r.peratus), 0) / p.length);
    return { soalan, masa, bab, peratus };
  }, [progress, stats, tarikhMingguIni]);

  const bulan = useMemo(() => {
    const p = progress.filter((r) => tarikhBulanIni.has(r.created_at.slice(0, 10)));
    const s = stats.filter((r) => tarikhBulanIni.has(r.tarikh));
    const soalan = s.reduce((a, r) => a + (r.soalan_dijawab ?? 0), 0);
    const masa = s.reduce((a, r) => a + (r.masa_belajar ?? 0), 0);

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
          to="/"
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
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            <PlusCircle className="h-4 w-4" /> Tambah Anak
          </button>
        </div>

        {/* Borang tambah anak */}
        {showAdd && (
          <FormTambahAnak
            onAdded={async () => {
              const list = await senaraikanAnak();
              setAnakList(list);
              setShowAdd(false);
              if (!aktifId && list.length > 0) setAktifId(list[0].id);
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

            {anakAktif && !anakAktif.child_user_id && (
              <KadKodJemputan anak={anakAktif} onPadam={async () => {
                if (!confirm(`Padam profil ${anakAktif.nama}?`)) return;
                const ok = await padamAnak(anakAktif.id);
                if (ok) {
                  const list = await senaraikanAnak();
                  setAnakList(list);
                  setAktifId(list[0]?.id ?? null);
                }
              }} />
            )}

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
    </div>
  );
}

function FormTambahAnak({ onAdded }: { onAdded: () => void }) {
  const [nama, setNama] = useState("");
  const [darjah, setDarjah] = useState("1");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    setLoading(true);
    setErr(null);
    const res = await tambahAnak(nama, darjah);
    setLoading(false);
    if (!res) {
      setErr("Gagal menambah anak. Sila cuba lagi.");
      return;
    }
    setNama("");
    onAdded();
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-card p-5 shadow-card" style={{ border: `2px solid ${HIJAU}33` }}>
      <h3 className="font-display text-lg font-extrabold text-foreground">Tambah Profil Anak</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama anak"
          className="rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          required
          maxLength={60}
        />
        <select
          value={darjah}
          onChange={(e) => setDarjah(e.target.value)}
          className="rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
        >
          {DARJAH_LIST.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-5 py-2.5 font-display text-sm font-extrabold text-white disabled:opacity-60"
          style={{ backgroundColor: HIJAU }}
        >
          {loading ? "Menambah..." : "Tambah"}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </form>
  );
}

function KadKodJemputan({ anak, onPadam }: { anak: ChildProfile; onPadam: () => void }) {
  const [salin, setSalin] = useState(false);
  function copyKod() {
    navigator.clipboard.writeText(anak.kod_jemputan);
    setSalin(true);
    setTimeout(() => setSalin(false), 1500);
  }
  return (
    <div className="mt-6 rounded-3xl bg-card p-6 shadow-card" style={{ border: `2px dashed ${EMAS}` }}>
      <h2 className="font-display text-xl font-extrabold text-foreground">
        Pautkan akaun {anak.nama}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Beri kod ini kepada anak. Anak masukkan kod di halaman <b>Progress Saya</b> untuk pautkan akaun mereka.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div
          className="rounded-2xl px-6 py-3 font-display text-3xl font-extrabold tracking-widest"
          style={{ backgroundColor: `${EMAS}22`, color: "#7a5300", border: `2px solid ${EMAS}` }}
        >
          {anak.kod_jemputan}
        </div>
        <button
          onClick={copyKod}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-extrabold text-white shadow-soft"
          style={{ backgroundColor: HIJAU }}
        >
          <Copy className="h-4 w-4" /> {salin ? "Disalin!" : "Salin kod"}
        </button>
        <button
          onClick={onPadam}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Padam
        </button>
      </div>
    </div>
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
