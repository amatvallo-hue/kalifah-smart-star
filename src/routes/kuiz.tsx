import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";

export const Route = createFileRoute("/kuiz")({
  head: () => ({
    meta: [
      { title: "Kuiz Interaktif — Kalifah.my" },
      { name: "description", content: "Jawab kuiz pilihan jawapan dan kumpul bintang." },
    ],
  }),
  component: KuizPage,
});

type Q = { soalan: string; pilihan: string[]; jawapan: number; nota?: string };

const SOALAN: Q[] = [
  {
    soalan: "Berapakah rukun Iman?",
    pilihan: ["3", "5", "6", "7"],
    jawapan: 2,
    nota: "Rukun Iman ada 6 perkara.",
  },
  {
    soalan: "Apakah doa sebelum makan?",
    pilihan: [
      "Alhamdulillah",
      "Bismillahirrahmanirrahim",
      "Astaghfirullah",
      "Subhanallah",
    ],
    jawapan: 1,
  },
  {
    soalan: "12 + 8 = ?",
    pilihan: ["18", "20", "22", "24"],
    jawapan: 1,
  },
  {
    soalan: "Negeri manakah dikenali sebagai 'Negeri di Bawah Bayu'?",
    pilihan: ["Sabah", "Sarawak", "Kelantan", "Pahang"],
    jawapan: 0,
  },
  {
    soalan: "Berapa hari dalam seminggu?",
    pilihan: ["5", "6", "7", "8"],
    jawapan: 2,
  },
];

function KuizPage() {
  const [i, setI] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [skor, setSkor] = useState(0);
  const [selesai, setSelesai] = useState(false);

  const soalan = SOALAN[i];
  const betul = pilih !== null && pilih === soalan.jawapan;

  const seterusnya = () => {
    if (i + 1 >= SOALAN.length) {
      setSelesai(true);
    } else {
      setI(i + 1);
      setPilih(null);
    }
  };

  const handlePilih = (idx: number) => {
    if (pilih !== null) return;
    setPilih(idx);
    if (idx === soalan.jawapan) setSkor((s) => s + 1);
  };

  const reset = () => {
    setI(0);
    setPilih(null);
    setSkor(0);
    setSelesai(false);
  };

  const bintang = skor >= 5 ? 3 : skor >= 3 ? 2 : skor >= 1 ? 1 : 0;

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

        {!selesai ? (
          <>
            {/* Progress */}
            <div className="mt-5 flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-muted-foreground">
                Soalan {i + 1} / {SOALAN.length}
              </span>
              <span className="rounded-full bg-gradient-gold px-3 py-1 font-display text-xs font-extrabold text-gold-foreground">
                Skor: {skor}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${((i + (pilih !== null ? 1 : 0)) / SOALAN.length) * 100}%` }}
              />
            </div>

            {/* Soalan */}
            <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
              <h1 className="font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl">
                {soalan.soalan}
              </h1>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {soalan.pilihan.map((p, idx) => {
                  const isPilih = pilih === idx;
                  const showBetul = pilih !== null && idx === soalan.jawapan;
                  const showSalah = isPilih && idx !== soalan.jawapan;
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePilih(idx)}
                      disabled={pilih !== null}
                      className={`group flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left font-bold transition ${
                        showBetul
                          ? "border-success bg-success/10 text-success"
                          : showSalah
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : pilih !== null
                              ? "border-border bg-secondary/50 text-muted-foreground"
                              : "border-border bg-background hover:-translate-y-0.5 hover:border-primary hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold ${
                          showBetul
                            ? "bg-success text-success-foreground"
                            : showSalah
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}
                      >
                        {showBetul ? <Check className="h-5 w-5" /> : showSalah ? <X className="h-5 w-5" /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>

              {pilih !== null && (
                <div
                  className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${
                    betul ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm font-bold">
                    {betul ? "Syabas! Jawapan kamu betul! 🎉" : "Hampir betul! Cuba lagi pada soalan seterusnya."}
                    {soalan.nota && <div className="mt-1 font-medium opacity-90">{soalan.nota}</div>}
                  </div>
                </div>
              )}

              <button
                onClick={seterusnya}
                disabled={pilih === null}
                className="mt-6 w-full rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {i + 1 >= SOALAN.length ? "Selesai" : "Soalan Seterusnya →"}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <Sparkles className="h-10 w-10 text-gold-foreground" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-4xl">
              Tahniah! 🎉
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Kamu jawab betul <span className="font-extrabold text-primary">{skor}</span> daripada{" "}
              <span className="font-extrabold text-primary">{SOALAN.length}</span> soalan
            </p>
            <div className="mt-5 flex justify-center">
              <StarReward earned={bintang} />
            </div>
            <p className="mt-4 font-display font-extrabold text-foreground">
              {bintang === 3
                ? "Cemerlang! Kamu hebat!"
                : bintang === 2
                  ? "Bagus sekali!"
                  : bintang === 1
                    ? "Terus berusaha!"
                    : "Jangan putus asa, cuba lagi!"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Cuba Lagi
              </button>
              <Link
                to="/"
                className="rounded-full bg-card px-6 py-3 font-display font-extrabold text-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Kembali Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
