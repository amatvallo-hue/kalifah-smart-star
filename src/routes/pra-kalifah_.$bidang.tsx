import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  BookOpen,
  Image as ImageIcon,
  PencilRuler,
  Hash,
  Palette,
  Shapes,
  Square,
  Triangle,
  Diamond,
  PawPrint,
  Apple,
  PersonStanding,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StarReward } from "@/components/StarReward";
import { BlobsLatar, temaBidangDariSlug, usePraBahasa, ToggleBahasa } from "./pra-kalifah";


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

type JenisAktiviti =
  | "huruf"
  | "kira"
  | "adab"
  | "huruf-gambar"
  | "lengkap"
  | "nombor"
  | "warna"
  | "bentuk"
  | "kosa-kata";

const WARNA_SWATCH: Record<string, string> = {
  Merah: "bg-red-500",
  Biru: "bg-blue-500",
  Hijau: "bg-green-500",
  Kuning: "bg-yellow-400",
  Oren: "bg-orange-500",
  Ungu: "bg-purple-500",
  Hitam: "bg-gray-900",
  Coklat: "bg-amber-800",
  Putih: "bg-white",
  "Merah Jambu": "bg-pink-400",
  Kelabu: "bg-gray-400",
};

const IKON_BENTUK: Record<string, LucideIcon> = {
  Bulatan: Circle,
  "Segi Empat": Square,
  "Segi Tiga": Triangle,
  Bintang: Star,
  Hati: Heart,
  Delima: Diamond,
};

interface DataAktiviti {
  bilangan?: number;
  ikon?: string;
  emoji?: string;
  perkataan?: string;
  urutan?: string[];
}

interface Soalan {
  id: string;
  tertib: number;
  arahan_audio_teks: string | null;
  arahan_audio_teks_en: string | null;
  huruf_sasaran: string | null;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  pilihan_a_en: string | null;
  pilihan_b_en: string | null;
  pilihan_c_en: string | null;
  pilihan_d_en: string | null;
  jawapan_betul: string;
  data_aktiviti: DataAktiviti | null;
}

