import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { renderSoalanSvg } from "@/lib/render-soalan-svg";

export const Route = createFileRoute("/ujian-percuma_/soalan/$sessionId")({
  head: () => ({
    meta: [
      { title: "Ujian Akademik Percuma — Kalifah.my" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: SoalanPage,
});

type Sesi = {
  o_session_id: string;
  o_nama_anak: string;
  o_darjah: number;
  o_status: string;
  o_current_question: number;
  o_score: number | null;
  o_jawapan: unknown;
};

type Soalan = {
  id: string | number;
  darjah: number;
  subjek: string;
  soalan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  jawapan_betul: "a" | "b" | "c" | "d";
  feedback_a: string | null;
  feedback_b: string | null;
  feedback_c: string | null;
  feedback_d: string | null;
  stimulus_data: any;
  jenis_stimulus: string | null;
};

type Jawapan = {
  soalan_id: string | number;
  pilihan: "a" | "b" | "c" | "d";
  betul: boolean;
};

const PILIHAN_KEYS: Array<"a" | "b" | "c" | "d"> = ["a", "b", "c", "d"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


function groupBySubjekShuffled(rows: Soalan[]): Soalan[] {
  const groups = new Map<string, Soalan[]>();
  for (const r of rows) {
    const key = r.subjek ?? "lain";
    const g = groups.get(key) ?? [];
    g.push(r);
    groups.set(key, g);
  }
  const order = shuffle(Array.from(groups.keys()));
  const out: Soalan[] = [];
  for (const k of order) {
    const g = groups.get(k)!;
    for (const s of g) out.push(s);
  }
  return out;
}

function SoalanPage() {
  const { sessionId } = Route.useParams();
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [soalanList, setSoalanList] = useState<Soalan[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [askResume, setAskResume] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);

  const [pickedForCurrent, setPickedForCurrent] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [jawapan, setJawapan] = useState<Jawapan[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const { data: sesiData, error: sesiErr } = await supabase.rpc("get_kuiz_sesi_by_session", {
        p_session_id: sessionId,
      });
      if (cancelled) return;
      if (sesiErr) {
        setLoadError("Link ini tidak sah atau telah tamat tempoh.");
        setLoading(false);
        return;
      }
      const row = Array.isArray(sesiData) ? (sesiData[0] as Sesi | undefined) : (sesiData as Sesi | null);
      if (!row) {
        setLoadError("Link ini tidak sah atau telah tamat tempoh.");
        setLoading(false);
        return;
      }
      setSesi(row);

      if (row.o_status === "completed") {
        setLoading(false);
        return;
      }

      const { data: qRows, error: qErr } = await supabase
        .from("kuiz_percuma_soalan")
        .select("*")
        .eq("darjah", row.o_darjah);
      if (cancelled) return;
      if (qErr || !qRows || qRows.length === 0) {
        setLoadError("Soalan untuk darjah ini belum tersedia.");
        setLoading(false);
        return;
      }
      const ordered = groupBySubjekShuffled(qRows as Soalan[]);
      setSoalanList(ordered);

      if (row.o_status === "pending") {
        supabase
          .rpc("update_kuiz_sesi_progress", {
            p_session_id: sessionId,
            p_current_question: row.o_current_question ?? 0,
            p_status: "started",
          })
          .then(() => {});
      }

      if ((row.o_current_question ?? 0) > 0 && (row.o_current_question ?? 0) < ordered.length) {
        setAskResume(true);
      } else {
        setCurrentIdx(0);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const total = soalanList?.length ?? 0;
  const soalan = currentIdx != null && soalanList ? soalanList[currentIdx] : null;
  const progressPct = total > 0 && currentIdx != null ? ((currentIdx + (pickedForCurrent ? 1 : 0)) / total) * 100 : 0;

  const subjekLabel = useMemo(() => {
    if (!soalan || !soalanList) return "";
    const sameSubjek = soalanList.filter((s) => s.subjek === soalan.subjek);
    const posInSubjek = sameSubjek.findIndex((s) => s.id === soalan.id) + 1;
    return `${soalan.subjek} • Soalan ${posInSubjek} dari ${sameSubjek.length}`;
  }, [soalan, soalanList]);

  function pilihJawapan(key: "a" | "b" | "c" | "d") {
    if (pickedForCurrent || !soalan) return;
    setPickedForCurrent(key);
  }

  async function seterusnya() {
    if (!soalan || !pickedForCurrent || !soalanList || currentIdx == null || !sesi) return;
    const betul = pickedForCurrent === soalan.jawapan_betul;
    const newJawapan: Jawapan[] = [
      ...jawapan,
      { soalan_id: soalan.id, pilihan: pickedForCurrent, betul },
    ];
    setJawapan(newJawapan);

    const nextIdx = currentIdx + 1;
    const isLast = nextIdx >= soalanList.length;

    if (!isLast) {
      supabase
        .rpc("update_kuiz_sesi_progress", {
          p_session_id: sessionId,
          p_current_question: nextIdx,
          p_status: "in_progress",
        })
        .then(() => {});
      setCurrentIdx(nextIdx);
      setPickedForCurrent(null);
      return;
    }

    setSubmitting(true);
    const betulCount = newJawapan.filter((j) => j.betul).length;
    const score = Math.round((betulCount / soalanList.length) * 100);
    const { data, error } = await supabase.rpc("submit_kuiz_sesi_result", {
      p_session_id: sessionId,
      p_score: score,
      p_jawapan: newJawapan as any,
    });
    if (error) {
      setSubmitting(false);
      setLoadError("Gagal menghantar keputusan. Sila cuba lagi.");
      return;
    }
    const resultRow = Array.isArray(data) ? (data[0] as { o_report_token: string } | undefined) : (data as { o_report_token: string } | null);
    const token = resultRow?.o_report_token;
    if (token) {
      window.location.href = `/ujian-percuma/keputusan/${token}`;
    } else {
      setSubmitting(false);
      setLoadError("Tiada token laporan diterima.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 md:py-10">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <span className="font-display text-xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            Kalifah<span className="text-primary">.my</span>
          </span>
        </div>

        {loading && (
          <Card>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-display font-bold">Sedang memuatkan soalan...</span>
            </div>
          </Card>
        )}

        {!loading && loadError && (
          <Card>
            <h1 className="font-display text-xl font-extrabold text-foreground">Ralat</h1>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <Link
              to="/ujian-percuma"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              Kembali ke Ujian Percuma
            </Link>
          </Card>
        )}

        {!loading && !loadError && sesi?.o_status === "completed" && (
          <Card>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              Anda sudah selesai ujian ini.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Laporan penuh telah dihantar ke email anda. Sila semak peti masuk (atau folder spam).
            </p>
            <Link
              to="/ujian-percuma"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-5 py-2.5 font-display text-sm font-extrabold text-foreground hover:border-primary"
            >
              Kembali
            </Link>
          </Card>
        )}

        {!loading && !loadError && sesi && sesi.o_status !== "completed" && askResume && (
          <Card>
            <h1 className="font-display text-xl font-extrabold text-foreground">
              Sambung dari soalan {(sesi.o_current_question ?? 0) + 1}?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Anda telah pun bermula sebelum ini. Anda boleh sambung dari tempat yang terhenti, atau mula semula dari soalan pertama.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentIdx(sesi.o_current_question ?? 0);
                  setAskResume(false);
                }}
                className="rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
              >
                Sambung
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentIdx(0);
                  setAskResume(false);
                }}
                className="rounded-full border-2 border-border bg-card px-5 py-2.5 font-display text-sm font-extrabold text-foreground hover:border-primary"
              >
                Mula Semula
              </button>
            </div>
          </Card>
        )}

        {!loading && !loadError && sesi && soalan && currentIdx != null && (
          <>
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>{subjekLabel}</span>
                <span>
                  {currentIdx + 1} / {total}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <Card>
              {soalan.jenis_stimulus && soalan.stimulus_data && (
                <div className="mb-4 flex justify-center rounded-2xl bg-muted/40 p-4">
                  {renderSoalanSvg(
                    soalan.jenis_stimulus,
                    soalan.stimulus_data,
                    ["Mathematics", "Science", "Bahasa Inggeris"].includes(soalan.subjek) ? "en" : "bm",
                  )}
                </div>
              )}
              <h2 className="font-display text-lg font-extrabold leading-snug text-foreground md:text-xl">
                {soalan.soalan}
              </h2>

              <div className="mt-5 flex flex-col gap-2">
                {PILIHAN_KEYS.map((k) => {
                  const text = soalan[`pilihan_${k}` as const] as string;
                  const isPicked = pickedForCurrent === k;
                  const isCorrect = k === soalan.jawapan_betul;
                  const answered = pickedForCurrent != null;
                  let classes =
                    "flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left font-display font-bold transition ";
                  if (!answered) {
                    classes += "border-border bg-background hover:border-primary hover:-translate-y-0.5";
                  } else if (isPicked && isCorrect) {
                    classes += "border-success bg-success/10 text-success-foreground";
                  } else if (isPicked && !isCorrect) {
                    classes += "border-destructive bg-destructive/10 text-destructive";
                  } else if (isCorrect) {
                    classes += "border-success bg-success/5 text-foreground";
                  } else {
                    classes += "border-border bg-muted/30 text-muted-foreground opacity-70";
                  }
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={answered}
                      onClick={() => pilihJawapan(k)}
                      className={classes}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
                        {k.toUpperCase()}
                      </span>
                      <span className="flex-1 text-sm md:text-base">{text}</span>
                      {answered && isPicked && isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                      {answered && isPicked && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                    </button>
                  );
                })}
              </div>

              {pickedForCurrent && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
                    pickedForCurrent === soalan.jawapan_betul
                      ? "border-success/30 bg-success/10 text-foreground"
                      : "border-destructive/30 bg-destructive/10 text-foreground"
                  }`}
                >
                  {soalan[`feedback_${pickedForCurrent}` as const] ??
                    (pickedForCurrent === soalan.jawapan_betul ? "Betul!" : "Kurang tepat.")}
                </div>
              )}

              {pickedForCurrent && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={seterusnya}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Menghantar keputusan...
                    </>
                  ) : (
                    <>
                      {currentIdx + 1 >= total ? "Hantar Keputusan" : "Soalan Seterusnya"}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="w-full rounded-3xl bg-card p-6 shadow-card md:p-8">{children}</div>;
}
