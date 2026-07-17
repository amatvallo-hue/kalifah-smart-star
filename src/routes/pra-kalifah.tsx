import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Baby, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StarReward } from "@/components/StarReward";

export const Route = createFileRoute("/pra-kalifah")({
  head: () => ({
    meta: [
      { title: "Pra Kalifah — Cari Huruf" },
      { name: "description", content: "Aktiviti Cari Huruf untuk kanak-kanak 4 tahun di Kalifah.my." },
    ],
  }),
  ssr: false,
  component: PraKalifahPage,
});

interface Soalan {
  id: string;
  tertib: number;
  arahan_audio_teks: string | null;
  huruf_sasaran: string | null;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  jawapan_betul: string;
}

const BUTANG_WARNA = [
  "bg-rose-400 hover:bg-rose-500 text-white",
  "bg-sky-400 hover:bg-sky-500 text-white",
  "bg-emerald-400 hover:bg-emerald-500 text-white",
  "bg-amber-400 hover:bg-amber-500 text-white",
];

function PraKalifahPage() {
  const [soalan, setSoalan] = useState<Soalan[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [betul, setBetul] = useState<string | null>(null); // key pilihan yang betul (untuk warna hijau)
  const [salah, setSalah] = useState<string | null>(null); // key pilihan yang salah (untuk shake)
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("pra_kalifah_aktiviti" as never)
        .select(
          "id, tertib, arahan_audio_teks, huruf_sasaran, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul",
        )
        .eq("nama_aktiviti", "Cari Huruf")
        .eq("umur_tahun", 4)
        .order("tertib", { ascending: true });
      if (!mounted) return;
      if (error) {
        setErr(error.message);
      } else {
        setSoalan((data ?? []) as unknown as Soalan[]);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const current = soalan[idx];

  function pilih(key: "a" | "b" | "c" | "d", huruf: string) {
    if (!current || betul) return;
    if (huruf === current.jawapan_betul) {
      setBetul(key);
      setSalah(null);
      setTimeout(() => {
        setBetul(null);
        if (idx + 1 >= soalan.length) {
          setSelesai(true);
        } else {
          setIdx((n) => n + 1);
        }
      }, 800);
    } else {
      setSalah(key);
      setTimeout(() => setSalah(null), 450);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (err || soalan.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Tiada aktiviti</h1>
          <p className="mt-3 text-sm text-muted-foreground">{err ?? "Belum ada soalan tersedia."}</p>
          <Link
            to="/pilih-darjah"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (selesai) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft animate-float">
            <Baby className="h-12 w-12" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-foreground">Misi Selesai! 🎉</h1>
          <p className="mt-2 text-sm text-muted-foreground">Syabas! Kamu dah kenal semua huruf!</p>
          <div className="mt-6 flex justify-center">
            <StarReward earned={3} />
          </div>
          <Link
            to="/pilih-darjah"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Pilih Darjah
          </Link>
        </div>
      </div>
    );
  }

  const pilihanList: Array<{ key: "a" | "b" | "c" | "d"; huruf: string }> = [
    { key: "a", huruf: current.pilihan_a },
    { key: "b", huruf: current.pilihan_b },
    { key: "c", huruf: current.pilihan_c },
    { key: "d", huruf: current.pilihan_d },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4">
        {/* Header: back + progress */}
        <div className="flex items-center justify-between">
          <Link
            to="/pilih-darjah"
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-foreground shadow-card transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Keluar
          </Link>
          <span className="rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-primary shadow-card">
            {idx + 1} / {soalan.length}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {soalan.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i < idx ? "bg-primary" : i === idx ? "bg-primary/60 w-6" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Mascot + arahan */}
        <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-card">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft animate-float">
            <Baby className="h-10 w-10" strokeWidth={2.5} />
          </div>
          <div className="relative flex-1 rounded-2xl bg-secondary p-4">
            <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 bg-secondary" />
            <p className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
              {current.arahan_audio_teks ?? `Cari huruf ${current.huruf_sasaran ?? ""}!`}
            </p>
          </div>
        </div>

        {/* Pilihan 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {pilihanList.map((p, i) => {
            const isBetul = betul === p.key;
            const isSalah = salah === p.key;
            const disabled = betul !== null;
            const baseColor = BUTANG_WARNA[i];
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => pilih(p.key, p.huruf)}
                className={`flex aspect-square items-center justify-center rounded-3xl font-display text-6xl font-extrabold shadow-card transition sm:text-7xl ${
                  isBetul
                    ? "bg-emerald-500 text-white animate-pop"
                    : isSalah
                      ? `${baseColor} animate-shake`
                      : `${baseColor} hover:-translate-y-1 hover:shadow-soft`
                } ${disabled && !isBetul ? "opacity-70" : ""}`}
              >
                {p.huruf}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
