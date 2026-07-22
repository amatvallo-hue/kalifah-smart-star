import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Sparkles, Star, LogOut, ArrowRight, Trophy, BookOpen, FileText, Target, TrendingUp, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { DARJAH_LIST, subjekListUntukRole, type Darjah } from "@/lib/curriculum";
import { CHILD_EMAIL_DOMAIN } from "@/lib/child-auth";

export const Route = createFileRoute("/pilih-darjah")({
  head: () => ({
    meta: [
      { title: "Pilih Darjah — Kalifah.my" },
      { name: "description", content: "Pilih tahap darjah anak untuk mula belajar di Kalifah.my." },
    ],
  }),
  ssr: false,
  component: DarjahDashboard,
});

interface DarjahStats {
  bilSubjek: number;
  bilSoalan: number;
  skorPurata: number;
  bilAktiviti: number;
  bilSoalanMpt4: number;
}

interface MingguStats {
  soalan: number;
  peratus: number;
  bilAktiviti: number;
}

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


function DarjahDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const mata = usePoints();

  const [darjahMurid, setDarjahMurid] = useState<string | null>(null);
  const [statsMap, setStatsMap] = useState<Record<number, DarjahStats>>({});
  const [minggu, setMinggu] = useState<MingguStats | null>(null);

  const subjekList = useMemo(() => subjekListUntukRole(profile?.role), [profile?.role]);
  const darjahAkses = useMemo(() => profile?.darjah_akses ?? [], [profile?.darjah_akses]);
  const darjahAksesKey = darjahAkses.join(",");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Kesan darjah murid: child_profiles.darjah untuk akaun anak,
  // atau elemen pertama darjah_akses untuk akaun induk.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("child_profiles" as never)
        .select("darjah")
        .eq("child_user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const childDarjah = (data as { darjah?: string } | null)?.darjah;
      if (childDarjah) {
        setDarjahMurid(String(childDarjah));
        return;
      }
      if (darjahAkses.length > 0) {
        setDarjahMurid(String(darjahAkses[0]));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, darjahAkses]);

  // Ambil statistik live untuk SETIAP darjah yang murid ada akses — via RPC.
  useEffect(() => {
    if (!user) {
      setStatsMap({});
      return;
    }
    const darjahNums = darjahAkses.filter((n) => Number.isFinite(n));
    if (darjahNums.length === 0) {
      setStatsMap({});
      return;
    }
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.rpc("get_darjah_stats" as never, {
        p_darjah: darjahNums,
        p_user_id: user.id,
      } as never);

      if (cancelled || error || !data) return;

      const rows = data as Array<{
        darjah: number;
        bil_soalan: number | string;
        purata_skor: number | string | null;
        bil_aktiviti: number | string | null;
        bil_soalan_mpt4: number | string | null;
      }>;

      const nextMap: Record<number, DarjahStats> = {};
      for (const n of darjahNums) {
        nextMap[n] = {
          bilSubjek: subjekList.length,
          bilSoalan: 0,
          skorPurata: 0,
          bilAktiviti: 0,
          bilSoalanMpt4: 0,
        };
      }
      for (const r of rows) {
        const dNum = Number(r.darjah);
        if (!(dNum in nextMap)) continue;
        nextMap[dNum] = {
          bilSubjek: subjekList.length,
          bilSoalan: Number(r.bil_soalan) || 0,
          skorPurata: Number(r.purata_skor) || 0,
          bilAktiviti: Number(r.bil_aktiviti) || 0,
          bilSoalanMpt4: Number(r.bil_soalan_mpt4) || 0,
        };
      }


      setStatsMap(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, darjahAksesKey, subjekList.length, darjahAkses]);

  // Progress minggu ini — reuse logic tarikh 7 hari dari dashboard.ibu-bapa.tsx,
  // tapi untuk murid sendiri (bukan anak). Cutoff via .gte() supaya elak row-limit.
  useEffect(() => {
    if (!user) {
      setMinggu(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const cutoffKL = daysAgoKL(6);
      const cutoffISO = `${cutoffKL}T00:00:00+08:00`;
      const { data, error } = await supabase
        .from("user_progress")
        .select("jumlah_soalan, peratus, created_at")
        .eq("user_id", user.id)
        .gte("created_at", cutoffISO);
      if (cancelled || error) return;
      const tarikhSet = new Set<string>();
      for (let i = 0; i < 7; i++) tarikhSet.add(daysAgoKL(i));
      const rows = (data ?? []).filter((r) => tarikhSet.has(toKLDate(r.created_at as string)));
      const soalan = rows.reduce((a, r) => a + Number(r.jumlah_soalan ?? 0), 0);
      const peratus = rows.length === 0
        ? 0
        : Math.round(rows.reduce((a, r) => a + Number(r.peratus ?? 0), 0) / rows.length);
      setMinggu({ soalan, peratus, bilAktiviti: rows.length });
    })();
    return () => { cancelled = true; };
  }, [user]);




  function handleLockedClick(d: Darjah) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("previewDarjah", d.id);
    }
    navigate({ to: "/preview/nama" });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const metaName =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined);
  const emailLocal = user.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : "";
  const prettyEmail = emailLocal
    ? emailLocal.split(" ").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "";
  const displayName = (metaName && metaName.trim()) || prettyEmail || "Pelajar";
  const firstName = displayName.split(" ")[0];
  const isChild = !!user.email?.includes(CHILD_EMAIL_DOMAIN);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={firstName} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-6">
        {/* Hero — padat */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-hero px-5 py-4 shadow-card md:px-7 md:py-5">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-display text-[11px] font-bold text-primary shadow-soft">
                <Sparkles className="h-3 w-3" />
                Assalamualaikum
              </span>
              <h1 className="mt-1.5 font-display text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
                Selamat datang, <span className="text-primary">{firstName}</span>! 🌟
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isChild ? "Sedia sambung belajar hari ni?" : "Pantau pembelajaran anak anda di sini."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isChild && darjahMurid && (
                <Link
                  to="/darjah/$darjahId"
                  params={{ darjahId: darjahMurid }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition hover:opacity-90"
                >
                  Sambung Belajar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/harga"
                className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 font-display text-xs font-bold text-foreground/80 shadow-soft transition hover:text-primary"
              >
                <Star className="h-3.5 w-3.5" />
                Pakej
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 font-display text-xs font-bold text-muted-foreground shadow-soft transition hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Keluar
              </button>
            </div>
          </div>
        </section>

        {isChild && (
          <>
            {/* Progress Minggu Ini */}
            <section className="mt-6">
              <div
                className="relative overflow-hidden rounded-3xl border-2 p-5 shadow-card md:p-6"
                style={{
                  borderColor: "#FBC02D",
                  background:
                    "linear-gradient(135deg, #FFF8E1 0%, #FFFDF5 55%, #FFF3D1 100%)",
                }}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#F9A825]/15 blur-3xl" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-soft"
                      style={{ background: "linear-gradient(135deg, #F5B82E, #E48A0A)" }}
                    >
                      <CalendarDays className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wide text-[#8A5A00] shadow-soft">
                        <TrendingUp className="h-3 w-3" />
                        7 Hari Terakhir
                      </div>
                      <h2 className="mt-1 font-display text-xl font-extrabold text-foreground md:text-2xl">
                        Progress Minggu Ini
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <MingguStat
                      icon={<BookOpen className="h-4 w-4" />}
                      label="Soalan Dijawab"
                      value={minggu ? minggu.soalan.toLocaleString("ms-MY") : "—"}
                    />
                    <MingguStat
                      icon={<Target className="h-4 w-4" />}
                      label="Skor Purata"
                      value={
                        minggu && minggu.bilAktiviti > 0
                          ? `${minggu.peratus}%`
                          : "—"
                      }
                    />
                    <Link
                      to="/dashboard/progress"
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-soft transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #F5B82E, #E48A0A)" }}
                    >
                      Lihat Penuh
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                {minggu && minggu.bilAktiviti === 0 && (
                  <p className="relative mt-3 text-xs font-bold text-[#8A5A00]/80">
                    Belum ada aktiviti minggu ini — jom mula belajar!
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        <section className="mt-8">

          <div>
            <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
              Pilih Darjah Anda
            </h2>
            <p className="text-sm text-muted-foreground">
              {isChild
                ? "Darjah anda ditonjolkan di bawah. Darjah lain memerlukan langganan."
                : "Pilih darjah untuk lihat pakej atau navigasi. Darjah lain memerlukan langganan."}
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PraKalifahCard />
            {DARJAH_LIST.map((d, i) => {
              const hasAccess = darjahAkses.includes(Number(d.id));
              const isCurrent = isChild && darjahMurid === d.id;
              return (
                <DarjahCard
                  key={d.id}
                  darjah={d}
                  index={i}
                  hasAccess={hasAccess}
                  isCurrent={isCurrent}
                  isChild={isChild}
                  stats={hasAccess ? statsMap[Number(d.id)] ?? null : null}
                  onLockedClick={() => handleLockedClick(d)}
                />
              );
            })}
          </div>
        </section>

        <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kalifah.my — Belajar dengan ceria & berkat.
        </footer>
      </main>
    </div>
  );
}

function DarjahCard({
  darjah,
  index,
  hasAccess,
  isCurrent,
  isChild,
  stats,
  onLockedClick,
}: {
  darjah: Darjah;
  index: number;
  hasAccess: boolean;
  isCurrent: boolean;
  isChild: boolean;
  stats: DarjahStats | null;
  onLockedClick: () => void;
}) {
  const palettes = [
    "from-primary to-primary-glow text-primary-foreground",
    "from-gold to-gold/80 text-gold-foreground",
    "from-sky-400 to-sky-300 text-sky-900",
    "from-rose-400 to-rose-300 text-rose-900",
    "from-violet-400 to-violet-300 text-violet-900",
    "from-teal-400 to-teal-300 text-teal-900",
  ];
  const tone = isCurrent
    ? "from-primary to-primary-glow text-primary-foreground"
    : palettes[index % palettes.length];

  const isMpt4 = darjah.id === "4";

  const currentCardStyle = isCurrent
    ? {
        borderColor: "hsl(var(--primary))",
        background:
          "linear-gradient(135deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--card)) 55%)",
      }
    : undefined;

  const inner = (
    <div
      className={`relative flex h-full flex-col justify-between gap-5 rounded-3xl bg-card p-6 shadow-card transition group-hover:-translate-y-1 group-hover:shadow-soft ${
        isCurrent
          ? "border-[3px] ring-2 ring-primary/20"
          : "border border-border/60"
      } ${!hasAccess ? "opacity-80" : ""}`}
      style={currentCardStyle}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground shadow-soft">
          <Sparkles className="h-3 w-3" />
          Darjah Anda
        </div>
      )}
      {!hasAccess && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-wide text-gold-foreground shadow-soft">
          <Lock className="h-3 w-3" />
          Naik Taraf
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${tone} shadow-soft transition group-hover:scale-110 ${
            !hasAccess ? "grayscale" : ""
          }`}
        >
          <span className="font-display text-4xl font-extrabold">{darjah.id}</span>
        </div>
        {hasAccess && isMpt4 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-[10px] font-extrabold text-white shadow-soft"
            style={{ background: "linear-gradient(135deg, #F5B82E, #E48A0A)" }}
          >
            <Trophy className="h-3 w-3" />
            Percubaan MPT4
          </span>
        )}
      </div>

      <div>
        <h3 className="font-display text-2xl font-extrabold text-foreground">
          {darjah.label}
          {!hasAccess && <span className="ml-1">🔒</span>}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{darjah.tagline}</p>
      </div>

      {hasAccess && (
        <div className="space-y-3">
          {/* Statistik ringkas — live per darjah */}
          <div className="grid grid-cols-2 gap-2">
            <StatChip
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Subjek"
              value={stats ? String(stats.bilSubjek) : "—"}
            />
            <StatChip
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Soalan"
              value={stats ? stats.bilSoalan.toLocaleString("ms-MY") : "—"}
            />
          </div>

          {stats && stats.bilSoalanMpt4 > 0 && (
            <StatChip
              icon={<Trophy className="h-3.5 w-3.5" />}
              label="Soalan MPT4"
              value={stats.bilSoalanMpt4.toLocaleString("ms-MY")}
            />
          )}

          {/* Skor purata — hanya untuk akaun anak */}
          {isChild && (
            <>
              {stats && stats.bilAktiviti > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-foreground/80">
                    <span>Skor Purata</span>
                    <span>{stats.skorPurata.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.skorPurata >= 60 ? "bg-gradient-primary" : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, stats.skorPurata))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>Skor Purata</span>
                    <span>Belum mula aktiviti</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" />
                </div>
              )}
            </>
          )}

        </div>
      )}

      <div className="flex items-center justify-between">
        {hasAccess ? (
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition group-hover:translate-x-0.5">
            Masuk {darjah.label}
            <ArrowRight className="h-4 w-4" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Belum dilanggan
          </span>
        )}
      </div>
    </div>
  );

  if (isCurrent && hasAccess) {
    return (
      <Link to="/darjah/$darjahId" params={{ darjahId: darjah.id }} className="group">
        {inner}
      </Link>
    );
  }
  if (isCurrent && !hasAccess) {
    // Darjah murid tetapi belum dibayar — bawa ke pakej.
    return (
      <Link to="/harga" className="group">
        {inner}
      </Link>
    );
  }
  if (!hasAccess) {
    return (
      <button type="button" onClick={onLockedClick} className="group cursor-pointer text-left">
        {inner}
      </button>
    );
  }
  return (
    <Link to="/darjah/$darjahId" params={{ darjahId: darjah.id }} className="group">
      {inner}
    </Link>
  );
}

function PraKalifahCard() {
  const [jumlahAktiviti, setJumlahAktiviti] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { count } = await supabase
        .from("pra_kalifah_aktiviti" as never)
        .select("*", { count: "exact", head: true });
      if (mounted) setJumlahAktiviti(count ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Link to="/pra-kalifah" className="group">
      <div className="relative flex h-full flex-col items-center justify-between gap-3 overflow-hidden rounded-3xl border-2 border-white/50 bg-gradient-to-br from-[#FF7B9C] via-[#FFD166] to-[#5AC8FA] p-6 text-center shadow-card transition group-hover:-translate-y-1 group-hover:shadow-soft">
        <span className="pointer-events-none absolute left-3 top-3 text-3xl opacity-80">☁️</span>
        <span className="pointer-events-none absolute right-8 top-16 text-4xl opacity-60">☁️</span>
        <span className="pointer-events-none absolute -left-3 bottom-20 text-6xl opacity-50">☁️</span>
        <span className="pointer-events-none absolute right-3 top-3 text-5xl opacity-90">🌈</span>
        <span className="pointer-events-none absolute left-4 bottom-16 text-xl opacity-70">⭐</span>
        <span className="pointer-events-none absolute right-6 top-24 text-lg opacity-60">⭐</span>
        <span className="pointer-events-none absolute left-10 top-28 text-base opacity-50">⭐</span>
        <span className="pointer-events-none absolute right-10 bottom-28 text-lg opacity-65">⭐</span>
        <span className="pointer-events-none absolute left-1/2 top-10 text-base opacity-55">⭐</span>

        <img
          src="https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/owl-mascot-nobg.png"
          alt="Mascot Pra Kalifah"
          className="h-20 w-auto object-contain drop-shadow-lg transition group-hover:scale-110"
        />

        <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-white drop-shadow-md">
          Dunia
          <br />
          Pra Kalifah
        </h3>

        <div className="flex items-center gap-2 text-2xl drop-shadow-sm">
          <span>🏰</span>
          <span>🏡</span>
          <span>🚀</span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 font-display text-xs font-extrabold text-[#0F172A] shadow-sm">
          {jumlahAktiviti ? `${jumlahAktiviti}+ Aktiviti` : "Aktiviti Percuma"}
        </span>

        <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-sm font-extrabold text-[#FF7B9C] shadow-soft transition group-hover:translate-x-0.5">
          Jom Bermain!
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function MingguStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#F5B82E]/40 bg-white/85 px-3.5 py-2 shadow-soft">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8A5A00]">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-display text-lg font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-extrabold text-foreground">{value}</div>
    </div>
  );
}
