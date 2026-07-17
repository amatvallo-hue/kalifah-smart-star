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
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/a%20lush%203d%20render%20of%20Adorable%20teal%20green%20baby%20owl%20mascot%20character%2C%20premium%203D%20cartoon%20illustration%2C%20educational%20mascot%20for%20preschool%20learning%20platform.%20Large%20glossy%20expressive%20eyes%2C%20one%20eye%20playfully%20winking%2C%20cheerful%20smile%2C%20waving%20one%20wing.jpg";
const IMG_TAHAP1_ISTANA =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/a%20lush%203d%20render%20of%20Cute%20magical%20pink%20fairytale%20castle%20island%2C%20premium%203D%20cartoon%20illustration%2C%20learning%20world%20for%20preschool%20children.%20Beautiful%20pastel%20pink%20castle%20with%20rounded%20towers%2C%20soft%20coral-pink%20roofs%2C%20golden%20flags%2C%20floating%20clouds%2C%20t.jpg";
const IMG_TAHAP2_RUMAH =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/a%20lush%203d%20render%20of%20Cute%20cozy%20learning%20village%20island%2C%20premium%203D%20cartoon%20illustration%2C%20preschool%20educational%20world.%20Small%20charming%20yellow-orange%20cottage%20house%20with%20glowing%20windows%2C%20rounded%20roof%2C%20stone%20pathway%2C%20tiny%20trees%2C%20flowers%20and%20frien.jpg";
const IMG_TAHAP3_ROKET =
  "https://pgpkqbdyxoejwvubluqq.supabase.co/storage/v1/object/public/pra-kalifah-imej/a%20lush%203d%20render%20of%20Cute%20futuristic%20rocket%20launch%20island%2C%20premium%203D%20cartoon%20illustration%2C%20final%20learning%20world%20before%20entering%20primary%20school.%20Friendly%20green%20and%20white%20rocket%20ship%20with%20rounded%20body%2C%20large%20circular%20window%2C%20soft%20fins%20and%20smi.jpg";

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
  warna_kod: string | null;
  ikon_nama: string | null;
  tertib: number;
}

const IKON_MAP: Record<string, LucideIcon> = {
  abc: BookOpen,
  shapes: Shapes,
  "moon-star": Sparkles,
};

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
            <span className="pointer-events-none absolute left-4 top-3 text-5xl opacity-60 animate-cloud-drift">☁️</span>
            <span className="pointer-events-none absolute right-12 top-5 text-4xl opacity-50 animate-cloud-drift" style={{ animationDelay: "6s" }}>☁️</span>

            {/* Decorative stars */}
            <span className="pointer-events-none absolute left-1/4 top-4 text-3xl opacity-70 animate-twinkle">⭐</span>
            <span className="pointer-events-none absolute right-1/3 top-2 text-2xl opacity-80 animate-twinkle" style={{ animationDelay: "0.7s" }}>⭐</span>
            <span className="pointer-events-none absolute left-2/3 top-6 text-3xl opacity-75 animate-twinkle" style={{ animationDelay: "1.4s" }}>⭐</span>

            {/* Decorative balloon */}
            <span className="pointer-events-none absolute right-6 bottom-4 text-6xl opacity-70 animate-balloon-float">🎈</span>
          </div>

          {/* Mascot — pops out past the card edge */}
          <img
            src={IMG_MASCOT}
            alt="Mascot"
            className="absolute -left-4 -bottom-8 z-20 h-56 w-auto object-contain sm:h-72 sm:-bottom-10"
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
          <div className="absolute left-44 right-5 bottom-5 z-10 text-right sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-[320px]">
            <h1 className="font-display text-2xl font-extrabold text-[#0F172A] sm:text-4xl">
              Dunia Pra Kalifah 🌈
            </h1>
            <p className="text-sm font-semibold text-[#0F172A]/70 sm:text-base">
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
