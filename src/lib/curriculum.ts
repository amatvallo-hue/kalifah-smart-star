import { BookOpen, Calculator, Globe, Languages, Moon, PenLine, type LucideIcon } from "lucide-react";

export type Tone = "emerald" | "gold" | "sky" | "rose" | "violet" | "amber" | "teal";

export interface Darjah {
  id: string;
  label: string;
  tagline: string;
  locked: boolean;
}

export interface Subjek {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  emoji: string;
}

// Semua darjah kini berbayar — `locked` ditentukan oleh profile.darjah_akses
export const DARJAH_LIST: Darjah[] = [
  { id: "1", label: "Darjah 1", tagline: "Mula pengembaraan!", locked: true },
  { id: "2", label: "Darjah 2", tagline: "Teruskan belajar!", locked: true },
  { id: "3", label: "Darjah 3", tagline: "Naik ke tahap baru!", locked: true },
  { id: "4", label: "Darjah 4", tagline: "Cabaran lebih hebat!", locked: true },
  { id: "5", label: "Darjah 5", tagline: "Jadi lebih pandai!", locked: true },
  { id: "6", label: "Darjah 6", tagline: "Bersedia ke menengah!", locked: true },
];

export const SUBJEK_LIST: Subjek[] = [
  { id: "bahasa-melayu", title: "Bahasa Melayu", description: "Tatabahasa & karangan ringkas.", icon: PenLine, tone: "sky", emoji: "📖" },
  { id: "bahasa-inggeris", title: "Bahasa Inggeris", description: "Vocabulary & simple sentences.", icon: Languages, tone: "violet", emoji: "🌍" },
  { id: "matematik", title: "Matematik", description: "Nombor, tambah, tolak & lebih.", icon: Calculator, tone: "gold", emoji: "🔢" },
  { id: "sains", title: "Sains", description: "Alam sekitar dan ciptaan Allah.", icon: Globe, tone: "teal", emoji: "🔬" },
  { id: "jawi", title: "Jawi", description: "Tulisan jawi asas.", icon: Moon, tone: "amber", emoji: "🌙" },
  { id: "pendidikan-islam", title: "Pendidikan Islam", description: "Rukun Iman, doa & sirah.", icon: BookOpen, tone: "emerald", emoji: "⭐" },
];

export function getDarjah(id: string) {
  return DARJAH_LIST.find((d) => d.id === id);
}

export function getSubjek(id: string) {
  return SUBJEK_LIST.find((s) => s.id === id);
}

// Jawi disembunyikan daripada pelajar & ibu bapa.
// Hanya admin boleh melihat/mengakses Jawi untuk penyuntingan kandungan.
export function subjekListUntukRole(role?: string | null): Subjek[] {
  if (role === "admin") return SUBJEK_LIST;
  return SUBJEK_LIST.filter((s) => s.id !== "jawi");
}

export const TONE_GRADIENT: Record<Tone, string> = {
  emerald: "from-primary to-primary-glow text-primary-foreground",
  gold: "from-gold to-gold/80 text-gold-foreground",
  sky: "from-sky-400 to-sky-300 text-sky-900",
  rose: "from-rose-400 to-rose-300 text-rose-900",
  violet: "from-violet-400 to-violet-300 text-violet-900",
  amber: "from-amber-400 to-amber-300 text-amber-900",
  teal: "from-teal-400 to-teal-300 text-teal-900",
};


// ── HARGA & PAKEJ ────────────────────────────────────────────
export const HARGA_ASAL = 89; // per darjah, strikethrough
export interface Pakej {
  id: "satu" | "perDarjah" | "bundle";
  nama: string;
  hargaPerDarjah: number;
  jumlahDarjah: number | "pilih";
  jumlahBayar: number;
  jimat?: number;
  popular?: boolean;
  deskripsi: string;
}
export const PAKEJ_LIST: Pakej[] = [
  {
    id: "satu",
    nama: "1 Darjah",
    hargaPerDarjah: 49,
    jumlahDarjah: 1,
    jumlahBayar: 49,
    deskripsi: "Akses penuh satu darjah pilihan selama 1 tahun.",
  },
  {
    id: "perDarjah",
    nama: "2–5 Darjah",
    hargaPerDarjah: 39,
    jumlahDarjah: "pilih",
    jumlahBayar: 39,
    deskripsi: "Diskaun untuk keluarga dengan beberapa anak. RM39/darjah/tahun.",
  },
  {
    id: "bundle",
    nama: "Bundle 6 Darjah",
    hargaPerDarjah: 33,
    jumlahDarjah: 6,
    jumlahBayar: 199,
    jimat: 89 * 6 - 199,
    popular: true,
    deskripsi: "Semua D1–D6 untuk 1 tahun. Pilihan paling berbaloi!",
  },
];
