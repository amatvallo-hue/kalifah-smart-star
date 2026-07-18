import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Shapes,
  Loader2,
  Sparkles,
  Lock,
  Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const IMG_MASCOT =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/owl-mascot-nobg.png";
const IMG_TAHAP1_ISTANA =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/tahap1-istana-nobg.png";
const IMG_TAHAP2_RUMAH =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/tahap2-rumah-nobg.png";
const IMG_TAHAP3_ROKET =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/tahap3-roket-nobg.png";

export const Route = createFileRoute("/pra-kalifah")({
  head: () => ({
    meta: [
      { title: "Dunia Pra Kalifah — Pilih Tahap" },
      {
        name: "description",
        content: "Pilih tahap pembelajaran untuk kanak-kanak pra sekolah di Kalifah.my.",
      },
    ],
  }),
  ssr: false,
  component: PulauPraKalifahPage,
});

interface Bidang {
  id: string;
  nama: string;
  nama_en: string | null;
  warna_kod: string | null;
  ikon_nama: string | null;
  tertib: number;
}

const IKON_MAP: Record<string, LucideIcon> = {
  abc: BookOpen,
  shapes: Shapes,
  "moon-star": Sparkles,
};

type Bahasa = "bm" | "en";

export function usePraBahasa() {
  const [bahasa, setBahasaState] = useState<Bahasa>(() => {
    if (typeof window === "undefined") return "bm";
    return (localStorage.getItem("kalifah_pra_bahasa") as Bahasa) ?? "bm";
  });
  const setBahasa = (b: Bahasa) => {
    setBahasaState(b);
    if (typeof window !== "undefined") localStorage.setItem("kalifah_pra_bahasa", b);
  };
  return [bahasa, setBahasa] as const;
}

export function ToggleBahasa({
  bahasa,
  setBahasa,
}: {
  bahasa: Bahasa;
  setBahasa: (b: Bahasa) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-card">
      <button
        type="button"
        onClick={() => setBahasa("bm")}
        className={`rounded-full px-3 py-1.5 font-display text-xs font-extrabold transition ${
          bahasa === "bm" ? "bg-[#FF7B9C] text-white" : "text-[#0F172A]/50"
        }`}
      >
        BM
      </button>
      <button
        type="button"
        onClick={() => setBahasa("en")}
        className={`rounded-full px-3 py-1.5 font-display text-xs font-extrabold transition ${
          bahasa === "en" ? "bg-[#FF7B9C] text-white" : "text-[#0F172A]/50"
        }`}
      >
        EN
      </button>
    </div>
  );
}


function bidangSlug(ikon: string | null, nama: string): string {
  if (ikon === "abc") return "bahasa";
  if (ikon === "shapes") return "kognitif";
  if (ikon === "moon-star") return "kerohanian";
  return nama.toLowerCase().replace(/\s+/g, "-");
}

function bidangTema(warna: string | null): {
  grad: string;
  text: string;
  kadBg: string;
  kadBorder: string;
} {
  if (warna === "pro") {
    return {
      grad: "from-violet-400 to-fuchsia-300",
      text: "text-violet-900",
      kadBg: "bg-violet-50",
      kadBorder: "border-violet-300",
    };
  }
  if (warna === "success") {
    return {
      grad: "from-emerald-400 to-teal-300",
      text: "text-emerald-900",
      kadBg: "bg-emerald-50",
      kadBorder: "border-emerald-300",
    };
  }
  return {
    grad: "from-sky-400 to-cyan-300",
    text: "text-sky-900",
    kadBg: "bg-sky-50",
    kadBorder: "border-sky-300",
  };
}

export function temaBidangDariSlug(slug: string) {
  if (slug === "kognitif") return bidangTema("pro");
  if (slug === "kerohanian") return bidangTema("success");
  return bidangTema("accent");
}

const TAGLINE_MAP: Record<string, string> = {
  "Bahasa dan Literasi": "Kenal huruf & perkataan",
  Kognitif: "Kira, warna & bentuk",
  "Kerohanian Nilai dan Kewarganegaraan": "Doa & adab harian",
};

interface TahapInfo {
  nombor: number;
  nama: string;
  umur: string;
  ikon: LucideIcon;
  warna: string;
  terkunci: boolean;
}

