import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/latihan-berpandu-preview")({
  head: () => ({
    meta: [{ title: "PROTOTAIP — Latihan Berpandu — Kalifah.my" }],
  }),
  ssr: false,
  component: LatihanBerpanduPreviewPage,
});

const OPERASI = [
  { id: "tambah", label: "Tambah (+)" },
  { id: "tolak", label: "Tolak (−)" },
  { id: "darab", label: "Darab (×)" },
  { id: "bahagi", label: "Bahagi (÷)" },
] as const;

const HEADERS = ["PTRi", "Ri", "Ra", "Pu", "Sa"];
const BARIS_ATAS = [8, 3, 2, 1, 4];
const BARIS_BAWAH = [4, 5, 6, 7, 8];
const JAWAPAN = [3, 7, 5, 3, 6];

const HINTS: Record<number, [string, string]> = {
  1: [
    "Kita tahu jumlah dan satu nombor. Bagaimana nak cari nombor satu lagi?",
    "Nombor kedua = Jumlah − Nombor pertama. Gunakan operasi tolak.",
  ],
  2: [
    "Fikirkan: kalau tambah dua nombor jadi jumlah, apa operasi yang songsang?",
    "Songsang bagi tambah ialah tolak. Pilih tolak (−).",
  ],
  3: [
    "Mula dari sebelah kanan (Sa) — tolak satu lajur pada satu masa.",
    "Kalau digit atas lebih kecil, pinjam 1 dari lajur sebelah kiri.",
  ],
  4: [
    "Semak dengan tambah semula: jawapan + nombor pertama = jumlah asal.",
    "Kalau 45 678 + jawapan anda = 83 214, jawapan anda betul!",
  ],
};

