import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Baby,
  Loader2,
  Star,
  Heart,
  Sun,
  Circle,
  Flower2,
  Sparkles,
  Hand,
  DoorOpen,
  VolumeX,
  HandHeart,
  Smartphone,
  Home,
  Megaphone,
  Users,
  Laugh,
  Cat,
  Footprints,
  Utensils,
  Angry,
  Frown,
  Music,
  Handshake,
  Ban,
  ThumbsUp,
  LogIn,
  Moon,
  HandHelping,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StarReward } from "@/components/StarReward";
import { BlobsLatar } from "./pra-kalifah";


export const Route = createFileRoute("/pra-kalifah_/$bidang")({
  head: () => ({
    meta: [
      { title: "Pra Kalifah — Aktiviti" },
      { name: "description", content: "Aktiviti pembelajaran pra sekolah di Kalifah.my." },
    ],
  }),
  ssr: false,
  component: AktivitiPraKalifahPage,
});

interface DataKira {
  bilangan?: number;
  ikon?: string;
}

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
  data_aktiviti: DataKira | null;
}

const BUTANG_WARNA = [
  "bg-rose-400 hover:bg-rose-500 text-white",
  "bg-sky-400 hover:bg-sky-500 text-white",
  "bg-emerald-400 hover:bg-emerald-500 text-white",
  "bg-amber-400 hover:bg-amber-500 text-white",
];

const IKON_KIRA: Record<string, { Icon: LucideIcon; cls: string }> = {
  star: { Icon: Star, cls: "fill-amber-400 text-amber-500" },
  heart: { Icon: Heart, cls: "fill-rose-400 text-rose-500" },
  sun: { Icon: Sun, cls: "fill-yellow-300 text-yellow-500" },
  circle: { Icon: Circle, cls: "fill-sky-400 text-sky-500" },
  flower: { Icon: Flower2, cls: "fill-fuchsia-400 text-fuchsia-500" },
};

const IKON_ADAB: Record<string, LucideIcon> = {
  Alhamdulillah: Sparkles,
  Assalamualaikum: Hand,
  "Buka Almari": DoorOpen,
  Diam: VolumeX,
  Doa: HandHeart,
  Gajet: Smartphone,
  "Ibu Bapa": Home,
  Jerit: Megaphone,
  Kawan: Users,
  Ketawa: Laugh,
  Kucing: Cat,
  Lari: Footprints,
  Maaf: Heart,
  Makan: Utensils,
  Marah: Angry,
  Menangis: Frown,
  Nyanyi: Music,
  Salam: Handshake,
  "Tak Nak": Ban,
  "Terima Kasih": ThumbsUp,
  "Terus Masuk": LogIn,
  Tidur: Moon,
  Tolong: HandHelping,
};

const BIDANG_CONFIG: Record<
  string,
  { namaAktiviti: string; tajuk: string; mesejSelesai: string; jenis: "huruf" | "kira" | "adab" }
> = {
  bahasa: {
    namaAktiviti: "Cari Huruf",
    tajuk: "Cari Huruf",
    mesejSelesai: "Syabas! Kamu dah kenal semua huruf!",
    jenis: "huruf",
  },
  kognitif: {
    namaAktiviti: "Kira Bersama",
    tajuk: "Kira Bersama",
    mesejSelesai: "Syabas! Kamu dah pandai kira!",
    jenis: "kira",
  },
  kerohanian: {
    namaAktiviti: "Adab Harian",
    tajuk: "Adab Harian",
    mesejSelesai: "Syabas! Kamu budak yang baik!",
    jenis: "adab",
  },
};

