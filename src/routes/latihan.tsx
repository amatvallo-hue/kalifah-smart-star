import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, PenLine, Send, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";

export const Route = createFileRoute("/latihan")({
  head: () => ({
    meta: [
      { title: "Latihan Bertulis — Kalifah.my" },
      { name: "description", content: "Latihan menulis kreatif untuk kanak-kanak." },
    ],
  }),
  component: LatihanPage,
});

const TUGASAN = [
  {
    tajuk: "Sifat Mahmudah",
    arahan: "Tuliskan satu perenggan tentang sifat baik yang kamu suka amalkan setiap hari.",
    contoh: "Contoh: Saya suka bersifat jujur kerana...",
  },
  {
    tajuk: "Keluarga Saya",
    arahan: "Ceritakan ahli keluarga kamu dalam 3 hingga 5 ayat.",
    contoh: "Contoh: Keluarga saya ada empat orang...",
  },
];

function LatihanPage() {
  const [pilih, setPilih] = useState(0);
  const [teks, setTeks] = useState("");
  const [hantar, setHantar] = useState(false);

  const tugasan = TUGASAN[pilih];
  const wordCount = teks.trim() ? teks.trim().split(/\s+/).length : 0;
  const bintang = wordCount >= 50 ? 3 : wordCount >= 25 ? 2 : wordCount >= 10 ? 1 : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">Latihan Bertulis</h1>
            <p className="text-sm text-muted-foreground">Pilih tugasan & tulis dengan kreatif</p>
          </div>
        </div>

        {/* Pilihan tugasan */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {TUGASAN.map((t, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPilih(idx);
                setHantar(false);
                setTeks("");
              }}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                pilih === idx
                  ? "border-primary bg-secondary shadow-soft"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="font-display text-lg font-extrabold text-foreground">{t.tajuk}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.arahan}</div>
            </button>
          ))}
        </div>

        {/* Kotak latihan */}
        <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
          <h2 className="font-display text-2xl font-extrabold text-foreground">{tugasan.tajuk}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tugasan.arahan}</p>
          <p className="mt-1 text-xs italic text-muted-foreground">{tugasan.contoh}</p>

          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            disabled={hantar}
            placeholder="Tulis jawapan kamu di sini..."
            className="mt-4 h-56 w-full resize-none rounded-2xl border-2 border-input bg-background p-4 font-sans text-base text-foreground outline-none transition focus:border-primary disabled:opacity-70"
          />

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-bold text-muted-foreground">
              {wordCount} perkataan
            </span>
            <span className="font-display text-xs font-extrabold text-primary">
              Sasaran: 50 perkataan untuk 3 ⭐
            </span>
          </div>

          {!hantar ? (
            <button
              onClick={() => setHantar(true)}
              disabled={wordCount < 5}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Send className="h-5 w-5" />
              Hantar Latihan
            </button>
          ) : (
            <div className="mt-6 rounded-2xl bg-gradient-hero p-6 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-gold" />
              <h3 className="mt-2 font-display text-2xl font-extrabold text-foreground">
                Syabas! Latihan dihantar 🎉
              </h3>
              <div className="mt-3 flex justify-center">
                <StarReward earned={bintang} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Kamu menulis sebanyak <span className="font-extrabold text-primary">{wordCount}</span> perkataan.
              </p>
              <button
                onClick={() => {
                  setHantar(false);
                  setTeks("");
                }}
                className="mt-4 rounded-full bg-card px-5 py-2 font-display font-extrabold text-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Tulis Lagi
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
