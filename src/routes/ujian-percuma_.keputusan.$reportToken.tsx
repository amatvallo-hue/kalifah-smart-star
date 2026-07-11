import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Trophy, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const Route = createFileRoute("/ujian-percuma_/keputusan/$reportToken")({
  head: () => ({
    meta: [
      { title: "Keputusan Ujian Percuma — Kalifah.my" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  ssr: false,
  component: KeputusanPage,
});

type Sesi = {
  o_session_id: string;
  o_nama_anak: string;
  o_darjah: number;
  o_status: string;
  o_score: number | null;
  o_jawapan: Array<{ soalan_id: string | number; pilihan: string; betul: boolean }> | null;
  o_completed_at: string | null;
};

type SubjekStat = { subjek: string; betul: number; jumlah: number };

function bandLabel(score: number) {
  if (score >= 80) return { label: "Cemerlang", color: "#2E9F5B", ring: "border-green-500", bg: "bg-green-50", text: "text-green-700" };
  if (score >= 50) return { label: "Baik", color: "#F5A623", ring: "border-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" };
  return { label: "Perlu Perhatian", color: "#EF4444", ring: "border-red-500", bg: "bg-red-50", text: "text-red-700" };
}

function KeputusanPage() {
  const { reportToken } = Route.useParams();
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [subjekStats, setSubjekStats] = useState<SubjekStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: rpcErr } = await supabase.rpc("get_kuiz_sesi_by_report_token", {
        p_token: reportToken,
      });
      if (cancelled) return;
      if (rpcErr) {
        setError("Laporan ini tidak sah atau telah tamat tempoh.");
        setLoading(false);
        return;
      }
      const row = Array.isArray(data) ? (data[0] as Sesi | undefined) : (data as Sesi | null);
      if (!row) {
        setError("Laporan ini tidak sah atau telah tamat tempoh.");
        setLoading(false);
        return;
      }
      setSesi(row);

      const jawapan = Array.isArray(row.o_jawapan) ? row.o_jawapan : [];
      const ids = jawapan.map((j) => j.soalan_id);
      if (ids.length > 0) {
        const { data: qs } = await supabase
          .from("kuiz_percuma_soalan")
          .select("id, subjek")
          .in("id", ids);
        if (cancelled) return;
        const bySubjek = new Map<string, SubjekStat>();
        const qMap = new Map<string | number, string>();
        (qs ?? []).forEach((q: any) => qMap.set(q.id, q.subjek ?? "Lain-lain"));
        for (const j of jawapan) {
          const subj = qMap.get(j.soalan_id) ?? "Lain-lain";
          const s = bySubjek.get(subj) ?? { subjek: subj, betul: 0, jumlah: 0 };
          s.jumlah += 1;
          if (j.betul) s.betul += 1;
          bySubjek.set(subj, s);
        }
        setSubjekStats(
          Array.from(bySubjek.values()).sort(
            (a, b) => a.betul / a.jumlah - b.betul / b.jumlah,
          ),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reportToken]);

  const score = sesi?.o_score ?? 0;
  const band = useMemo(() => bandLabel(score), [score]);
  const weakest = subjekStats.slice(0, Math.min(2, subjekStats.length)).filter((s) => s.betul / s.jumlah < 0.8);
  const namaAnak = sesi?.o_nama_anak ?? "anak anda";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 md:py-10">
        <Link to="/" className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <span className="font-display text-xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            Kalifah<span className="text-primary">.my</span>
          </span>
        </Link>

        {loading && (
          <div className="w-full rounded-3xl bg-card p-8 shadow-card">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-display font-bold">Sedang memuatkan laporan...</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="w-full rounded-3xl bg-card p-8 shadow-card">
            <h1 className="font-display text-xl font-extrabold text-foreground">Ralat</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Link
              to="/ujian-percuma"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              Kembali ke Ujian Percuma
            </Link>
          </div>
        )}

        {!loading && !error && sesi && (
          <>
            {/* Score card */}
            <div className="w-full rounded-3xl bg-card p-6 text-center shadow-card md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-primary">
                <Trophy className="h-3 w-3" />
                Keputusan Ujian
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
                Keputusan Ujian {namaAnak} (Darjah {sesi.o_darjah})
              </h1>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div
                  className={`flex h-36 w-36 items-center justify-center rounded-full border-8 ${band.ring} bg-card shadow-soft`}
                >
                  <span className="font-display text-4xl font-extrabold" style={{ color: band.color }}>
                    {score}%
                  </span>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 font-display text-sm font-extrabold ${band.bg} ${band.text}`}
                >
                  {band.label}
                </span>
              </div>
            </div>

            {/* Per-subjek */}
            {subjekStats.length > 0 && (
              <div className="mt-5 w-full rounded-3xl bg-card p-6 shadow-card md:p-8">
                <h2 className="font-display text-lg font-extrabold text-foreground md:text-xl">
                  Pecahan Per Subjek
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Disusun dari yang paling lemah dahulu.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {subjekStats.map((s) => {
                    const pct = Math.round((s.betul / s.jumlah) * 100);
                    const b = bandLabel(pct);
                    return (
                      <div
                        key={s.subjek}
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-extrabold text-foreground">
                            {s.subjek}
                          </span>
                          <span className="font-display text-sm font-extrabold" style={{ color: b.color }}>
                            {s.betul}/{s.jumlah}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: b.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weakest areas callout */}
            {weakest.length > 0 && (
              <div className="mt-5 w-full rounded-3xl border-2 border-gold bg-gold/10 p-6 shadow-soft md:p-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 font-display text-xs font-bold text-gold-foreground">
                  <Sparkles className="h-3 w-3" />
                  Kawasan Perlu Ditingkatkan
                </span>
                <p className="mt-3 text-sm font-bold text-foreground md:text-base">
                  Berdasarkan keputusan, {namaAnak} boleh manfaat dari latihan tambahan dalam{" "}
                  <strong>{weakest.map((w) => w.subjek).join(" dan ")}</strong>.
                </p>
              </div>
            )}

            {/* Upsell */}
            <div className="mt-5 w-full rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-card md:p-8">
              <h2 className="font-display text-xl font-extrabold leading-tight md:text-2xl">
                Teruskan perjalanan pembelajaran {namaAnak} dengan Kalifah.my
              </h2>
              <ul className="mt-4 space-y-2 text-sm font-bold md:text-base">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>Latihan tanpa had ikut topik lemah</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>Laporan progress berterusan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>Soalan bergambar rajah</span>
                </li>
              </ul>
              <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-display text-3xl font-extrabold">RM49<span className="text-base font-bold opacity-80">/bulan</span></div>
                  <div className="text-xs font-bold opacity-90">Batalkan bila-bila masa.</div>
                </div>
                <Link
                  to="/daftar"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-card px-6 py-3 font-display text-base font-extrabold text-primary shadow-soft transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Mulakan Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Laporan penuh juga telah dihantar ke email anda.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
