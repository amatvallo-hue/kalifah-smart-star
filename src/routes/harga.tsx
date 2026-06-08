import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Star } from "lucide-react";
import { HARGA_ASAL, PAKEJ_LIST } from "@/lib/curriculum";

export const Route = createFileRoute("/harga")({
  head: () => ({
    meta: [
      { title: "Harga Pakej — Kalifah.my" },
      { name: "description", content: "Pakej langganan Kalifah.my untuk Darjah 1–6. Bermula dari RM29/tahun." },
    ],
  }),
  ssr: true,
  component: HargaPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

function HargaPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: HIJAU }}>
              <span className="font-display text-xl font-extrabold">ك</span>
            </div>
            <span className="font-display text-2xl font-extrabold text-foreground">
              Kalifah<span style={{ color: HIJAU }}>.my</span>
            </span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft"
            style={{ color: HIJAU }}
          >
            <Star className="h-3.5 w-3.5" /> Harga 1 Tahun Penuh
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-foreground md:text-5xl">
            Pilih Pakej Anda
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Harga asal: <span className="line-through">RM{HARGA_ASAL}/darjah</span> — kini jauh lebih murah!
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PAKEJ_LIST.map((p) => {
            const popular = !!p.popular;
            return (
              <div
                key={p.id}
                className={`relative rounded-[2rem] bg-card p-7 shadow-card ${popular ? "md:scale-105" : ""}`}
                style={{ border: popular ? `3px solid ${EMAS}` : `2px solid ${HIJAU}22` }}
              >
                {popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-display text-[10px] font-extrabold uppercase tracking-wider text-white shadow-soft"
                    style={{ backgroundColor: EMAS }}
                  >
                    ⭐ Paling Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-extrabold text-foreground">{p.nama}</h3>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground line-through">
                    RM{p.id === "bundle" ? HARGA_ASAL * 6 : HARGA_ASAL}{p.id === "perDarjah" ? "/darjah" : ""}
                  </p>
                  <p className="mt-1 font-display text-5xl font-extrabold" style={{ color: popular ? "#7a5300" : HIJAU }}>
                    RM{p.jumlahBayar}
                    <span className="text-base font-bold text-muted-foreground">
                      {p.id === "perDarjah" ? "/darjah" : ""}/tahun
                    </span>
                  </p>
                  {p.jimat && (
                    <p className="mt-1 text-sm font-extrabold" style={{ color: EMAS }}>
                      Jimat RM{p.jimat}!
                    </p>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.deskripsi}</p>
                <ul className="mt-5 space-y-2 text-sm text-foreground">
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Akses penuh nota, latih tubi, kuiz, game</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Dashboard ibu bapa</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Sijil automatik PDF</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Streak & lencana</li>
                  {p.id === "bundle" && <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Untuk semua anak (D1–D6)</li>}
                </ul>
                <Link
                  to="/daftar"
                  className="mt-6 block w-full rounded-full px-5 py-3 text-center font-display text-sm font-extrabold text-white shadow-soft"
                  style={{ backgroundColor: popular ? EMAS : HIJAU }}
                >
                  Mula Langganan
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl bg-muted/40 p-6 text-center">
          <p className="font-display text-sm font-extrabold text-foreground">
            Pembayaran selamat akan datang melalui Stripe (kad kredit/debit) & FPX.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Untuk pertanyaan langganan, hubungi support@kalifah.my
          </p>
        </div>
      </main>
    </div>
  );
}
