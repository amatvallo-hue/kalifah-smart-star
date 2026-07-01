import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Square } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";
import { tambahMata } from "@/lib/tambah-mata";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/soalan-rajah")({
  head: () => ({ meta: [{ title: "Soalan Rajah — Kalifah.my" }] }),
  ssr: false,
  component: SoalanRajahPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

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
}

interface RajahItem {
  nama: string;
  tajuk: string;
  konten_svg: string;
}

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

function SoalanRajahPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/soalan-rajah" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}`, locked: false };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId };
  const mata = usePoints();
  const darjahNum = Number(darjahId);

  // Phase 1: picker
  const [rajahList, setRajahList] = useState<RajahItem[]>([]);
  const [loadingRajah, setLoadingRajah] = useState(true);
  const [selectedRajah, setSelectedRajah] = useState<RajahItem | null>(null);

  // Phase 2: latih tubi
  const [bank, setBank] = useState<Soalan[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [jawab, setJawab] = useState(0);
  const [berhenti, setBerhenti] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [mulaMasa, setMulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Phase 1: load available rajah for this darjah+subjek
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRajah(true);
      setErrMsg(null);
      const { data, error } = await supabase
        .from("soalan_latih_tubi")
        .select("gambar")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekId)
        .not("gambar", "is", null);
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setLoadingRajah(false);
        return;
      }
      const keys = Array.from(
        new Set((data ?? []).map((r: any) => r.gambar).filter((g: any): g is string => !!g)),
      );
      if (keys.length === 0) {
        setRajahList([]);
        setLoadingRajah(false);
        return;
      }
      const { data: rj, error: err2 } = await supabase
        .from("rajah")
        .select("nama, tajuk, konten_svg")
        .in("nama", keys);
      if (cancelled) return;
      if (err2) {
        setErrMsg(err2.message);
        setLoadingRajah(false);
        return;
      }
      setRajahList((rj ?? []) as RajahItem[]);
      setLoadingRajah(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahId, subjekId, darjahNum]);

  // Phase 2: on rajah selected, fetch its questions
  useEffect(() => {
    if (!selectedRajah) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      setErrMsg(null);
      const { data, error } = await supabase
        .from("soalan_latih_tubi")
        .select("id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, topik, feedback_a, feedback_b, feedback_c, feedback_d")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekId)
        .eq("gambar", selectedRajah.nama);
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setFetching(false);
        return;
      }
      const rows: Soalan[] = (data ?? []).map((r: any) => ({
        id: r.id as string,
        soalan: r.soalan as string,
        pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
        jawapan: letterToIdx(r.jawapan_betul),
        topik: (r.topik ?? null) as string | null,
        feedback_a: (r.feedback_a ?? null) as string | null,
        feedback_b: (r.feedback_b ?? null) as string | null,
        feedback_c: (r.feedback_c ?? null) as string | null,
        feedback_d: (r.feedback_d ?? null) as string | null,
      }));
      const shuffled = shuffle(rows);
      setBank(shuffled);
      setOrder(shuffle(shuffled.map((_, i) => i)));
      setCursor(0);
      setPilih(null);
      setBetul(0);
      setSalah(0);
      setJawab(0);
      setBerhenti(false);
      setMulaMasa(Date.now());
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRajah, darjahId, subjekId, darjahNum]);

  // Save progress on stop
  useEffect(() => {
    if (berhenti && jawab > 0) {
      const masaSec = Math.round((Date.now() - mulaMasa) / 1000);
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "latih-tubi",
        markah: betul,
        jumlahSoalan: jawab,
        masaAmbil: masaSec,
        topik: selectedRajah?.tajuk ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [berhenti]);

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

  const soalan = bank.length > 0 ? bank[order[cursor % order.length]] : null;

  const handlePilih = (idx: number) => {
    if (pilih !== null || !soalan) return;
    setPilih(idx);
    const isBetul = idx === soalan.jawapan;
    if (isBetul) {
      setBetul((b) => b + 1);
      if (user) {
        tambahMata({ userId: user.id, mata: 1, sumber: "soalan-rajah", darjah: darjahId, subjek: subjekId });
      }
    } else {
      setSalah((s) => s + 1);
    }
    setJawab((j) => j + 1);
    if (isBetul) {
      setTimeout(() => {
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

  const resetToPicker = () => {
    setSelectedRajah(null);
    setBank([]);
    setOrder([]);
    setCursor(0);
    setPilih(null);
    setBetul(0);
    setSalah(0);
    setJawab(0);
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
          Kembali ke Aktiviti
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
            Soalan Rajah
          </span>
          {selectedRajah && (
            <span className="rounded-full bg-secondary px-4 py-1.5 font-display text-xs font-extrabold text-foreground shadow-soft">
              {selectedRajah.tajuk}
            </span>
          )}
        </div>

        {/* Phase 1: picker */}
        {!selectedRajah ? (
          loadingRajah ? (
            <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
              <p className="text-muted-foreground">Memuatkan rajah...</p>
            </div>
          ) : errMsg ? (
            <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
              <h2 className="font-display text-xl font-extrabold text-destructive">Ralat</h2>
              <p className="mt-2 text-sm text-muted-foreground">{errMsg}</p>
            </div>
          ) : rajahList.length === 0 ? (
            <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
              <h2 className="font-display text-xl font-extrabold text-foreground">Belum ada soalan rajah</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Soalan bergambar untuk {subjek.title} ({darjah.label}) sedang disediakan.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <h2 className="font-display text-2xl font-extrabold text-foreground">Pilih Rajah</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih satu rajah untuk mula latih tubi soalan bergambar.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rajahList.map((r) => (
                  <button
                    key={r.nama}
                    onClick={() => setSelectedRajah(r)}
                    className="group flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card p-3 text-left shadow-card transition hover:-translate-y-1"
                    style={{ borderColor: `${HIJAU}33` }}
                  >
                    <div
                      className="flex h-[180px] items-center justify-center overflow-hidden rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: r.konten_svg }}
                    />
                    <p className="mt-3 px-1 font-display text-sm font-extrabold text-foreground">
                      {r.tajuk}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : fetching ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <p className="text-muted-foreground">Memuatkan soalan...</p>
          </div>
        ) : errMsg ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-xl font-extrabold text-destructive">Ralat</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errMsg}</p>
            <button
              onClick={resetToPicker}
              className="mt-4 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              Pilih Rajah Lain
            </button>
          </div>
        ) : bank.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-xl font-extrabold text-foreground">Belum ada soalan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tiada soalan untuk rajah ini.
            </p>
            <button
              onClick={resetToPicker}
              className="mt-4 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              Pilih Rajah Lain
            </button>
          </div>
        ) : berhenti ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
              Syabas! 🎉
            </h2>
            <p className="mt-2 text-muted-foreground">Kamu dah jawab {jawab} soalan.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-5" style={{ backgroundColor: `${HIJAU}15` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: HIJAU }}>Betul</p>
                <p className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>{betul}</p>
              </div>
              <div className="rounded-2xl bg-destructive/10 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-destructive">Salah</p>
                <p className="font-display text-3xl font-extrabold text-destructive">{salah}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={resetToPicker}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: HIJAU }}
              >
                Pilih Rajah Lain
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full px-6 py-3 font-display font-extrabold shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
              >
                Aktiviti Lain
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Persistent rajah */}
            <div
              className="mx-auto mt-6 flex max-w-sm justify-center overflow-hidden rounded-2xl border-2 bg-white p-4 [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full"
              style={{ borderColor: `${HIJAU}44` }}
              dangerouslySetInnerHTML={{ __html: selectedRajah.konten_svg }}
            />

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  Dijawab
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>{jawab}</p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${EMAS}25`, border: `2px solid ${EMAS}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7a5300" }}>
                  Betul
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: "#7a5300" }}>{betul}</p>
              </div>
              <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">Salah</p>
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
                            backgroundColor: showBetul ? HIJAU : showSalah ? "hsl(var(--destructive))" : EMAS,
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
                          Seterusnya
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
                Berhenti
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