function LatihanBerpanduPreviewPage() {
  const { darjahId, subjekId } = useParams({
    from: "/darjah/$darjahId_/$subjekId_/latihan-berpandu-preview",
  });
  const [langkah, setLangkah] = useState(1);
  const [operasiDipilih, setOperasiDipilih] = useState<string | null>(null);
  const [selReveal, setSelReveal] = useState<boolean[]>([false, false, false, false, false]);
  const [hintTahap, setHintTahap] = useState(0);

  function pergiKeLangkah(n: number) {
    setLangkah(n);
    setHintTahap(0);
  }

  function pilihOperasi(id: string) {
    setOperasiDipilih(id);
  }

  function revealSel(i: number) {
    setSelReveal((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  }

  function tunjukHint() {
    setHintTahap((h) => (h >= 2 ? 2 : h + 1));
  }

  const bolehSeterusnya =
    (langkah === 1) ||
    (langkah === 2 && operasiDipilih === "tolak") ||
    (langkah === 3 && selReveal.every(Boolean));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <span>⚠️</span>
          PROTOTAIP — Latihan Berpandu (belum ciri sebenar)
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-extrabold shadow-soft transition ${
                  n === langkah
                    ? "bg-primary text-primary-foreground scale-110"
                    : n < langkah
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {n < langkah ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
              </div>
              {n < 4 && (
                <div
                  className={`h-1 w-8 rounded-full ${n < langkah ? "bg-green-500" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Soalan */}
        <section className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Soalan</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            Dua nombor lima digit apabila dijumlahkan menghasilkan 83&nbsp;214. Nombor pertama ialah 45&nbsp;678. Apakah nombor kedua?
          </p>
        </section>

        {/* Langkah */}
        <section className="mt-6 rounded-3xl border-2 border-primary/30 bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold text-foreground">
              Langkah {langkah}: {["Kenal pasti maklumat", "Pilih operasi", "Buat pengiraan", "Jawapan penuh"][langkah - 1]}
            </h2>
            {langkah < 4 && (
              <button
                onClick={tunjukHint}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200"
              >
                <Lightbulb className="h-4 w-4" />
                Petunjuk
              </button>
            )}
          </div>

          {langkah === 1 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/40 px-4 py-3 font-semibold">
                Jumlah kedua-dua nombor: <span className="font-extrabold">83 214</span>
              </div>
              <div className="rounded-2xl bg-muted/40 px-4 py-3 font-semibold">
                Nombor pertama: <span className="font-extrabold">45 678</span>
              </div>
              <div className="rounded-2xl bg-green-100 border-2 border-green-500 px-4 py-3 font-semibold text-green-900">
                Nombor kedua: <span className="font-extrabold">?</span>
              </div>
            </div>
          )}

          {langkah === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {OPERASI.map((op) => {
                  const dipilih = operasiDipilih === op.id;
                  const betul = op.id === "tolak";
                  const warna = !dipilih
                    ? "bg-card border-border hover:border-primary"
                    : betul
                      ? "bg-green-100 border-green-500 text-green-900"
                      : "bg-red-100 border-red-500 text-red-900";
                  return (
                    <button
                      key={op.id}
                      onClick={() => pilihOperasi(op.id)}
                      className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-6 font-display text-lg font-extrabold shadow-soft transition ${warna}`}
                    >
                      {dipilih && (betul ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />)}
                      {op.label}
                    </button>
                  );
                })}
              </div>
              {operasiDipilih && (
                <p
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    operasiDipilih === "tolak"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {operasiDipilih === "tolak"
                    ? "Betul — tolak digunakan untuk cari nombor yang hilang."
                    : "Cuba lagi — fikirkan hubungan antara tambah dan tolak."}
                </p>
              )}
            </>
          )}

          {langkah === 3 && (
            <div>
              <p className="mb-3 text-center font-display text-lg font-extrabold">
                83 214 − 45 678 = ?
              </p>
              <div className="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-border">
                <div className="grid grid-cols-5 bg-muted/60">
                  {HEADERS.map((h) => (
                    <div key={h} className="border-r border-border/60 py-2 text-center text-xs font-bold last:border-r-0">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 bg-card">
                  {BARIS_ATAS.map((n, i) => (
                    <div key={i} className="border-r border-border/60 py-3 text-center font-display text-xl font-extrabold last:border-r-0">
                      {n}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 border-b-4 border-foreground bg-card">
                  {BARIS_BAWAH.map((n, i) => (
                    <div key={i} className="border-r border-border/60 py-3 text-center font-display text-xl font-extrabold last:border-r-0">
                      −{n}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5">
                  {JAWAPAN.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => revealSel(i)}
                      className={`border-r border-border/60 py-3 text-center font-display text-xl font-extrabold transition last:border-r-0 ${
                        selReveal[i]
                          ? "bg-green-100 text-green-900"
                          : "bg-muted/30 text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      {selReveal[i] ? n : "?"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Ketik setiap sel untuk lihat jawapan lajur itu.
              </p>
            </div>
          )}

          {langkah === 4 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-green-100 border-2 border-green-500 p-6 text-center">
                <p className="text-sm font-bold text-green-800">Jawapan</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-green-900">
                  Nombor kedua ialah 37 536
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted/40 px-4 py-3 text-sm font-semibold">
                <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
                Semak: 45 678 + 37 536 = 83 214
              </div>
            </div>
          )}

          {hintTahap > 0 && langkah < 4 && (
            <div className="mt-4 space-y-2">
              {HINTS[langkah].slice(0, hintTahap).map((h, i) => (
                <div key={i} className="flex gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{h}</span>
                </div>
              ))}
              {hintTahap < 2 && (
                <button
                  onClick={tunjukHint}
                  className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
                >
                  Tunjuk petunjuk seterusnya
                </button>
              )}
            </div>
          )}
        </section>

        {/* Nav */}
        <div className="mt-6 flex justify-end">
          {langkah < 4 ? (
            <button
              onClick={() => pergiKeLangkah(langkah + 1)}
              disabled={!bolehSeterusnya}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-40"
            >
              Seterusnya
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setLangkah(1);
                setOperasiDipilih(null);
                setSelReveal([false, false, false, false, false]);
                setHintTahap(0);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft hover:opacity-90"
            >
              Cuba semula
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