const TAHAP_LIST: TahapInfo[] = [
  { nombor: 1, nama: "Pengenalan", umur: "4 tahun", ikon: BookOpen, warna: "#FF7B9C", terkunci: false },
  { nombor: 2, nama: "Asas", umur: "5 tahun", ikon: Shapes, warna: "#FFD166", terkunci: true },
  { nombor: 3, nama: "Persediaan Darjah 1", umur: "6 tahun", ikon: Rocket, warna: "#16A34A", terkunci: true },
];

const TAHAP_DESC: Record<number, string> = {
  1: "Belajar asas dengan cara yang menyeronokkan!",
  2: "Bina kemahiran asas untuk langkah seterusnya!",
  3: "Bersedia dengan yakin untuk Darjah 1!",
};

function PulauPraKalifahPage() {
  const [bidang, setBidang] = useState<Bidang[]>([]);
  const [kiraan, setKiraan] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tahapDipilih, setTahapDipilih] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("pra_kalifah_bidang" as never)
        .select("id, nama, warna_kod, ikon_nama, tertib, status")
        .eq("status", "aktif")
        .order("tertib", { ascending: true });
      if (!mounted) return;
      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }
      const list = (data ?? []) as unknown as Bidang[];
      setBidang(list);

      const { data: aktData } = await supabase
        .from("pra_kalifah_aktiviti" as never)
        .select("id, bidang_id");
      if (!mounted) return;
      const counts: Record<string, number> = {};
      for (const row of (aktData ?? []) as unknown as { bidang_id: string }[]) {
        counts[row.bidang_id] = (counts[row.bidang_id] ?? 0) + 1;
      }
      setKiraan(counts);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF7B9C]" />
      </div>
    );
  }

  const totalAktiviti = Object.values(kiraan).reduce((a, b) => a + b, 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFFDF8] p-4 text-[#0F172A]">
      <BlobsLatar />
      <PolaLatarSubtle />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            to="/pilih-darjah"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-xs font-extrabold text-[#0F172A] shadow-card transition hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>

        <div className="relative min-h-[220px] rounded-3xl p-5 shadow-card sm:min-h-[300px] sm:p-6">
          {/* Background gradient + decorations (clipped to card shape) */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF7B9C]/30 via-[#FFD166]/30 to-[#5AC8FA]/30">
            {/* Decorative clouds */}
            <span className="pointer-events-none absolute left-4 top-4 text-6xl opacity-60 animate-cloud-drift sm:text-7xl">☁️</span>
            <span className="pointer-events-none absolute right-10 top-6 text-5xl opacity-50 animate-cloud-drift sm:text-6xl" style={{ animationDelay: "6s" }}>☁️</span>

            {/* Decorative stars */}
            <span className="pointer-events-none absolute left-1/4 top-6 text-4xl opacity-70 animate-twinkle sm:text-5xl">⭐</span>
            <span className="pointer-events-none absolute right-1/3 top-3 text-3xl opacity-80 animate-twinkle sm:text-4xl" style={{ animationDelay: "0.7s" }}>⭐</span>
            <span className="pointer-events-none absolute left-2/3 top-8 text-4xl opacity-75 animate-twinkle sm:text-5xl" style={{ animationDelay: "1.4s" }}>⭐</span>

            {/* Decorative balloon */}
            <span className="pointer-events-none absolute right-8 bottom-6 text-7xl opacity-70 animate-balloon-float sm:text-8xl">🎈</span>
          </div>

          {/* Mascot — pops out past the card edge */}
          <img
            src={IMG_MASCOT}
            alt="Mascot"
            className="absolute -left-4 -bottom-2 z-20 h-56 w-auto object-contain sm:h-72 sm:-bottom-4"
          />

          {/* Speech bubble */}
          <div className="absolute left-40 top-4 z-30 sm:left-56 sm:top-8">
            <div className="relative rounded-2xl bg-[#FFFBF0] px-3 py-2 shadow-lg sm:rounded-3xl sm:px-4 sm:py-2.5">
              <p className="font-display text-sm font-extrabold text-[#0F172A] sm:text-lg">
                Hai kawan! 👋
              </p>
              <p className="text-xs font-semibold text-[#0F172A]/70 sm:text-sm">
                Jom belajar hari ini!
              </p>
              <div className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-[#FFFBF0] sm:h-4 sm:w-4" />
            </div>
          </div>

          {/* Heading */}
          <div className="absolute left-44 right-5 top-0 bottom-0 z-10 flex flex-col justify-center text-right sm:left-auto sm:right-10 sm:max-w-[360px]">
            <h1 className="font-display text-2xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl">
              Dunia Pra Kalifah 🌈
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#0F172A]/70 sm:text-lg">
              {tahapDipilih === 1
                ? "Pilih bidang yang kamu nak belajar hari ini!"
                : "Pilih tahap yang sesuai untuk anak kamu!"}
            </p>
          </div>
        </div>

        {err ? (
          <div className="rounded-3xl border border-border/60 bg-white p-6 text-center text-sm text-muted-foreground shadow-card">
            {err}
          </div>
        ) : tahapDipilih === 1 ? (
          <>
            <button
              type="button"
              onClick={() => setTahapDipilih(null)}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-xs font-extrabold text-[#0F172A] shadow-card transition hover:bg-white/80"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Tahap
            </button>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bidang.map((b, i) => {
                const Ikon = IKON_MAP[b.ikon_nama ?? ""] ?? BookOpen;
                const tema = bidangTema(b.warna_kod);
                const slug = bidangSlug(b.ikon_nama, b.nama);
                const tagline = TAGLINE_MAP[b.nama] ?? "";
                const count = kiraan[b.id] ?? 0;
                return (
                  <Link
                    key={b.id}
                    to="/pra-kalifah/$bidang"
                    params={{ bidang: slug }}
                    className={`group flex flex-col items-center gap-4 rounded-3xl border-2 ${tema.kadBorder} ${tema.kadBg} p-6 shadow-card transition animate-idle-pulse hover:-translate-y-1 hover:shadow-soft`}
                    style={{ animationDelay: `${i * 300}ms` }}
                  >
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${tema.grad} ${tema.text} shadow-lg ring-[6px] ring-white transition group-hover:scale-110`}
                    >
                      <Ikon className="h-12 w-12" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h2 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
                        {b.nama}
                      </h2>
                      {tagline && (
                        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                          {tagline}
                        </p>
                      )}
                      {count > 0 && (
                        <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 font-display text-xs font-extrabold text-foreground shadow-sm">
                          {count} aktiviti
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1 rounded-full bg-white/70 px-3 py-3 shadow-card sm:gap-3 sm:px-6">
            {TAHAP_LIST.map((t, i) => (
              <div key={t.nombor} className="flex items-center gap-1 sm:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-md sm:h-14 sm:w-14 sm:text-3xl"
                    style={{ backgroundColor: t.warna, opacity: t.terkunci ? 0.5 : 1 }}
                  >
                    {["🏰", "🏡", "🚀"][i]}
                  </div>
                  <span
                    className="font-display text-[10px] font-extrabold sm:text-xs"
                    style={{ color: t.terkunci ? "#0F172A66" : "#0F172A" }}
                  >
                    Tahap {t.nombor}
                  </span>
                </div>
                {i < TAHAP_LIST.length - 1 && (
                  <div className="mb-4 h-1 w-6 rounded-full bg-[#0F172A]/15 sm:w-14" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TAHAP_LIST.map((t, i) => {
              const tahapImg =
                [IMG_TAHAP1_ISTANA, IMG_TAHAP2_RUMAH, IMG_TAHAP3_ROKET][t.nombor - 1];
              const totalBadge =
                t.nombor === 1 && totalAktiviti > 0 ? `${totalAktiviti} aktiviti` : null;
              const boleh = !t.terkunci;
              const Ikon = t.ikon;
              const content = (
                <div
                  className={`relative flex flex-col rounded-3xl border-2 p-5 shadow-card transition sm:p-6 ${
                    boleh
                      ? "animate-idle-pulse hover:-translate-y-1 hover:shadow-soft"
                      : "opacity-60 grayscale-[30%]"
                  }`}
                  style={{
                    backgroundColor: `${t.warna}1A`,
                    borderColor: t.warna,
                    animationDelay: `${i * 300}ms`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md"
                      style={{ backgroundColor: t.warna }}
                    >
                      <Ikon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    {t.nombor === 1 && (
                      <span className="rounded-full bg-[#FF7B9C] px-2.5 py-0.5 font-display text-[10px] font-extrabold text-white shadow-sm">
                        BARU!
                      </span>
                    )}
                    {t.terkunci && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#0F172A]/10 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-[#0F172A]">
                        <Lock className="h-3 w-3" /> Akan Datang
                      </span>
                    )}
                  </div>

                  <img
                    src={tahapImg}
                    alt={t.nama}
                    className="h-32 w-full object-contain sm:h-40"
                  />

                  <h2 className="mt-2 font-display text-xl font-extrabold text-[#0F172A]">
                    {t.nama}
                  </h2>
                  <p className="text-xs font-semibold text-[#0F172A]/70">
                    {TAHAP_DESC[t.nombor]}
                  </p>

                  {totalBadge && (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full bg-white/90 px-3 py-1 font-display text-xs font-extrabold text-[#0F172A] shadow-sm">
                      {totalBadge}
                    </span>
                  )}

                  {t.nombor === 1 && (
                    <div className="mt-3 rounded-2xl bg-white/70 p-3">
                      <p className="mb-2 font-display text-[10px] font-extrabold uppercase tracking-wide text-[#0F172A]/50">
                        Aktiviti Hari Ini
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                        <span className="text-xs font-semibold text-[#0F172A]">🔤 Cari Huruf</span>
                        <span className="text-xs font-semibold text-[#0F172A]">🍎 Buah-buahan</span>
                        <span className="text-xs font-semibold text-[#0F172A]">🐱 Haiwan</span>
                        <span className="text-xs font-semibold text-[#0F172A]">🔢 Pilih Nombor</span>
                      </div>
                    </div>
                  )}

                  <span
                    className="mt-auto flex w-full items-center justify-center gap-1 rounded-full px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-md"
                    style={{ backgroundColor: t.warna }}
                  >
                    Terokai Tahap {t.nombor} →
                  </span>
                </div>
              );
              if (boleh) {
                return (
                  <button
                    key={t.nombor}
                    type="button"
                    onClick={() => setTahapDipilih(t.nombor)}
                    className="text-left"
                  >
                    {content}
                  </button>
                );
              }
              return (
                <button
                  key={t.nombor}
                  type="button"
                  onClick={() => setToast("Tahap ni akan datang tak lama lagi!")}
                  className="cursor-not-allowed text-left"
                  aria-disabled
                >
                  {content}
                </button>
              );
            })}
          </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0F172A] px-5 py-3 font-display text-sm font-extrabold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export function BlobsLatar() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#FF7B9C] opacity-30 blur-3xl animate-blob-drift"
      />
      <div
        className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-[#FFD166] opacity-30 blur-3xl animate-blob-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute -right-20 -bottom-24 h-96 w-96 rounded-full bg-[#CBA6F7] opacity-40 blur-3xl animate-blob-drift"
        style={{ animationDelay: "6s" }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#16A34A] opacity-25 blur-3xl animate-blob-drift"
        style={{ animationDelay: "3s" }}
      />
    </div>
  );
}

export function PolaLatarSubtle() {
  const items: { emoji: string; top: string; left: string; size: string; rotate: number }[] = [
    { emoji: "☁️", top: "5%", left: "8%", size: "text-8xl", rotate: -8 },
    { emoji: "⭐", top: "12%", left: "85%", size: "text-6xl", rotate: 12 },
    { emoji: "🌸", top: "20%", left: "45%", size: "text-7xl", rotate: 0 },
    { emoji: "🌈", top: "28%", left: "20%", size: "text-7xl", rotate: -6 },
    { emoji: "☁️", top: "34%", left: "70%", size: "text-9xl", rotate: 5 },
    { emoji: "⭐", top: "44%", left: "6%", size: "text-5xl", rotate: -15 },
    { emoji: "🌸", top: "50%", left: "90%", size: "text-6xl", rotate: 10 },
    { emoji: "🌈", top: "58%", left: "55%", size: "text-8xl", rotate: 4 },
    { emoji: "☁️", top: "66%", left: "25%", size: "text-7xl", rotate: -10 },
    { emoji: "⭐", top: "74%", left: "65%", size: "text-6xl", rotate: 8 },
    { emoji: "🌸", top: "82%", left: "12%", size: "text-7xl", rotate: -4 },
    { emoji: "☁️", top: "90%", left: "50%", size: "text-6xl", rotate: 6 },
    { emoji: "⭐", top: "95%", left: "80%", size: "text-5xl", rotate: -20 },
    { emoji: "🌸", top: "8%", left: "60%", size: "text-5xl", rotate: 15 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.14]">
      {items.map((it, i) => (
        <span
          key={i}
          className={`absolute select-none ${it.size}`}
          style={{ top: it.top, left: it.left, transform: `rotate(${it.rotate}deg)` }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