function AktivitiPraKalifahPage() {
  const { bidang } = useParams({ from: "/pra-kalifah_/$bidang" });
  const config = BIDANG_CONFIG[bidang];

  const [soalan, setSoalan] = useState<Soalan[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [betul, setBetul] = useState<string | null>(null);
  const [salah, setSalah] = useState<string | null>(null);
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    if (!config) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("pra_kalifah_aktiviti" as never)
        .select(
          "id, tertib, arahan_audio_teks, huruf_sasaran, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, data_aktiviti",
        )
        .eq("nama_aktiviti", config.namaAktiviti)
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
  }, [config]);

  const current = soalan[idx];

  function pilih(key: "a" | "b" | "c" | "d", nilai: string) {
    if (!current || betul) return;
    if (nilai === current.jawapan_betul) {
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

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Bidang tidak dijumpai</h1>
          <Link
            to="/pra-kalifah"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </div>
    );
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
            to="/pra-kalifah"
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        <BlobsLatar />
        <ConfettiPenuhSkrin />
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft animate-wiggle-float">
            <Baby className="h-12 w-12" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-foreground animate-pop">
            Misi Selesai! 🎉
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{config.mesejSelesai}</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-star-in"
                style={{ animationDelay: `${300 + i * 250}ms` }}
              >
                <StarReward earned={1} total={1} />
              </div>
            ))}
          </div>
          <Link
            to="/pra-kalifah"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Pulau Pra Kalifah
          </Link>
        </div>
      </div>
    );
  }

  const pilihanList: Array<{ key: "a" | "b" | "c" | "d"; nilai: string }> = [
    { key: "a", nilai: current.pilihan_a },
    { key: "b", nilai: current.pilihan_b },
    { key: "c", nilai: current.pilihan_c },
    { key: "d", nilai: current.pilihan_d },
  ];

  const arahan =
    current.arahan_audio_teks ??
    (config.jenis === "huruf"
      ? `Cari huruf ${current.huruf_sasaran ?? ""}!`
      : "Kira, berapa banyak?");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background p-4">
      <BlobsLatar />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            to="/pra-kalifah"
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-foreground shadow-card transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Keluar
          </Link>
          <span className="rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-primary shadow-card">
            {idx + 1} / {soalan.length}
          </span>
        </div>

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
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft animate-wiggle-float">
            <Baby className="h-10 w-10" strokeWidth={2.5} />
          </div>
          <div className="relative flex-1 rounded-2xl bg-secondary p-4">
            <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 bg-secondary" />
            <p className="font-display text-xl font-extrabold text-foreground sm:text-2xl">{arahan}</p>
          </div>
        </div>

        {/* Papar objek untuk aktiviti Kira */}
        {config.jenis === "kira" && current.data_aktiviti && (
          <PaparKira data={current.data_aktiviti} />
        )}

        {/* Pilihan 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {pilihanList.map((p, i) => {
            const isBetul = betul === p.key;
            const isSalah = salah === p.key;
            const disabled = betul !== null;
            const baseColor = BUTANG_WARNA[i];
            const IkonAdab = config.jenis === "adab" ? (IKON_ADAB[p.nilai] ?? HelpCircle) : null;
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => pilih(p.key, p.nilai)}
                style={!disabled ? { animationDelay: `${i * 350}ms` } : undefined}
                className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-visible rounded-3xl p-3 text-center font-display font-extrabold shadow-card transition ${
                  config.jenis === "adab"
                    ? "text-sm sm:text-base"
                    : "text-6xl sm:text-7xl"
                } ${
                  isBetul
                    ? "bg-emerald-500 text-white animate-pop"
                    : isSalah
                      ? `${baseColor} animate-shake`
                      : `${baseColor} animate-idle-pulse hover:-translate-y-1 hover:shadow-soft`
                } ${disabled && !isBetul ? "opacity-70" : ""}`}
              >
                {IkonAdab ? (
                  <>
                    <IkonAdab className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2.5} />
                    <span className="leading-tight">{p.nilai}</span>
                  </>
                ) : (
                  p.nilai
                )}
                {isBetul && <ConfettiButang />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CONFETTI_WARNA = ["bg-rose-400", "bg-sky-400", "bg-amber-400", "bg-violet-400", "bg-emerald-400"];

function ConfettiButang() {
  const kepingan = Array.from({ length: 8 });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {kepingan.map((_, i) => {
        const angle = (i / kepingan.length) * Math.PI * 2;
        const jarak = 60 + Math.random() * 30;
        const cx = Math.cos(angle) * jarak;
        const cy = Math.sin(angle) * jarak;
        const warna = CONFETTI_WARNA[i % CONFETTI_WARNA.length];
        return (
          <span
            key={i}
            className={`absolute h-2.5 w-2.5 rounded-sm ${warna} animate-confetti-burst`}
            style={
              {
                "--cx": `${cx}px`,
                "--cy": `${cy}px`,
                animationDelay: `${i * 30}ms`,
              } as Record<string, string>
            }

          />
        );
      })}
    </div>
  );
}

function ConfettiPenuhSkrin() {
  const kepingan = Array.from({ length: 40 });
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {kepingan.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 1.8 + Math.random() * 1.4;
        const size = 8 + Math.random() * 8;
        const warna = CONFETTI_WARNA[i % CONFETTI_WARNA.length];
        const bulat = i % 2 === 0;
        return (
          <span
            key={i}
            className={`absolute top-0 ${warna} ${bulat ? "rounded-full" : "rounded-sm"} animate-confetti-fall`}
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          />
        );
      })}
    </div>
  );
}


function PaparKira({ data }: { data: DataKira }) {
  const bilangan = Math.max(0, Math.min(10, data.bilangan ?? 0));
  const ikonKey = data.ikon ?? "star";
  const conf = IKON_KIRA[ikonKey] ?? IKON_KIRA.star;
  const Ikon = conf.Icon;
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {Array.from({ length: bilangan }).map((_, i) => (
          <Ikon
            key={i}
            className={`h-14 w-14 sm:h-16 sm:w-16 ${conf.cls} animate-pop`}
            strokeWidth={2}
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
