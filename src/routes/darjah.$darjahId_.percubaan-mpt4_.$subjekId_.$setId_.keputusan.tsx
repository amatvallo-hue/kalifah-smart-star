import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { renderSoalanSvg } from "@/lib/render-soalan-svg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { getDarjah, getSubjek, TONE_GRADIENT } from "@/lib/curriculum";

export const Route = createFileRoute(
  "/darjah/$darjahId_/percubaan-mpt4_/$subjekId_/$setId_/keputusan",
)({
  head: () => ({
    meta: [{ title: "Percubaan MPT4 — Keputusan — Kalifah.my" }],
  }),
  ssr: false,
  component: KeputusanPage,
});

type KaedahPenskoran = "dikotomus" | "analitikal" | "holistik";

interface Mpt4Set {
  id: string;
  nombor_set: number;
  tajuk: string | null;
  jumlah_markah: number | null;
}

interface Mpt4Soalan {
  id: string;
  bahagian: string;
  no_soalan: number;
  sub_bahagian: string | null;
  teks_soalan: string;
  jenis_item: string;
  kaedah_penskoran: KaedahPenskoran;
  pilihan_a: string | null;
  pilihan_b: string | null;
  pilihan_c: string | null;
  pilihan_d: string | null;
  jawapan_betul: string | null;
  markah: number;
  stimulus_keterangan: string | null;
  stimulus_svg: { svg_type: string; params: any; bahasa?: "bm" | "en" } | null;
}

interface EseiPenilaianItem {
  markah?: number;
  kekuatan?: string;
  cadangan_penambahbaikan?: string;
  band?: string;
}

interface Mpt4Keputusan {
  id: string;
  set_id: string;
  user_id: string;
  jawapan: Record<string, string> | null;
  esei_penilaian: Record<string, EseiPenilaianItem> | null;
  markah_keseluruhan: number | null;
  markah_penuh: number | null;
  markah_per_bahagian: Record<string, { markah_diperoleh: number; markah_penuh: number }> | null;
  masa_diambil_minit: number | null;
  status: string | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
}

function splitBilingual(teks: string): { bm: string; en: string | null } {
  const parts = teks.split("\n").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { bm: teks, en: null };
  return { bm: parts[0], en: parts.slice(1).join(" ") };
}

