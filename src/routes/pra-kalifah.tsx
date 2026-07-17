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
};

// map bidang → slug rute + tema warna kad
function bidangSlug(ikon: string | null, nama: string): string {
  if (ikon === "abc") return "bahasa";
  if (ikon === "shapes") return "kognitif";
  return nama.toLowerCase().replace(/\s+/g, "-");
}

function bidangTema(warna: string | null): { grad: string; text: string } {
  if (warna === "pro") {
    return {
      grad: "from-violet-400 to-fuchsia-300",
      text: "text-violet-900",
    };
  }
  // accent (default)
  return {
    grad: "from-sky-400 to-cyan-300",
    text: "text-sky-900",
  };
}

function PulauPraKalifahPage() {
  const [bidang, setBidang] = useState<Bidang[]>([]);
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
      } else {
        setBidang((data ?? []) as unknown as Bidang[]);
      }
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
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-4">
        <div className="flex items-center justify-between">
          <Link
            to="/pilih-darjah"
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-display text-xs font-extrabold text-foreground shadow-card transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft animate-float">
            <Baby className="h-10 w-10" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Pulau Pra Kalifah
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Pilih bidang yang kamu nak belajar hari ini!
          </p>
        </div>

        {err ? (
          <div className="rounded-3xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            {err}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {bidang.map((b) => {
              const Ikon = IKON_MAP[b.ikon_nama ?? ""] ?? BookOpen;
              const tema = bidangTema(b.warna_kod);
              const slug = bidangSlug(b.ikon_nama, b.nama);
              return (
                <Link
                  key={b.id}
                  to="/pra-kalifah/$bidang"
                  params={{ bidang: slug }}
                  className="group flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${tema.grad} ${tema.text} shadow-soft transition group-hover:scale-110`}
                  >
                    <Ikon className="h-12 w-12" strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <h2 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
                      {b.nama}
                    </h2>
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
