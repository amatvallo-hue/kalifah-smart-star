import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/pra-kalifah")({
  head: () => ({
    meta: [
      { title: "Pra Kalifah — Kalifah.my" },
      { name: "description", content: "Mod pembelajaran pra-sekolah khas untuk kanak-kanak 4–6 tahun akan datang di Kalifah.my." },
    ],
  }),
  ssr: false,
  component: PraKalifahPage,
});

function PraKalifahPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft">
          <Baby className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-foreground">
          Pra Kalifah
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Akan datang tidak lama lagi! Mod pembelajaran khas untuk kanak-kanak 4–6 tahun sedang dalam pembinaan.
        </p>
        <Link
          to="/pilih-darjah"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pilih Darjah
        </Link>
      </div>
    </div>
  );
}
