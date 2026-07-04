import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, X, Square, ImageIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";
import { tambahMata } from "@/lib/tambah-mata";
import { renderSoalanSvg } from "@/lib/render-soalan-svg";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/bergambar-rajah")({
  head: () => ({ meta: [{ title: "Soalan Bergambar Rajah — Kalifah.my" }] }),
  ssr: false,
  component: BergambarRajahPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const BUCKET = "soalan-gambar-rajah";

interface Soalan {
  id: string;
  no_soalan: number;
  soalan: string;
  pilihan: string[];
  jawapan: number;
  feedback_a?: string | null;
  feedback_b?: string | null;
  feedback_c?: string | null;
  feedback_d?: string | null;
}

interface Rangsangan {
  rangsangan_id: string;
  rangsangan_jenis: string;
  rangsangan_teks: string | null;
  rangsangan_gambar_id: string | null;
  rangsangan_svg_type: string | null;
  rangsangan_svg_params: any;
  topik_kod: string | null;
  topik_nama: string | null;
  soalan: Soalan[];
}

function letterToIdx(l: string): number {
  return ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(l).toUpperCase()] ?? 0;
}

function BrokenImageFallback({ alt }: { alt: string }) {
  return (
    <div className="flex h-[220px] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl">🖼️</span>
        <span className="text-xs font-medium">{alt}</span>
      </div>
    </div>
  );
}