async function runBatched<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function KeputusanPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId, setId } = useParams({
    from: "/darjah/$darjahId_/percubaan-mpt4_/$subjekId_/$setId_/keputusan",
  });
  const { user, loading } = useAuth();
  const mata = usePoints();
  const studentName = user?.user_metadata?.name as string | undefined;
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

  const [setInfo, setSetInfo] = useState<Mpt4Set | null>(null);
  const [soalanList, setSoalanList] = useState<Mpt4Soalan[] | null>(null);
  const [keputusan, setKeputusan] = useState<Mpt4Keputusan | null>(null);
  const [phase, setPhase] = useState<"loading" | "grading" | "done" | "error" | "empty">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openBahagian, setOpenBahagian] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState(false);

  async function handleCubaLagi() {
    if (!user || !setId) return;
    setRetrying(true);
    const { error } = await supabase
      .from("mpt4_keputusan")
      .insert({ user_id: user.id, set_id: setId, jawapan: {}, status: "in_progress" });
    setRetrying(false);
    if (error) {
      setErrorMsg(error.message);
      setPhase("error");
      return;
    }
    navigate({
      to: "/darjah/$darjahId/percubaan-mpt4/$subjekId/$setId",
      params: { darjahId, subjekId, setId },
    });
  }

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  // Fetch data
  useEffect(() => {
    if (!user || !setId) return;
    let cancelled = false;
    (async () => {
      const [setRes, soalanRes, kepRes] = await Promise.all([
        supabase
          .from("mpt4_set")
          .select("id, nombor_set, tajuk, jumlah_markah")
          .eq("id", setId)
          .maybeSingle(),
        supabase
          .from("mpt4_soalan")
          .select(
            "id, bahagian, no_soalan, sub_bahagian, teks_soalan, jenis_item, kaedah_penskoran, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, markah, stimulus_keterangan, stimulus_svg",
          )
          .eq("set_id", setId)
          .order("bahagian", { ascending: true })
          .order("no_soalan", { ascending: true }),
        supabase
          .from("mpt4_keputusan")
          .select(
            "id, set_id, user_id, jawapan, esei_penilaian, markah_keseluruhan, markah_penuh, markah_per_bahagian, masa_diambil_minit, status, started_at, submitted_at, completed_at",
          )
          .eq("user_id", user.id)
          .eq("set_id", setId)
          .in("status", ["completed", "submitted"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (setRes.error || soalanRes.error || kepRes.error) {
        setErrorMsg(setRes.error?.message ?? soalanRes.error?.message ?? kepRes.error?.message ?? "Ralat");
        setPhase("error");
        return;
      }
      const kep = kepRes.data as Mpt4Keputusan | null;
      const soalan = (soalanRes.data ?? []) as Mpt4Soalan[];
      setSetInfo(setRes.data as Mpt4Set | null);
      setSoalanList(soalan);
      setKeputusan(kep);
      // init sections open
      const opens: Record<string, boolean> = {};
      for (const s of soalan) opens[s.bahagian] = true;
      setOpenBahagian(opens);

      if (!kep) {
        setPhase("empty");
        return;
      }
      if (kep.status === "completed") {
        setPhase("done");
      } else {
        setPhase("grading");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setId]);

  // Grading effect
  useEffect(() => {
    if (phase !== "grading" || !keputusan || !soalanList || !setInfo) return;
    let cancelled = false;
    (async () => {
      try {
        const jawapan = keputusan.jawapan ?? {};

        // 1. Dikotomus: mark client-side
        const dikotomusMarks: Record<string, number> = {};
        for (const s of soalanList) {
          if (s.kaedah_penskoran !== "dikotomus") continue;
          const murid = (jawapan[s.id] ?? "").trim().toUpperCase();
          const betul = (s.jawapan_betul ?? "").trim().toUpperCase();
          dikotomusMarks[s.id] =
            murid.length > 0 && betul.length > 0 && murid === betul ? s.markah : 0;
        }

        // 2. AI grading for analitikal/holistik that have an answer
        const eseiSoalan = soalanList.filter(
          (s) =>
            (s.kaedah_penskoran === "analitikal" || s.kaedah_penskoran === "holistik") &&
            (jawapan[s.id] ?? "").trim().length > 0,
        );

        if (eseiSoalan.length > 0) {
          await runBatched(eseiSoalan, 3, async (s) => {
            try {
              await supabase.functions.invoke("mpt4-nilai-esei", {
                body: { keputusan_id: keputusan.id, soalan_id: s.id },
              });
            } catch (e) {
              // continue; missing eval will count as 0
              console.error("mpt4-nilai-esei failed for", s.id, e);
            }
            return null;
          });
        }

        if (cancelled) return;

        // 3. Refetch esei_penilaian
        const { data: refetched, error: refErr } = await supabase
          .from("mpt4_keputusan")
          .select("esei_penilaian")
          .eq("id", keputusan.id)
          .maybeSingle();
        if (refErr) throw refErr;
        const eseiPenilaian = (refetched?.esei_penilaian ?? {}) as Record<string, EseiPenilaianItem>;

        // 4. Totals
        const markPerSoalan: Record<string, number> = { ...dikotomusMarks };
        for (const s of soalanList) {
          if (s.kaedah_penskoran === "dikotomus") continue;
          const item = eseiPenilaian[s.id];
          const m = typeof item?.markah === "number" ? Math.max(0, Math.min(s.markah, item.markah)) : 0;
          markPerSoalan[s.id] = m;
        }

        const markahPerBahagian: Record<string, { markah_diperoleh: number; markah_penuh: number }> = {};
        for (const s of soalanList) {
          const b = s.bahagian;
          if (!markahPerBahagian[b]) markahPerBahagian[b] = { markah_diperoleh: 0, markah_penuh: 0 };
          markahPerBahagian[b].markah_diperoleh += markPerSoalan[s.id] ?? 0;
          markahPerBahagian[b].markah_penuh += s.markah;
        }

        const markahKeseluruhan = Object.values(markPerSoalan).reduce((a, b) => a + b, 0);
        const markahPenuh =
          setInfo.jumlah_markah ?? soalanList.reduce((acc, s) => acc + s.markah, 0);

        const completedAt = new Date();
        const startedAt = keputusan.started_at ? new Date(keputusan.started_at) : completedAt;
        const masaMinit = Math.max(
          0,
          Math.round((completedAt.getTime() - startedAt.getTime()) / 60000),
        );

        const { error: upErr } = await supabase
          .from("mpt4_keputusan")
          .update({
            markah_keseluruhan: markahKeseluruhan,
            markah_penuh: markahPenuh,
            markah_per_bahagian: markahPerBahagian,
            status: "completed",
            completed_at: completedAt.toISOString(),
            masa_diambil_minit: masaMinit,
          })
          .eq("id", keputusan.id);
        if (upErr) throw upErr;

        if (cancelled) return;
        setKeputusan({
          ...keputusan,
          esei_penilaian: eseiPenilaian,
          markah_keseluruhan: markahKeseluruhan,
          markah_penuh: markahPenuh,
          markah_per_bahagian: markahPerBahagian,
          status: "completed",
          completed_at: completedAt.toISOString(),
          masa_diambil_minit: masaMinit,
        });
        setPhase("done");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Ralat semasa menyemak");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, keputusan, soalanList, setInfo]);

  const bahagianGroups = useMemo(() => {
    if (!soalanList) return [];
    const map = new Map<string, Mpt4Soalan[]>();
    for (const s of soalanList) {
      const arr = map.get(s.bahagian) ?? [];
      arr.push(s);
      map.set(s.bahagian, arr);
    }
    return Array.from(map.entries()).map(([bahagian, items]) => ({ bahagian, items }));
  }, [soalanList]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  if (!darjah || !subjek) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Tidak dijumpai</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-6">
        <Link
          to="/darjah/$darjahId/percubaan-mpt4/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Senarai Set
        </Link>

        {phase === "loading" && (
          <p className="mt-8 text-muted-foreground">Memuatkan keputusan...</p>
        )}

        {phase === "error" && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Ralat: {errorMsg}
          </div>
        )}

        {phase === "empty" && (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/60 bg-card p-10 text-center shadow-card">
            <div className="text-5xl">📭</div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Belum ada jawapan dihantar untuk set ini
            </h2>
            <p className="text-sm text-muted-foreground">
              Sila jawab dan hantar set ini dahulu untuk melihat keputusan.
            </p>
            <Link
              to="/darjah/$darjahId/percubaan-mpt4/$subjekId"
              params={{ darjahId, subjekId }}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Senarai Set
            </Link>
          </div>
        )}

        {phase === "grading" && (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/60 bg-card p-10 text-center shadow-card">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Sedang menyemak jawapan anda... ⏳
            </h2>
            <p className="text-sm text-muted-foreground">
              Kami sedang menilai jawapan esei anda dengan AI. Sila tunggu sebentar — jangan tutup halaman ini.
            </p>
          </div>
        )}

        {phase === "done" && keputusan && soalanList && setInfo && (
          <ResultView
            keputusan={keputusan}
            soalanList={soalanList}
            setInfo={setInfo}
            subjekTone={subjek.tone}
            bahagianGroups={bahagianGroups}
            openBahagian={openBahagian}
            setOpenBahagian={setOpenBahagian}
          />
        )}
      </main>
    </div>
  );
}

function ResultView({
  keputusan,
  soalanList,
  setInfo,
  subjekTone,
  bahagianGroups,
  openBahagian,
  setOpenBahagian,
}: {
  keputusan: Mpt4Keputusan;
  soalanList: Mpt4Soalan[];
  setInfo: Mpt4Set;
  subjekTone: keyof typeof TONE_GRADIENT;
  bahagianGroups: { bahagian: string; items: Mpt4Soalan[] }[];
  openBahagian: Record<string, boolean>;
  setOpenBahagian: (v: Record<string, boolean>) => void;
}) {
  const markahKeseluruhan = keputusan.markah_keseluruhan ?? 0;
  const markahPenuh = keputusan.markah_penuh ?? setInfo.jumlah_markah ?? 0;
  const peratus = markahPenuh > 0 ? Math.round((markahKeseluruhan / markahPenuh) * 100) : 0;
  const bandClass =
    peratus >= 80
      ? "from-emerald-500 to-green-600"
      : peratus >= 50
      ? "from-amber-500 to-orange-500"
      : "from-rose-500 to-red-600";
  const bandLabel =
    peratus >= 80 ? "Cemerlang 🌟" : peratus >= 50 ? "Baik — teruskan usaha!" : "Perlu latihan lagi 💪";

  const jawapan = keputusan.jawapan ?? {};
  const esei = keputusan.esei_penilaian ?? {};
  const perBahagian = keputusan.markah_per_bahagian ?? {};

  // Recompute per-question marks for display
  const markPerSoalan = new Map<string, number>();
  for (const s of soalanList) {
    if (s.kaedah_penskoran === "dikotomus") {
      const murid = (jawapan[s.id] ?? "").trim().toUpperCase();
      const betul = (s.jawapan_betul ?? "").trim().toUpperCase();
      markPerSoalan.set(s.id, murid.length > 0 && murid === betul ? s.markah : 0);
    } else {
      const item = esei[s.id];
      const m = typeof item?.markah === "number" ? Math.max(0, Math.min(s.markah, item.markah)) : 0;
      markPerSoalan.set(s.id, m);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Skor keseluruhan */}
      <div className={`rounded-3xl bg-gradient-to-br ${bandClass} p-6 text-white shadow-card md:p-8`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-bold uppercase tracking-wide opacity-90">
              {setInfo.tajuk || `Set ${setInfo.nombor_set}`}
            </div>
            <div className="mt-2 font-display text-5xl font-extrabold leading-none md:text-6xl">
              {markahKeseluruhan} <span className="opacity-80">/ {markahPenuh}</span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold">{peratus}%</div>
            <div className="mt-1 text-sm font-bold opacity-95">{bandLabel}</div>
          </div>
          {keputusan.masa_diambil_minit != null && (
            <div className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur">
              ⏱ {keputusan.masa_diambil_minit} minit
            </div>
          )}
        </div>
      </div>

      {/* Pecahan bahagian */}
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card md:p-6">
        <h3 className="font-display text-lg font-extrabold text-foreground">Pecahan Bahagian</h3>
        <div className="mt-3 flex flex-col gap-3">
          {Object.entries(perBahagian).map(([bahagian, b]) => {
            const pct = b.markah_penuh > 0 ? Math.round((b.markah_diperoleh / b.markah_penuh) * 100) : 0;
            return (
              <div key={bahagian}>
                <div className="flex items-center justify-between text-sm font-bold text-foreground">
                  <span>Bahagian {bahagian}</span>
                  <span className="tabular-nums">
                    {b.markah_diperoleh} / {b.markah_penuh} <span className="text-muted-foreground">({pct}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full bg-gradient-to-r ${TONE_GRADIENT[subjekTone]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Senarai soalan */}
      {bahagianGroups.map(({ bahagian, items }) => {
        const isOpen = openBahagian[bahagian] ?? true;
        return (
          <section key={bahagian} className="rounded-3xl border border-border/60 bg-card p-5 shadow-card md:p-6">
            <button
              type="button"
              onClick={() => setOpenBahagian({ ...openBahagian, [bahagian]: !isOpen })}
              className="flex w-full items-center justify-between gap-3"
            >
              <h3 className="font-display text-xl font-extrabold text-primary">Bahagian {bahagian}</h3>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {isOpen && (
              <div className="mt-4 flex flex-col gap-4">
                {items.map((s) => (
                  <ReviewCard
                    key={s.id}
                    soalan={s}
                    jawapanMurid={jawapan[s.id] ?? ""}
                    markahDiperoleh={markPerSoalan.get(s.id) ?? 0}
                    eseiItem={esei[s.id]}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

    </div>
  );
}

function ReviewCard({
  soalan,
  jawapanMurid,
  markahDiperoleh,
  eseiItem,
}: {
  soalan: Mpt4Soalan;
  jawapanMurid: string;
  markahDiperoleh: number;
  eseiItem: EseiPenilaianItem | undefined;
}) {
  const { bm, en } = splitBilingual(soalan.teks_soalan);
  const isDikotomus = soalan.kaedah_penskoran === "dikotomus";
  const betul = isDikotomus && jawapanMurid.trim().toUpperCase() === (soalan.jawapan_betul ?? "").trim().toUpperCase() && jawapanMurid.trim().length > 0;

  return (
    <article className="rounded-2xl border border-border/60 bg-background/50 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 font-display text-xs font-extrabold text-primary-foreground">
            {soalan.no_soalan}
          </span>
          {soalan.sub_bahagian && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {soalan.sub_bahagian}
            </span>
          )}
          {isDikotomus && (
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                betul ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              }`}
            >
              {betul ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 font-display text-[11px] font-extrabold ${
            markahDiperoleh === soalan.markah
              ? "bg-emerald-100 text-emerald-700"
              : markahDiperoleh > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {markahDiperoleh} / {soalan.markah} markah
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{bm}</p>
        {en && <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground whitespace-pre-wrap">{en}</p>}
      </div>

      {soalan.stimulus_svg ? (
        <div className="mt-3 flex justify-center rounded-2xl border border-border/60 bg-card p-3">
          {renderSoalanSvg(soalan.stimulus_svg.svg_type, soalan.stimulus_svg.params, soalan.stimulus_svg.bahasa)}
        </div>
      ) : soalan.stimulus_keterangan ? (
        <div className="mt-3 rounded-2xl border-2 border-dashed border-border/70 bg-muted/30 p-3">
          <div className="mb-1 text-[10px] font-bold text-muted-foreground">
            📊 Rajah/Jadual (belum siap dilukis)
          </div>
          <p className="text-xs italic text-muted-foreground whitespace-pre-wrap">
            {soalan.stimulus_keterangan}
          </p>
        </div>
      ) : null}

      <div className="mt-3 space-y-2 text-sm">
        <div className="rounded-xl bg-secondary/60 px-3 py-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Jawapan anda</div>
          <div className="mt-0.5 whitespace-pre-wrap text-foreground">
            {jawapanMurid.trim().length > 0 ? jawapanMurid : <span className="italic text-muted-foreground">Tiada jawapan</span>}
          </div>
        </div>

        {isDikotomus && !betul && soalan.jawapan_betul && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Jawapan betul</div>
            <div className="mt-0.5 whitespace-pre-wrap text-emerald-800">{soalan.jawapan_betul}</div>
          </div>
        )}

        {!isDikotomus && eseiItem && (
          <div className="rounded-xl bg-primary/5 px-3 py-2">
            {eseiItem.band && (
              <div className="mb-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                Band: {eseiItem.band}
              </div>
            )}
            {eseiItem.kekuatan && (
              <div className="mt-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">✨ Kekuatan: </span>
                <span className="text-foreground">{eseiItem.kekuatan}</span>
              </div>
            )}
            {eseiItem.cadangan_penambahbaikan && (
              <div className="mt-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">💡 Cadangan: </span>
                <span className="text-foreground">{eseiItem.cadangan_penambahbaikan}</span>
              </div>
            )}
          </div>
        )}

        {!isDikotomus && !eseiItem && jawapanMurid.trim().length > 0 && (
          <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Penilaian AI belum tersedia untuk soalan ini.
          </div>
        )}
      </div>
    </article>
  );
}
