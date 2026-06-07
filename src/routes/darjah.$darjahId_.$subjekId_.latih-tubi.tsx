import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Square } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";

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
}

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function LatihTubiPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/latih-tubi" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}`, locked: false };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId };

  const [bank, setBank] = useState<Soalan[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [jawab, setJawab] = useState(0);
  const [berhenti, setBerhenti] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [mulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (berhenti && jawab > 0) {
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "latih-tubi",
        markah: betul,
        jumlahSoalan: jawab,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [berhenti]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      const darjahNum = Number(darjahId);
      const { data, error } = await supabase
        .from("soalan_latih_tubi")
        .select("id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekId);
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setFetching(false);
        return;
      }
      const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      const rows = (data ?? []).map((r: any) => ({
        id: r.id as string,
        soalan: r.soalan as string,
        pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
        jawapan: letterToIdx[String(r.jawapan_betul).toUpperCase()] ?? 0,
      }));
      setBank(rows);
      setOrder(shuffle(rows.map((_, i) => i)));
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahId, subjekId]);

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
    if (isBetul) setBetul((b) => b + 1);
    else setSalah((s) => s + 1);
    setJawab((j) => j + 1);
    setTimeout(() => {
      setPilih(null);
      setCursor((c) => {
        const next = c + 1;
        // Reshuffle when we exhaust the order
        if (next >= order.length) {
          setOrder(shuffle(bank.map((_, i) => i)));
          return 0;
        }
        return next;
      });
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:opacity-80"
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
            Latih Tubi
          </span>
        </div>

        {fetching ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <p className="text-muted-foreground">Memuatkan soalan...</p>
          </div>
        ) : errMsg ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-xl font-extrabold text-destructive">Ralat</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errMsg}</p>
          </div>
        ) : bank.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-10 text-center shadow-card">
            <h2 className="font-display text-xl font-extrabold text-foreground">Belum ada soalan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Soalan Latih Tubi untuk {subjek.title} ({darjah.label}) sedang disediakan.
            </p>
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
                onClick={() => {
                  setBetul(0);
                  setSalah(0);
                  setJawab(0);
                  setCursor(0);
                  setPilih(null);
                  setOrder(shuffle(bank.map((_, i) => i)));
                  setBerhenti(false);
                }}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: HIJAU }}
              >
                Main Lagi
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
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  Dijawab
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
                  Betul
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: "#7a5300" }}>
                  {betul}
                </p>
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
