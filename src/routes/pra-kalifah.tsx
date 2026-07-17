import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Shapes,
  Loader2,
  Baby,
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
      { title: "Pulau Pra Kalifah — Pilih Tahap" },
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
  warna: string; // hex
  terkunci: boolean;
}

const TAHAP_LIST: TahapInfo[] = [
  { nombor: 1, nama: "Pengenalan", umur: "4 tahun", ikon: BookOpen, warna: "#FF7B9C", terkunci: false },
  { nombor: 2, nama: "Asas", umur: "5 tahun", ikon: Shapes, warna: "#FFD166", terkunci: true },
  { nombor: 3, nama: "Persediaan Darjah 1", umur: "6 tahun", ikon: Rocket, warna: "#16A34A", terkunci: true },
];

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

        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-[#FF7B9C]/30 via-[#FFD166]/30 to-[#5AC8FA]/30 p-5 shadow-card sm:gap-6 sm:p-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF7B9C] to-[#CBA6F7] text-white shadow-lg ring-[6px] ring-white animate-wiggle-float sm:h-28 sm:w-28">
            <img
              src={IMG_MASCOT}
              alt="Mascot"
              className="h-full w-full rounded-3xl object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-extrabold text-[#0F172A] sm:text-4xl">
              Pulau Pra Kalifah 🌈
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
          <div className="flex flex-col gap-4">
            {TAHAP_LIST.map((t, i) => {
              const Ikon = t.ikon;
              const totalBadge =
                t.nombor === 1 && totalAktiviti > 0 ? `${totalAktiviti} aktiviti` : null;
              const boleh = !t.terkunci;
              const content = (
                <div
                  className={`relative flex items-center gap-5 rounded-3xl border-2 p-5 shadow-card transition sm:p-6 ${
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
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl text-white shadow-lg ring-[6px] ring-white sm:h-24 sm:w-24"
                    style={{ backgroundColor: t.warna }}
                  >
                    <Ikon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold text-white sm:text-xs"
                        style={{ backgroundColor: t.warna }}
                      >
                        Tahap {t.nombor}
                      </span>
                      {t.terkunci && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0F172A]/10 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-[#0F172A] sm:text-xs">
                          <Lock className="h-3 w-3" /> Akan Datang
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-xl font-extrabold text-[#0F172A] sm:text-2xl">
                      {t.nama}
                    </h2>
                    <p className="text-xs font-semibold text-[#0F172A]/70 sm:text-sm">
                      {t.umur}
                    </p>
                    {totalBadge && (
                      <span className="mt-1 inline-flex w-fit items-center rounded-full bg-white/90 px-3 py-1 font-display text-xs font-extrabold text-[#0F172A] shadow-sm">
                        {totalBadge}
                      </span>
                    )}
                  </div>
                  {boleh && (
                    <span
                      className="hidden shrink-0 rounded-full px-4 py-2 font-display text-sm font-extrabold text-white shadow-md sm:inline-flex"
                      style={{ backgroundColor: t.warna }}
                    >
                      Mula →
                    </span>
                  )}
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
      <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-[#FF7B9C] opacity-40 blur-3xl animate-blob-drift" />
      <div
        className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#5AC8FA] opacity-40 blur-3xl animate-blob-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute left-1/4 -bottom-28 h-[26rem] w-[26rem] rounded-full bg-[#FFD166] opacity-45 blur-3xl animate-blob-drift"
        style={{ animationDelay: "4s" }}
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
