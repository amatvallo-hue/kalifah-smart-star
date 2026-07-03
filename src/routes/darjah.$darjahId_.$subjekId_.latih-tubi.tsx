import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Square, Play } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";
import { tambahMata } from "@/lib/tambah-mata";
import { usePoints } from "@/hooks/use-points";
import { JamAnalog } from "@/components/svg/JamAnalog";
import { Bentuk2D } from "@/components/svg/Bentuk2D";
import { Bentuk3D } from "@/components/svg/Bentuk3D";
import { LabeledDiagram } from "@/components/svg/LabeledDiagram";
import { MagnetDiagram } from "@/components/svg/MagnetDiagram";
import { DacingScale } from "@/components/svg/DacingScale";
import { PecahanDiagram } from "@/components/svg/PecahanDiagram";
import { BarisanPanjang } from "@/components/svg/BarisanPanjang";
import { BekasAir } from "@/components/svg/BekasAir";
import { CahayaBayang } from "@/components/svg/CahayaBayang";
import { LitarElektrik } from "@/components/svg/LitarElektrik";
import { KetumpatanDiagram } from "@/components/svg/KetumpatanDiagram";
import { SistemSuria } from "@/components/svg/SistemSuria";
import { PerimeterLuas } from "@/components/svg/PerimeterLuas";
import { SudutGaris } from "@/components/svg/SudutGaris";
import { IsiPaduPepejal } from "@/components/svg/IsiPaduPepejal";
import { FasaBulan } from "@/components/svg/FasaBulan";
import { KeadaanJirim } from "@/components/svg/KeadaanJirim";
import { GerhanaDiagram } from "@/components/svg/GerhanaDiagram";
import { RajahDaya } from "@/components/svg/RajahDaya";
import { RajahKestabilan } from "@/components/svg/RajahKestabilan";
import { RantaiMakanan } from "@/components/svg/RantaiMakanan";

function renderSoalanSvg(svg_type?: string | null, svg_params?: any) {
  if (!svg_type) return null;
  const p = svg_params ?? {};
  if (svg_type === "jam") return <JamAnalog {...p} />;
  if (svg_type === "bentuk2d") return <Bentuk2D {...p} />;
  if (svg_type === "bentuk3d") return <Bentuk3D {...p} />;
  if (svg_type === "label_diagram") return <LabeledDiagram {...p} />;
  if (svg_type === "magnet") return <MagnetDiagram {...p} />;
  if (svg_type === "dacing") return <DacingScale {...p} />;
  if (svg_type === "pecahan") return <PecahanDiagram {...p} />;
  if (svg_type === "panjang") return <BarisanPanjang {...p} />;
  if (svg_type === "air") return <BekasAir {...p} />;
  if (svg_type === "cahaya") return <CahayaBayang {...p} />;
  if (svg_type === "litar") return <LitarElektrik {...p} />;
  if (svg_type === "ketumpatan") return <KetumpatanDiagram {...p} />;
  if (svg_type === "sistem_suria") return <SistemSuria />;
  if (svg_type === "perimeter_luas") return <PerimeterLuas {...p} />;
  if (svg_type === "sudut_garis") return <SudutGaris {...p} />;
  if (svg_type === "isi_padu_pepejal") return <IsiPaduPepejal {...p} />;
  if (svg_type === "fasa_bulan") return <FasaBulan {...p} />;
  if (svg_type === "keadaan_jirim") return <KeadaanJirim {...p} />;
  if (svg_type === "gerhana") return <GerhanaDiagram {...p} />;
  if (svg_type === "daya") return <RajahDaya {...p} />;
  if (svg_type === "kestabilan") return <RajahKestabilan {...p} />;
  if (svg_type === "rantai_makanan") return <RantaiMakanan {...p} />;
  return null;
}

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/latih-tubi")({
  head: () => ({ meta: [{ title: "Latih Tubi — Kalifah.my" }] }),
  ssr: false,
  component: LatihTubiPage,
});

interface Soalan {
  id: string;
  soalan: string;
  pilihan: string[];
  jawapan: number;
  topik?: string | null;
  feedback_a?: string | null;
  feedback_b?: string | null;
  feedback_c?: string | null;
  feedback_d?: string | null;
  gambar?: string | null;
  svg_type?: string | null;
  svg_params?: any;
}

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const SETS = ["25A", "25B", "25C", "25D"] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function letterToIdx(l: string): number {
  return ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(l).toUpperCase()] ?? 0;
}

function LatihTubiPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/latih-tubi" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}`, locked: false };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId };
  const mata = usePoints();

  const isUpper = false;
  const isMatematik = subjekId === "matematik";
  const isSains = subjekId === "sains";
  const isEnglish = subjekId === 'bahasa-inggeris';
  const showBahasaToggle = isSains || isMatematik;
  const [bahasa, setBahasa] = useState<"bm" | "en" | null>(showBahasaToggle ? null : "bm");
  const subjekCode = subjekId === "sains" ? (bahasa === "en" ? "SC-EN" : "SC") : subjekId;
  const darjahNum = Number(darjahId);

  const [bank, setBank] = useState<Soalan[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [jawab, setJawab] = useState(0);
  const [berhenti, setBerhenti] = useState(false);
  const [fetching, setFetching] = useState(!showBahasaToggle);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [topikStats, setTopikStats] = useState<Record<string, { betul: number; jumlah: number }>>({});
  const [mulaMasa, setMulaMasa] = useState(() => Date.now());
  const [rajahMap, setRajahMap] = useState<Record<string, string>>({});

  // Upper-darjah selection state
  const [topicList, setTopicList] = useState<string[]>([]);
  const [topik, setTopik] = useState<string>("");
  const [setLabel, setSetLabel] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(isUpper);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (berhenti && jawab > 0) {
      const masaSec = Math.round((Date.now() - mulaMasa) / 1000);
      if (isUpper && topik) {
        // Upper darjah: satu topik untuk seluruh sesi
        simpanProgress({
          darjah: darjahId,
          subjek: subjekId,
          aktiviti: "latih-tubi",
          markah: betul,
          jumlahSoalan: jawab,
          masaAmbil: masaSec,
          topik,
        });
      } else {
        const entries = Object.entries(topikStats);
        if (entries.length > 0) {
          // Lower darjah: satu row per topik (cumulative accumulate)
          const masaPerSoalan = jawab > 0 ? masaSec / jawab : 0;
          entries.forEach(([t, s]) => {
            simpanProgress({
              darjah: darjahId,
              subjek: subjekId,
              aktiviti: "latih-tubi",
              markah: s.betul,
              jumlahSoalan: s.jumlah,
              masaAmbil: Math.round(masaPerSoalan * s.jumlah),
              topik: t,
            });
          });
        } else {
          // Fallback: tiada topik pada soalan
          simpanProgress({
            darjah: darjahId,
            subjek: subjekId,
            aktiviti: "latih-tubi",
            markah: betul,
            jumlahSoalan: jawab,
            masaAmbil: masaSec,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [berhenti]);

  // Lower darjah (1-3): existing behaviour from soalan_latih_tubi
  useEffect(() => {
    if (isUpper) return;
    if (showBahasaToggle && !bahasa) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const subjekQuery =
        isMatematik
          ? bahasa === "en"
            ? "matematik-en"
            : "matematik"
          : subjekId === "sains" && bahasa === "en"
            ? "sains-en"
            : subjekId;
      const { data, error } = await supabase
        .from("soalan_latih_tubi")
        .select("id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, topik, feedback_a, feedback_b, feedback_c, feedback_d, gambar, svg_type, svg_params")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekQuery)
        .not("feedback_a", "is", null)
        .neq("feedback_a", "");
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setFetching(false);
        return;
      }
      const rows = (data ?? []).map((r: any) => ({
        id: r.id as string,
        soalan: r.soalan as string,
        pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
        jawapan: letterToIdx(r.jawapan_betul),
        topik: (r.topik ?? null) as string | null,
        feedback_a: (r.feedback_a ?? null) as string | null,
        feedback_b: (r.feedback_b ?? null) as string | null,
        feedback_c: (r.feedback_c ?? null) as string | null,
        feedback_d: (r.feedback_d ?? null) as string | null,
        gambar: (r.gambar ?? null) as string | null,
        svg_type: (r.svg_type ?? null) as string | null,
        svg_params: r.svg_params ?? null,
      }));
      const shuffled = shuffle(rows);
      setBank(shuffled);
      setOrder(shuffle(shuffled.map((_, i) => i)));
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahId, subjekId, isUpper, darjahNum, isMatematik, bahasa]);

  useEffect(() => {
    const keys = Array.from(new Set(bank.map(s => s.gambar).filter((g): g is string => !!g)));
    if (keys.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("rajah")
        .select("nama, konten_svg")
        .in("nama", keys);
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.nama] = r.konten_svg; });
      setRajahMap(map);
    })();
    return () => { cancelled = true; };
  }, [bank]);


  // Upper darjah (4-6): fetch distinct topik list
  useEffect(() => {
    if (!isUpper) return;
    let cancelled = false;
    (async () => {
      setLoadingTopics(true);
      const { data, error } = await supabase
        .from("latih_tubi_soalan")
        .select("topik")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekCode);
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setLoadingTopics(false);
        return;
      }
      const uniq = Array.from(
        new Set((data ?? []).map((r: any) => r.topik).filter((t: any): t is string => !!t)),
      ).sort();
      setTopicList(uniq);
      setLoadingTopics(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isUpper, darjahId, subjekId, darjahNum, subjekCode]);

  async function mulaLatihan() {
    if (!topik || !setLabel) return;
    setFetching(true);
    setErrMsg(null);
    const { data, error } = await supabase
      .from("latih_tubi_soalan")
      .select("id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan, topik, set_label")
      .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
      .eq("subjek", subjekCode)
      .eq("topik", topik)
      .eq("set_label", setLabel);
    if (error) {
      setErrMsg(error.message);
      setFetching(false);
      return;
    }
    const rows = (data ?? []).map((r: any) => ({
      id: r.id as string,
      soalan: r.soalan as string,
      pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
      jawapan: letterToIdx(r.jawapan),
    }));
    const shuffled = shuffle(rows);
    setBank(shuffled);
    setOrder(shuffled.map((_, i) => i));
    setCursor(0);
    setPilih(null);
    setBetul(0);
    setSalah(0);
    setJawab(0);
    setTopikStats({});
    setBerhenti(false);
    setMulaMasa(Date.now());
    setStarted(true);
    setFetching(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{isEnglish ? "Loading..." : "Memuatkan..."}</p>
      </div>
    );
  }

  const soalan = bank.length > 0 ? bank[order[cursor % order.length]] : null;

  const handlePilih = (idx: number) => {
    if (pilih !== null || !soalan) return;
    setPilih(idx);
    const isBetul = idx === soalan.jawapan;
    if (isBetul) setBetul((b) => b + 1);
    if (isBetul && user) {
      tambahMata({ userId: user.id, mata: 1, sumber: "latih-tubi", darjah: darjahId, subjek: subjekId });
    }
    else setSalah((s) => s + 1);
    setJawab((j) => j + 1);
    const tpk = soalan.topik;
    if (tpk) {
      setTopikStats((prev) => {
        const cur = prev[tpk] ?? { betul: 0, jumlah: 0 };
        return { ...prev, [tpk]: { betul: cur.betul + (isBetul ? 1 : 0), jumlah: cur.jumlah + 1 } };
      });
    }
    if (isBetul) {
      setTimeout(() => {
        setPilih(null);
        setCursor((c) => {
          const next = c + 1;
          if (next >= order.length) {
            // Re-shuffle for replay loop
            const reshuffled = shuffle(bank);
            setBank(reshuffled);
            setOrder(reshuffled.map((_, i) => i));
            return 0;
          }
          return next;
        });
      }, 1500);
    }
  };

  const goToNext = () => {
    setPilih(null);
    setCursor((c) => {
      const next = c + 1;
      if (next >= order.length) {
        const reshuffled = shuffle(bank);
        setBank(reshuffled);
        setOrder(reshuffled.map((_, i) => i));
        return 0;
      }
      return next;
    });
  };

  const needBahasa = showBahasaToggle && !bahasa && !started;
  const en = bahasa === "en" || isEnglish;
  const t = {
    dijawab: en ? "ANSWERED" : "Dijawab",
    betul: en ? "CORRECT" : "Betul",
    salah: en ? "WRONG" : "Salah",
    berhenti: en ? "Stop" : "Berhenti",
    seterusnya: en ? "Next" : "Seterusnya",
    tamat: en ? "Finish" : "Tamat",
    cubaLagi: en ? "Try Again" : "Cuba Lagi",
    syabas: en ? "Well done! 🎉" : "Syabas! 🎉",
    dahJawab: (n: number) => en ? `You answered ${n} questions.` : `Kamu dah jawab ${n} soalan.`,
    pilihSetLain: en ? "Choose Another Set" : "Pilih Set Lain",
    aktivitiLain: en ? "Other Activities" : "Aktiviti Lain",
    kembali: en ? "Back to Activities" : "Kembali ke Aktiviti",
    latihTubi: en ? "Practice" : "Latih Tubi",
    memuatkanSoalan: en ? "Loading questions..." : "Memuatkan soalan...",
    belumAdaSoalan: en ? "No questions yet" : "Belum ada soalan",
    sedangDisediakan: (s: string, d: string) =>
      en
        ? `Practice questions for ${s} (${d}) are being prepared.`
        : `Soalan Latih Tubi untuk ${s} (${d}) sedang disediakan.`,
    ralat: en ? "Error" : "Ralat",
  };
  const showPicker = isUpper && !started && !needBahasa;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.kembali}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-4 py-1.5 font-display text-xs font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            {darjah.label}
          </span>
          <span
            className="rounded-full px-4 py-1.5 font-display text-xs font-extrabold shadow-soft"
            style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
          >
            {subjek.title}
          </span>
          <span
            className="rounded-full px-4 py-1.5 font-display text-xs font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            {t.latihTubi}
          </span>
          {isUpper && started && topik && setLabel && (
            <>
              <span className="rounded-full bg-secondary px-4 py-1.5 font-display text-xs font-extrabold text-foreground shadow-soft">
                {topik}
              </span>
              <span className="rounded-full bg-secondary px-4 py-1.5 font-display text-xs font-extrabold text-foreground shadow-soft">
                Set {setLabel}
              </span>
            </>
          )}
        </div>

        {needBahasa ? (
          <div className="mt-8 rounded-3xl bg-card p-6 text-center shadow-card md:p-8">
            <h2 className="font-display text-2xl font-extrabold text-foreground">Pilih Bahasa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih bahasa untuk latih tubi {subjek.title} {darjah.label}.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setBahasa("bm")}
                className="rounded-3xl border-2 px-6 py-8 font-display text-xl font-extrabold shadow-soft transition hover:-translate-y-1"
                style={{ borderColor: `${HIJAU}44`, color: HIJAU, backgroundColor: `${HIJAU}10` }}
              >
                🇲🇾 Bahasa Melayu
              </button>
              <button
                onClick={() => setBahasa("en")}
                className="rounded-3xl border-2 px-6 py-8 font-display text-xl font-extrabold shadow-soft transition hover:-translate-y-1"
                style={{ borderColor: `${EMAS}44`, color: EMAS, backgroundColor: `${EMAS}10` }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        ) : showPicker ? (
          <div className="mt-8 rounded-3xl bg-card p-6 shadow-card md:p-8">
            {showBahasaToggle && bahasa && (
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 font-display text-xs font-extrabold text-white"
                  style={{ backgroundColor: bahasa === "en" ? EMAS : HIJAU }}
                >
                  {bahasa === "en" ? "🇬🇧 English" : "🇲🇾 Bahasa Melayu"}
                </span>
                <button
                  onClick={() => {
                    setBahasa(null);
                    setTopik("");
                    setSetLabel("");
                  }}
                  className="text-xs font-bold text-muted-foreground underline hover:text-primary"
                >
                  Tukar bahasa
                </button>
              </div>
            )}
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Pilih Topik & Set
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih topik dan set soalan untuk mula latih tubi.
            </p>

            <div className="mt-6">
              <label className="font-display text-sm font-extrabold text-foreground">
                Topik
              </label>
              {loadingTopics ? (
                <p className="mt-2 text-sm text-muted-foreground">Memuatkan topik...</p>
              ) : topicList.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Belum ada topik untuk {subjek.title} ({darjah.label}).
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {topicList.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopik(t)}
                      className="rounded-full border-2 px-4 py-2 text-sm font-bold transition"
                      style={{
                        borderColor: topik === t ? HIJAU : "hsl(var(--border))",
                        backgroundColor: topik === t ? `${HIJAU}15` : "transparent",
                        color: topik === t ? HIJAU : undefined,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="font-display text-sm font-extrabold text-foreground">Set</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SETS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSetLabel(s)}
                    className="rounded-2xl border-2 px-4 py-3 font-display font-extrabold transition"
                    style={{
                      borderColor: setLabel === s ? EMAS : "hsl(var(--border))",
                      backgroundColor: setLabel === s ? `${EMAS}25` : "transparent",
                      color: setLabel === s ? "#7a5300" : undefined,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {errMsg && (
              <p className="mt-4 text-sm text-destructive">Ralat: {errMsg}</p>
            )}

            <button
              onClick={mulaLatihan}
              disabled={!topik || !setLabel || fetching}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-lg font-extrabold text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: HIJAU }}
            >
              <Play className="h-5 w-5" />
              {fetching ? "Memuatkan..." : "Mula Latih Tubi"}
            </button>
          </div>
        ) : fetching ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <p className="text-muted-foreground">{t.memuatkanSoalan}</p>
          </div>
        ) : errMsg ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-xl font-extrabold text-destructive">{t.ralat}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.ralat}: {errMsg}</p>
          </div>
        ) : bank.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-xl font-extrabold text-foreground">{t.belumAdaSoalan}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.sedangDisediakan(subjek.title, darjah.label)}
            </p>
          </div>
        ) : berhenti ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
              {t.syabas}
            </h2>
            <p className="mt-2 text-muted-foreground">{t.dahJawab(jawab)}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ backgroundColor: `${HIJAU}15` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HIJAU }}>{t.betul}</p>
                <p className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>{betul}</p>
              </div>
              <div className="rounded-2xl bg-destructive/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-destructive">{t.salah}</p>
                <p className="font-display text-3xl font-extrabold text-destructive">{salah}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  if (isUpper) {
                    setStarted(false);
                    setBank([]);
                    setOrder([]);
                    setBetul(0);
                    setSalah(0);
                    setJawab(0);
                    setTopikStats({});
                    setCursor(0);
                    setPilih(null);
                    setBerhenti(false);
                  } else {
                    setBetul(0);
                    setSalah(0);
                    setJawab(0);
                    setTopikStats({});
                    setCursor(0);
                    setPilih(null);
                    setMulaMasa(Date.now());
                    setOrder(shuffle(bank.map((_, i) => i)));
                    setBerhenti(false);
                  }
                }}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: HIJAU }}
              >
                {isUpper ? t.pilihSetLain : t.cubaLagi}
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full px-6 py-3 font-display font-extrabold shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
              >
                {t.aktivitiLain}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  {t.dijawab}
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>
                  {jawab}
                </p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${EMAS}25`, border: `2px solid ${EMAS}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7a5300" }}>
                  {t.betul}
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: "#7a5300" }}>
                  {betul}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">{t.salah}</p>
                <p className="font-display text-2xl font-extrabold text-destructive">{salah}</p>
              </div>
            </div>

            {soalan && (
              <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
                {soalan.gambar && rajahMap[soalan.gambar] && (
                  <div
                    className="mx-auto mb-4 flex max-w-xs justify-center overflow-hidden rounded-2xl border border-border bg-white p-3"
                    dangerouslySetInnerHTML={{ __html: rajahMap[soalan.gambar] }}
                  />
                )}
                {soalan.svg_type && (
                  <div className="mx-auto mb-4 flex justify-center">
                    {renderSoalanSvg(soalan.svg_type, soalan.svg_params)}
                  </div>
                )}
                <h1 className="font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl">
                  {soalan.soalan}
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {soalan.pilihan.map((p, idx) => {
                    const isPilih = pilih === idx;
                    const showBetul = pilih !== null && idx === soalan.jawapan;
                    const showSalah = isPilih && idx !== soalan.jawapan;
                    return (
                      <button
                        key={idx}
                        onClick={() => handlePilih(idx)}
                        disabled={pilih !== null}
                        className="group flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left font-bold transition disabled:cursor-not-allowed"
                        style={{
                          borderColor: showBetul ? HIJAU : showSalah ? "hsl(var(--destructive))" : "hsl(var(--border))",
                          backgroundColor: showBetul
                            ? `${HIJAU}15`
                            : showSalah
                              ? "hsl(var(--destructive) / 0.1)"
                              : "hsl(var(--background))",
                          color: showBetul ? HIJAU : showSalah ? "hsl(var(--destructive))" : undefined,
                        }}
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold text-white"
                          style={{
                            backgroundColor: showBetul
                              ? HIJAU
                              : showSalah
                                ? "hsl(var(--destructive))"
                                : EMAS,
                            color: showBetul || showSalah ? "#fff" : "#1a1a1a",
                          }}
                        >
                          {showBetul ? <Check className="h-5 w-5" /> : showSalah ? <X className="h-5 w-5" /> : String.fromCharCode(65 + idx)}
                        </span>
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>

                {pilih !== null && (
                  <>
                    {(() => {
                      const fbMap: Record<number, string | null | undefined> = {
                        0: soalan.feedback_a,
                        1: soalan.feedback_b,
                        2: soalan.feedback_c,
                        3: soalan.feedback_d,
                      };
                      const isBetulPilih = pilih === soalan.jawapan;
                      const fb = fbMap[pilih];
                      if (!fb) return null;
                      return (
                        <div
                          className="mt-4 rounded-2xl border-2 p-4 text-sm font-medium"
                          style={isBetulPilih
                            ? { borderColor: "#1B8A5A", backgroundColor: "#1B8A5A15", color: "#0f5a39" }
                            : { borderColor: "#f59e0b", backgroundColor: "#fffbeb", color: "#92400e" }}
                        >
                          {fb}
                        </div>
                      );
                    })()}
                    {pilih !== soalan.jawapan && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={goToNext}
                          className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold shadow-soft transition hover:opacity-90"
                          style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
                        >
                          {t.seterusnya}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setBerhenti(true)}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: HIJAU }}
              >
                <Square className="h-4 w-4 fill-current" />
                {t.berhenti}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