interface AktivitiConfig {
  namaAktiviti: string;
  tajuk: string;
  tajukEn?: string;
  mesejSelesai: string;
  mesejSelesaiEn?: string;
  jenis: JenisAktiviti;
  ikon: LucideIcon;
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

const BIDANG_CONFIG: Record<string, AktivitiConfig[]> = {
  bahasa: [
    {
      namaAktiviti: "Cari Huruf",
      tajuk: "Cari Huruf",
      tajukEn: "Find Letters",
      mesejSelesai: "Syabas! Kamu dah kenal semua huruf!",
      mesejSelesaiEn: "Great job! You know all the letters!",
      jenis: "huruf",
      ikon: BookOpen,
    },

    {
      namaAktiviti: "Huruf dan Gambar",
      tajuk: "Huruf dan Gambar",
      mesejSelesai: "Syabas! Kamu dah pandai padan huruf dan gambar!",
      jenis: "huruf-gambar",
      ikon: ImageIcon,
    },
    {
      namaAktiviti: "Lengkapkan Huruf",
      tajuk: "Lengkapkan Huruf",
      mesejSelesai: "Syabas! Kamu dah pandai susun huruf!",
      jenis: "lengkap",
      ikon: PencilRuler,
    },
    {
      namaAktiviti: "Haiwan",
      tajuk: "Haiwan",
      mesejSelesai: "Syabas! Kamu kenal haiwan!",
      jenis: "kosa-kata",
      ikon: PawPrint,
    },
    {
      namaAktiviti: "Buah-buahan",
      tajuk: "Buah-buahan",
      tajukEn: "Fruits",
      mesejSelesai: "Syabas! Kamu kenal buah-buahan!",
      mesejSelesaiEn: "Great job! You know your fruits!",
      jenis: "kosa-kata",
      ikon: Apple,
    },

    {
      namaAktiviti: "Anggota Badan",
      tajuk: "Anggota Badan",
      mesejSelesai: "Syabas! Kamu kenal anggota badan!",
      jenis: "kosa-kata",
      ikon: PersonStanding,
    },
  ],
  kognitif: [
    {
      namaAktiviti: "Kira Bersama",
      tajuk: "Kira Bersama",
      mesejSelesai: "Syabas! Kamu dah pandai kira!",
      jenis: "kira",
      ikon: Star,
    },
    {
      namaAktiviti: "Pilih Nombor",
      tajuk: "Pilih Nombor",
      mesejSelesai: "Syabas! Kamu dah kenal nombor!",
      jenis: "nombor",
      ikon: Hash,
    },
    {
      namaAktiviti: "Warna",
      tajuk: "Warna",
      mesejSelesai: "Syabas! Kamu dah kenal warna!",
      jenis: "warna",
      ikon: Palette,
    },
    {
      namaAktiviti: "Bentuk",
      tajuk: "Bentuk",
      mesejSelesai: "Syabas! Kamu dah kenal bentuk!",
      jenis: "bentuk",
      ikon: Shapes,
    },
  ],
  kerohanian: [
    {
      namaAktiviti: "Adab Harian",
      tajuk: "Adab Harian",
      mesejSelesai: "Syabas! Kamu budak yang baik!",
      jenis: "adab",
      ikon: HandHeart,
    },
  ],
};

function AktivitiPraKalifahPage() {
  const { bidang } = useParams({ from: "/pra-kalifah_/$bidang" });
  const senaraiAktiviti = BIDANG_CONFIG[bidang];
  const tema = temaBidangDariSlug(bidang);

  // auto-pilih bila cuma 1 aktiviti
  const [pilihIdx, setPilihIdx] = useState<number | null>(
    senaraiAktiviti && senaraiAktiviti.length === 1 ? 0 : null,
  );
  const config = pilihIdx !== null && senaraiAktiviti ? senaraiAktiviti[pilihIdx] : null;

  const [soalan, setSoalan] = useState<Soalan[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [betul, setBetul] = useState<string | null>(null);
  const [salah, setSalah] = useState<string | null>(null);
  const [selesai, setSelesai] = useState(false);
  const [bahasa, setBahasa] = usePraBahasa();


  useEffect(() => {
    if (!config) return;
    let mounted = true;
    setLoading(true);
    setErr(null);
    setSoalan([]);
    setIdx(0);
    setSelesai(false);
    (async () => {
      const { data, error } = await supabase
        .from("pra_kalifah_aktiviti" as never)
        .select(
          "id, tertib, arahan_audio_teks, arahan_audio_teks_en, huruf_sasaran, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_a_en, pilihan_b_en, pilihan_c_en, pilihan_d_en, jawapan_betul, data_aktiviti",
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

  function pilih(key: "a" | "b" | "c" | "d") {
    if (!current || betul) return;
    if (key === kunciBetul) {
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


  function kembaliKePemilihan() {
    setPilihIdx(null);
    setSoalan([]);
    setIdx(0);
    setSelesai(false);
    setBetul(null);
    setSalah(null);
  }

  if (!senaraiAktiviti) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-foreground">{bahasa === "en" ? "Section not found" : "Bidang tidak dijumpai"}</h1>
          <Link
            to="/pra-kalifah"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> {bahasa === "en" ? "Back" : "Kembali"}

          </Link>
        </div>
      </div>
    );
  }

  // Skrin pemilihan aktiviti (>1 aktiviti dan belum pilih)
  if (pilihIdx === null) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background p-4">
        <BlobsLatar />
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4">
          <div className="flex items-center justify-between">
            <Link
              to="/pra-kalifah"
              className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-foreground shadow-card transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> {bahasa === "en" ? "Back" : "Kembali"}
            </Link>
            <ToggleBahasa bahasa={bahasa} setBahasa={setBahasa} />
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft ring-8 ring-rose-200/70 animate-wiggle-float">
              <Baby className="h-12 w-12" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              {bahasa === "en" ? "Choose Activity" : "Pilih Aktiviti"}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              {bahasa === "en" ? "What do you want to play today?" : "Kamu nak main aktiviti apa hari ini?"}
            </p>

          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {senaraiAktiviti.map((a, i) => {
              const Ikon = a.ikon;
              return (
                <button
                  key={a.namaAktiviti}
                  type="button"
                  onClick={() => setPilihIdx(i)}
                  style={{ animationDelay: `${i * 250}ms` }}
                  className={`group flex flex-col items-center gap-3 rounded-3xl border-2 ${tema.kadBorder} ${tema.kadBg} p-5 shadow-card transition animate-idle-pulse hover:-translate-y-1 hover:shadow-soft`}
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${tema.grad} ${tema.text} shadow-soft ring-4 ring-white/60 transition group-hover:scale-110`}
                  >
                    <Ikon className="h-8 w-8" strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <h2 className="font-display text-base font-extrabold text-foreground sm:text-lg">
                      {bahasa === "en" && a.tajukEn ? a.tajukEn : a.tajuk}
                    </h2>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !config) {
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
    const boleh_kembali_pilihan = senaraiAktiviti.length > 1;
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        <BlobsLatar />
        <ConfettiPenuhSkrin />
        <div className={`relative z-10 w-full max-w-md rounded-3xl border-2 ${tema.kadBorder} ${tema.kadBg} p-8 text-center shadow-card`}>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft ring-8 ring-rose-200/70 animate-wiggle-float">
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
          <div className="mt-8 flex flex-col gap-3">
            {boleh_kembali_pilihan && (
              <button
                type="button"
                onClick={kembaliKePemilihan}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-card px-6 py-3 font-display text-sm font-extrabold text-foreground shadow-card hover:bg-secondary"
              >
                Pilih Aktiviti Lain
              </button>
            )}
            <Link
              to="/pra-kalifah"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Dunia Pra Kalifah
            </Link>
          </div>
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
      : config.jenis === "kira"
        ? "Kira, berapa banyak?"
        : config.jenis === "lengkap"
          ? "Lengkapkan susunan."
          : "Pilih jawapan!");

  const guna_ikon_besar = config.jenis === "adab";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background p-4">
      <BlobsLatar />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (senaraiAktiviti.length > 1) {
                kembaliKePemilihan();
              } else {
                window.history.back();
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-foreground shadow-card transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Keluar
          </button>
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
        <div className={`flex items-center gap-4 rounded-3xl border-2 ${tema.kadBorder} ${tema.kadBg} p-5 shadow-card`}>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft ring-4 ring-rose-200/80 animate-wiggle-float">
            <Baby className="h-10 w-10" strokeWidth={2.5} />
          </div>
          <div className="relative flex-1 rounded-2xl bg-white/70 p-4">
            <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 bg-white/70" />
            <p className="font-display text-xl font-extrabold text-foreground sm:text-2xl">{arahan}</p>
          </div>
        </div>

        {/* Papar objek untuk aktiviti Kira */}
        {config.jenis === "kira" && current.data_aktiviti && (
          <PaparKira data={current.data_aktiviti} />
        )}

        {/* Huruf dan Gambar */}
        {config.jenis === "huruf-gambar" && current.data_aktiviti && (
          <PaparHurufGambar data={current.data_aktiviti} tema={tema} />
        )}

        {/* Lengkapkan Huruf */}
        {config.jenis === "lengkap" && current.data_aktiviti && (
          <PaparLengkap data={current.data_aktiviti} tema={tema} />
        )}

        {/* Pilihan 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {pilihanList.map((p, i) => {
            const isBetul = betul === p.key;
            const isSalah = salah === p.key;
            const disabled = betul !== null;
            const baseColor = BUTANG_WARNA[i];
            const IkonAdab = guna_ikon_besar ? (IKON_ADAB[p.nilai] ?? HelpCircle) : null;
            const IkonBentuk = config.jenis === "bentuk" ? (IKON_BENTUK[p.nilai] ?? HelpCircle) : null;
            const swatchCls = config.jenis === "warna" ? (WARNA_SWATCH[p.nilai] ?? "bg-gray-300") : null;
            const isVisual = config.jenis === "warna" || config.jenis === "bentuk";
            const bgCls = swatchCls
              ? `${swatchCls} hover:brightness-110 text-white ring-4 ring-white/60`
              : baseColor;
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => pilih(p.key, p.nilai)}
                style={!disabled ? { animationDelay: `${i * 350}ms` } : undefined}
                aria-label={p.nilai}
                className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-visible rounded-3xl text-center font-display font-extrabold shadow-card transition ${
                  guna_ikon_besar
                    ? "p-3 text-sm sm:text-base"
                    : config.jenis === "kosa-kata"
                      ? "p-1 text-7xl sm:text-8xl"
                      : "p-3 text-6xl sm:text-7xl"
                } ${
                  isBetul
                    ? "bg-emerald-500 text-white animate-pop"
                    : isSalah
                      ? `${bgCls} animate-shake`
                      : `${bgCls} animate-idle-pulse hover:-translate-y-1 hover:shadow-soft`
                } ${disabled && !isBetul ? "opacity-70" : ""}`}
              >
                {IkonAdab ? (
                  <>
                    <IkonAdab className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2.5} />
                    <span className="leading-tight">{p.nilai}</span>
                  </>
                ) : IkonBentuk ? (
                  <IkonBentuk
                    className="h-20 w-20 sm:h-24 sm:w-24 text-white"
                    strokeWidth={2.5}
                    fill="currentColor"
                  />
                ) : isVisual ? null : (
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
  const kepingan = useMemo(() => Array.from({ length: 40 }), []);
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


function PaparKira({ data }: { data: DataAktiviti }) {
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

function PaparHurufGambar({
  data,
  tema,
}: {
  data: DataAktiviti;
  tema: ReturnType<typeof temaBidangDariSlug>;
}) {
  return (
    <div className={`rounded-3xl border-2 ${tema.kadBorder} ${tema.kadBg} p-6 shadow-card`}>
      <div className="flex flex-col items-center gap-2">
        <div className="text-7xl sm:text-8xl animate-pop" aria-hidden>
          {data.emoji ?? "❓"}
        </div>
        {data.perkataan && (
          <div className="font-display text-lg font-extrabold text-foreground sm:text-xl">
            {data.perkataan}
          </div>
        )}
      </div>
    </div>
  );
}

function PaparLengkap({
  data,
  tema,
}: {
  data: DataAktiviti;
  tema: ReturnType<typeof temaBidangDariSlug>;
}) {
  const urutan = data.urutan ?? [];
  return (
    <div className={`rounded-3xl border-2 ${tema.kadBorder} ${tema.kadBg} p-5 shadow-card`}>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {urutan.map((h, i) => {
          const kosong = h === "_";
          return (
            <div
              key={i}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl font-display text-4xl font-extrabold shadow-card sm:h-20 sm:w-20 sm:text-5xl ${
                kosong
                  ? "border-4 border-dashed border-rose-400 bg-white/50 text-rose-400 animate-idle-pulse"
                  : "bg-white text-foreground"
              }`}
            >
              {kosong ? "?" : h}
            </div>
          );
        })}
      </div>
    </div>
  );
}
