import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDarjah } from "@/lib/curriculum";

export const Route = createFileRoute("/preview/$darjahId")({
  head: () => ({ meta: [{ title: "Cuba Soalan — Kalifah.my" }] }),
  ssr: false,
  component: PreviewKuizPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

interface Soalan {
  id: string;
  soalan: string;
  pilihan: string[];
  jawapan: number;
  penjelasan: string | null;
}

function letterToIdx(l: string): number {
  return ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(l).toUpperCase()] ?? 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PreviewKuizPage() {
  const { darjahId } = useParams({ from: "/preview/$darjahId" });
  const navigate = useNavigate();
  const darjah = getDarjah(darjahId);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [soalan, setSoalan] = useState<Soalan[]>([]);
  const [i, setI] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [betulCount, setBetulCount] = useState(0);
  const [nama, setNama] = useState("Anak");

  useEffect(() => {
    const n = window.localStorage.getItem("previewNamaAnak");
    if (!n) {
      navigate({ to: "/preview/nama" });
      return;
    }
    setNama(n);

    (async () => {
      const { data, error } = await supabase
        .from("kuiz_soalan")
        .select("id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan, penjelasan")
        .eq("subjek", "BM")
        .eq("darjah", Number(darjahId))
        .not("penjelasan", "is", null);
      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }
      const rows: Soalan[] = (data ?? []).map((r: any) => ({
        id: String(r.id),
        soalan: r.soalan as string,
        pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
        jawapan: letterToIdx(r.jawapan),
        penjelasan: (r.penjelasan ?? null) as string | null,
      }));
      setSoalan(shuffle(rows).slice(0, 3));
      setLoading(false);
    })();
  }, [darjahId, navigate]);

  function handlePilih(idx: number) {
    if (pilih !== null) return;
    setPilih(idx);
    if (idx === soalan[i].jawapan) setBetulCount((c) => c + 1);
  }

  function seterusnya() {
    if (i + 1 >= soalan.length) {
      window.localStorage.setItem("previewScore", String(betulCount));
      window.localStorage.setItem("previewTotal", String(soalan.length));
      navigate({ to: "/preview/$darjahId/score", params: { darjahId } });
      return;
    }
    setI(i + 1);
    setPilih(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan soalan...</p>
      </main>
    );
  }

  if (err || soalan.length === 0) {
    return (
      <main className="container mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl bg-card p-8 text-center shadow-card">
          <p className="font-bold text-destructive">{err ?? "Tiada soalan untuk darjah ini."}</p>
          <Link to="/preview/nama" className="mt-4 inline-block text-sm font-bold text-primary underline">
            Kembali
          </Link>
        </div>
      </main>
    );
  }

  const s = soalan[i];
  const jawab = pilih !== null;
  const betul = pilih === s.jawapan;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link to="/preview/nama" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <span className="rounded-full bg-card px-3 py-1 font-display text-xs font-extrabold shadow-soft" style={{ color: HIJAU }}>
            {darjah?.label ?? `Darjah ${darjahId}`} • Bahasa Melayu
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-extrabold text-foreground">
              Soalan {i + 1}/{soalan.length}
            </span>
            <span className="font-display text-xs font-bold text-muted-foreground">
              {nama}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${((i + (jawab ? 1 : 0)) / soalan.length) * 100}%`, backgroundColor: HIJAU }}
            />
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
          <p className="font-display text-lg font-extrabold text-foreground md:text-xl">{s.soalan}</p>

          <div className="mt-5 grid gap-3">
            {s.pilihan.map((p, idx) => {
              const dipilih = pilih === idx;
              const jawapanBenar = jawab && idx === s.jawapan;
              const jawapanSalah = jawab && dipilih && idx !== s.jawapan;
              return (
                <button
                  key={idx}
                  onClick={() => handlePilih(idx)}
                  disabled={jawab}
                  className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition disabled:cursor-default"
                  style={{
                    borderColor: jawapanBenar ? HIJAU : jawapanSalah ? "#dc2626" : `${HIJAU}33`,
                    backgroundColor: jawapanBenar ? `${HIJAU}15` : jawapanSalah ? "#fee2e2" : "white",
                  }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-white" style={{ backgroundColor: jawapanBenar ? HIJAU : jawapanSalah ? "#dc2626" : `${HIJAU}88` }}>
                    {jawapanBenar ? <Check className="h-4 w-4" /> : jawapanSalah ? <X className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-foreground">{p}</span>
                </button>
              );
            })}
          </div>

          {jawab && (
            <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: betul ? `${HIJAU}10` : "#fef3c7" }}>
              <p className="font-display text-sm font-extrabold" style={{ color: betul ? HIJAU : "#92400e" }}>
                {betul ? "Syabas! Jawapan betul 🎉" : "Hampir betul!"}
              </p>
              {s.penjelasan && (
                <p className="mt-2 flex items-start gap-2 text-sm text-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color: EMAS }} />
                  <span><b>Penjelasan:</b> {s.penjelasan}</span>
                </p>
              )}
              <button
                onClick={seterusnya}
                className="mt-4 w-full rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft"
                style={{ backgroundColor: HIJAU }}
              >
                {i + 1 >= soalan.length ? "Lihat Keputusan →" : "Soalan Seterusnya →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