function Gambar({ id, alt }: { id: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  const url = useMemo(
    () => supabase.storage.from(BUCKET).getPublicUrl(`${id}.png`).data.publicUrl,
    [id],
  );
  if (broken) return <BrokenImageFallback alt={alt} />;
  return (
    <img
      src={url}
      alt={alt}
      onError={() => setBroken(true)}
      className="mx-auto max-h-[320px] w-auto max-w-full rounded-xl bg-white object-contain"
    />
  );
}

function BergambarRajahPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({
    from: "/darjah/$darjahId_/$subjekId_/bergambar-rajah",
  });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}`, locked: false };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId };
  const mata = usePoints();
  const darjahNum = Number(darjahId);

  const [rangsanganList, setRangsanganList] = useState<Rangsangan[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Rangsangan | null>(null);
  const [bahasa, setBahasa] = useState<"bm" | "en" | null>(null);

  const showBahasaToggle = subjekId === "sains" || subjekId === "matematik";

  const en = bahasa === "en";
  const tr = {
    kembali: en ? "Back to Activities" : "Kembali ke Aktiviti",
    pilihBahasa: en ? "Choose Language" : "Pilih Bahasa",
    pilihBahasaDesc: en
      ? `Choose a language for ${subjek.title} ${darjah.label} picture questions.`
      : `Pilih bahasa untuk soalan bergambar rajah ${subjek.title} ${darjah.label}.`,
    pilihSet: en ? "Choose Question Set" : "Pilih Set Soalan",
    pilihSetDesc: en
      ? "Each set has one picture/passage and several related questions."
      : "Setiap set ada satu gambar/petikan dan beberapa soalan berkaitan.",
    badgeTitle: en ? "📖🖼️ Picture Diagram Questions" : "📖🖼️ Soalan Bergambar Rajah",
    soalanCount: (n: number) => (en ? `${n} questions` : `${n} soalan`),
    memuatSoalan: en ? "Loading questions..." : "Memuatkan soalan...",
    ralat: en ? "Error" : "Ralat",
    tiadaSoalan: en ? "No picture questions yet" : "Belum ada soalan bergambar",
    tiadaSoalanDesc: en
      ? `Picture questions for ${subjek.title} (${darjah.label}) are being prepared.`
      : `Soalan bergambar untuk ${subjek.title} (${darjah.label}) sedang disediakan.`,
    labelSoalan: en ? "Question" : "Soalan",
    labelBetul: en ? "Correct" : "Betul",
    labelSalah: en ? "Wrong" : "Salah",
    syabas: en ? "Well Done! 🎉" : "Syabas! 🎉",
    syabasDesc: (n: number) =>
      en ? `You've answered ${n} questions from this set.` : `Kamu dah jawab ${n} soalan dari set ini.`,
    pilihSetLain: en ? "Choose Another Set" : "Pilih Set Lain",
    aktivitiLain: en ? "Other Activities" : "Aktiviti Lain",
    seterusnya: en ? "Next" : "Seterusnya",
    selesai: en ? "Finish" : "Selesai",
    berhenti: en ? "Stop" : "Berhenti",
  };

  const subjekKod = (() => {
    if (subjekId === "sains") {
      return bahasa === "en" ? "SC-EN" : bahasa === "bm" ? "SC" : null;
    }
    if (subjekId === "matematik") {
      return bahasa === "en" ? "MT-EN" : bahasa === "bm" ? "MT" : null;
    }
    return subjekId;
  })();

  const [cursor, setCursor] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [berhenti, setBerhenti] = useState(false);
  const [mulaMasa, setMulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (showBahasaToggle && !subjekKod) {
      setRangsanganList([]);
      setLoadingList(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      setErrMsg(null);
      setLoadingList(true);
      setErrMsg(null);
      const { data, error } = await (supabase as any)
        .from("soalan_bergambar_rajah")
        .select(
          "id, rangsangan_id, rangsangan_jenis, rangsangan_teks, rangsangan_gambar_id, rangsangan_svg_type, rangsangan_svg_params, topik_kod, topik_nama, no_soalan, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, feedback_a, feedback_b, feedback_c, feedback_d",
        )
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekKod)
        .order("rangsangan_id", { ascending: true })
        .order("no_soalan", { ascending: true });
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setLoadingList(false);
        return;
      }
      const groups = new Map<string, Rangsangan>();
      for (const r of (data ?? []) as any[]) {
        const key = r.rangsangan_id as string;
        let g = groups.get(key);
        if (!g) {
          g = {
            rangsangan_id: key,
            rangsangan_jenis: r.rangsangan_jenis ?? "gambar",
            rangsangan_teks: r.rangsangan_teks ?? null,
            rangsangan_gambar_id: r.rangsangan_gambar_id ?? null,
            rangsangan_svg_type: r.rangsangan_svg_type ?? null,
            rangsangan_svg_params: r.rangsangan_svg_params ?? null,
            topik_kod: r.topik_kod ?? null,
            topik_nama: r.topik_nama ?? null,
            soalan: [],
          };
          groups.set(key, g);
        }
        g!.soalan.push({
          id: r.id as string,
          no_soalan: Number(r.no_soalan ?? 0),
          soalan: r.soalan as string,
          pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
          jawapan: letterToIdx(r.jawapan_betul),
          feedback_a: r.feedback_a ?? null,
          feedback_b: r.feedback_b ?? null,
          feedback_c: r.feedback_c ?? null,
          feedback_d: r.feedback_d ?? null,
        });
      }
      for (const g of groups.values()) g.soalan.sort((a, b) => a.no_soalan - b.no_soalan);
      setRangsanganList(Array.from(groups.values()));
      setLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahId, subjekId, darjahNum, subjekKod, showBahasaToggle]);

  useEffect(() => {
    if (!selected) return;
    setCursor(0);
    setPilih(null);
    setBetul(0);
    setSalah(0);
    setSelesai(false);
    setBerhenti(false);
    setMulaMasa(Date.now());
  }, [selected]);

  useEffect(() => {
    if ((selesai || berhenti) && selected && betul + salah > 0) {
      const masaSec = Math.round((Date.now() - mulaMasa) / 1000);
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "bergambar-rajah",
        markah: betul,
        jumlahSoalan: betul + salah,
        masaAmbil: masaSec,
        topik: selected.topik_nama ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selesai, berhenti]);

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

  const soalan = selected ? selected.soalan[cursor] : null;

  const handlePilih = (idx: number) => {
    if (pilih !== null || !soalan) return;
    setPilih(idx);
    const isBetul = idx === soalan.jawapan;
    if (isBetul) {
      setBetul((b) => b + 1);
      if (user) {
        tambahMata({
          userId: user.id,
          mata: 1,
          sumber: "bergambar-rajah",
          darjah: darjahId,
          subjek: subjekId,
        });
      }
    } else {
      setSalah((s) => s + 1);
    }
  };

  const goToNext = () => {
    if (!selected) return;
    setPilih(null);
    if (cursor + 1 >= selected.soalan.length) {
      setSelesai(true);
    } else {
      setCursor((c) => c + 1);
    }
  };

  const resetToPicker = () => {
    setSelected(null);
    setCursor(0);
    setPilih(null);
    setBetul(0);
    setSalah(0);
    setSelesai(false);
    setBerhenti(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" />
          {tr.kembali}
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
            style={{ backgroundColor: "#7C3AED" }}
          >
            {tr.badgeTitle}
          </span>
          {selected?.topik_nama && (
            <span className="rounded-full bg-secondary px-4 py-1.5 font-display text-xs font-extrabold text-foreground shadow-soft">
              {selected.topik_nama}
            </span>
          )}
        </div>

        {!selected ? (
          showBahasaToggle && !bahasa ? (
            <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-10">
              <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
                {tr.pilihBahasa.split(" ")[0]}{" "}
                <span style={{ color: HIJAU }}>
                  {tr.pilihBahasa.split(" ").slice(1).join(" ") || "Bahasa"}
                </span>
              </h1>
              <p className="mt-2 text-muted-foreground">{tr.pilihBahasaDesc}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
          ) : loadingList ? (
            <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
              <p className="text-muted-foreground">{tr.memuatSoalan}</p>
            </div>
          ) : errMsg ? (
            <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
              <h2 className="font-display text-xl font-extrabold text-destructive">{tr.ralat}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{errMsg}</p>
            </div>
          ) : rangsanganList.length === 0 ? (
            <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
              <h2 className="font-display text-xl font-extrabold text-foreground">
                {tr.tiadaSoalan}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{tr.tiadaSoalanDesc}</p>
            </div>
          ) : (
            <div className="mt-8">
              <h2 className="font-display text-2xl font-extrabold text-foreground">{tr.pilihSet}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tr.pilihSetDesc}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rangsanganList.map((r) => (
                  <button
                    key={r.rangsangan_id}
                    onClick={() => setSelected(r)}
                    className="group flex flex-col overflow-hidden rounded-2xl border-2 bg-card p-3 text-left shadow-card transition hover:-translate-y-1"
                    style={{ borderColor: `${HIJAU}33` }}
                  >
                    <div className="flex h-[160px] items-center justify-center overflow-hidden rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full">
                      {r.rangsangan_svg_type ? (
                        renderSoalanSvg(r.rangsangan_svg_type, r.rangsangan_svg_params)
                      ) : r.rangsangan_gambar_id ? (
                        <Gambar id={r.rangsangan_gambar_id} alt={r.topik_nama ?? r.rangsangan_id} />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      )}
                    </div>
                    <p className="mt-3 px-1 font-display text-sm font-extrabold text-foreground">
                      {r.topik_nama ?? r.rangsangan_id}
                    </p>
                    <p className="mt-1 px-1 text-xs text-muted-foreground">
                      {tr.soalanCount(r.soalan.length)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : selesai || berhenti ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
              {tr.syabas}
            </h2>
            <p className="mt-2 text-muted-foreground">{tr.syabasDesc(betul + salah)}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ backgroundColor: `${HIJAU}15` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  {tr.labelBetul}
                </p>
                <p className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
                  {betul}
                </p>
              </div>
              <div className="rounded-2xl bg-destructive/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-destructive">{tr.labelSalah}</p>
                <p className="font-display text-3xl font-extrabold text-destructive">{salah}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={resetToPicker}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: HIJAU }}
              >
                {tr.pilihSetLain}
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full px-6 py-3 font-display font-extrabold shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
              >
                {tr.aktivitiLain}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Persistent rangsangan */}
            <div
              className="mt-6 overflow-hidden rounded-2xl border-2 bg-white p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-md"
              style={{ borderColor: `${HIJAU}44` }}
            >
              {selected.rangsangan_svg_type ? (
                <div className="flex justify-center">
                  {renderSoalanSvg(selected.rangsangan_svg_type, selected.rangsangan_svg_params)}
                </div>
              ) : selected.rangsangan_gambar_id ? (
                <Gambar
                  id={selected.rangsangan_gambar_id}
                  alt={selected.topik_nama ?? selected.rangsangan_id}
                />
              ) : null}
              {selected.rangsangan_teks && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {selected.rangsangan_teks}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  {tr.labelSoalan}
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>
                  {cursor + 1}/{selected.soalan.length}
                </p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${EMAS}25`, border: `2px solid ${EMAS}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7a5300" }}>
                  {tr.labelBetul}
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: "#7a5300" }}>
                  {betul}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">{tr.labelSalah}</p>
                <p className="font-display text-2xl font-extrabold text-destructive">{salah}</p>
              </div>
            </div>

            {soalan && (
              <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
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
                          borderColor: showBetul
                            ? HIJAU
                            : showSalah
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--border))",
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
                          {showBetul ? (
                            <Check className="h-5 w-5" />
                          ) : showSalah ? (
                            <X className="h-5 w-5" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
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
                          style={
                            isBetulPilih
                              ? { borderColor: "#1B8A5A", backgroundColor: "#1B8A5A15", color: "#0f5a39" }
                              : { borderColor: "#f59e0b", backgroundColor: "#fffbeb", color: "#92400e" }
                          }
                        >
                          {fb}
                        </div>
                      );
                    })()}
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={goToNext}
                        className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold shadow-soft transition hover:opacity-90"
                        style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
                      >
                        {cursor + 1 >= selected.soalan.length ? tr.selesai : tr.seterusnya}
                      </button>
                    </div>
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
                {tr.berhenti}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
