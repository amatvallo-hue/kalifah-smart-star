import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Shapes, Loader2, Baby, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pra-kalifah")({
  head: () => ({
    meta: [
      { title: "Pulau Pra Kalifah — Pilih Bidang" },
      {
        name: "description",
        content: "Pilih bidang pembelajaran untuk kanak-kanak pra sekolah di Kalifah.my.",
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

// map bidang → slug rute + tema warna kad
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
  // accent (default)
  return {
    grad: "from-sky-400 to-cyan-300",
    text: "text-sky-900",
    kadBg: "bg-sky-50",
    kadBorder: "border-sky-300",
  };
}

// Tema mengikut slug bidang — untuk skrin aktiviti
export function temaBidangDariSlug(slug: string) {
  if (slug === "kognitif") return bidangTema("pro");
  if (slug === "kerohanian") return bidangTema("success");
  return bidangTema("accent");
}

const TAGLINE_MAP: Record<string, string> = {
  "Bahasa dan Literasi": "Kenal huruf & perkataan",
  "Kognitif": "Kira, warna & bentuk",
  "Kerohanian Nilai dan Kewarganegaraan": "Doa & adab harian",
};

function PulauPraKalifahPage() {
  const [bidang, setBidang] = useState<Bidang[]>([]);
  const [kiraan, setKiraan] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background p-4">
      <BlobsLatar />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            to="/pilih-darjah"
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-foreground shadow-card transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>

        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-rose-200 via-orange-200 to-amber-200 p-5 shadow-card sm:gap-6 sm:p-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-lg ring-[6px] ring-white animate-wiggle-float sm:h-28 sm:w-28">
            <Baby className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-extrabold text-rose-950 sm:text-4xl">
              Pulau Pra Kalifah
            </h1>
            <p className="text-sm font-semibold text-rose-900/80 sm:text-base">
              Pilih bidang yang kamu nak belajar hari ini!
            </p>
          </div>
        </div>

        {err ? (
          <div className="rounded-3xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            {err}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}


export function BlobsLatar() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-rose-300 opacity-60 blur-3xl animate-blob-drift" />
      <div
        className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-sky-300 opacity-60 blur-3xl animate-blob-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute left-1/4 -bottom-28 h-[26rem] w-[26rem] rounded-full bg-amber-200 opacity-65 blur-3xl animate-blob-drift"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute -right-20 -bottom-24 h-96 w-96 rounded-full bg-violet-300 opacity-55 blur-3xl animate-blob-drift"
        style={{ animationDelay: "6s" }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200 opacity-50 blur-3xl animate-blob-drift"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute right-1/4 top-4 h-64 w-64 rounded-full bg-fuchsia-200 opacity-55 blur-3xl animate-blob-drift"
        style={{ animationDelay: "5s" }}
      />
    </div>
  );
}

