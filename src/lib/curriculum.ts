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
}

export const DARJAH_LIST: Darjah[] = [
  { id: "1", label: "Darjah 1", tagline: "Mula pengembaraan!", locked: false },
  { id: "2", label: "Darjah 2", tagline: "Teruskan belajar!", locked: false },
  { id: "3", label: "Darjah 3", tagline: "Naik ke tahap baru!", locked: false },
  { id: "4", label: "Darjah 4", tagline: "Cabaran lebih hebat!", locked: false },
  { id: "5", label: "Darjah 5", tagline: "Jadi lebih pandai!", locked: false },
  { id: "6", label: "Darjah 6", tagline: "Bersedia ke menengah!", locked: false },
];

export const SUBJEK_LIST: Subjek[] = [
  { id: "bahasa-melayu", title: "Bahasa Melayu", description: "Tatabahasa & karangan ringkas.", icon: PenLine, tone: "sky" },
  { id: "bahasa-inggeris", title: "Bahasa Inggeris", description: "Vocabulary & simple sentences.", icon: Languages, tone: "violet" },
  { id: "matematik", title: "Matematik", description: "Nombor, tambah, tolak & lebih.", icon: Calculator, tone: "gold" },
  { id: "sains", title: "Sains", description: "Alam sekitar dan ciptaan Allah.", icon: Globe, tone: "teal" },
  { id: "jawi", title: "Jawi", description: "Tulisan jawi asas.", icon: Moon, tone: "amber" },
  { id: "pendidikan-islam", title: "Pendidikan Islam", description: "Rukun Iman, doa & sirah.", icon: BookOpen, tone: "emerald" },
];

export function getDarjah(id: string) {
  return DARJAH_LIST.find((d) => d.id === id);
}

export function getSubjek(id: string) {
  return SUBJEK_LIST.find((s) => s.id === id);
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
