import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/affiliate/syarat")({
  head: () => ({
    meta: [
      { title: "Terma & Syarat Program Affiliate — Kalifah.my" },
      {
        name: "description",
        content:
          "Terma dan syarat penyertaan dalam Program Affiliate Kalifah.my.",
      },
    ],
  }),
  ssr: false,
  component: SyaratPage,
});

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Kelayakan",
    body: (
      <p>
        Program ini terbuka kepada semua individu yang mendaftar melalui borang
        rasmi di{" "}
        <span className="font-mono text-primary">
          kalifah.my/affiliate/daftar
        </span>
        .
      </p>
    ),
  },
  {
    title: "2. Komisyen",
    body: (
      <p>
        Affiliate layak menerima komisyen sebanyak <strong>30%</strong>{" "}
        daripada harga jualan sebenar yang dibayar oleh pelanggan. Komisyen
        tidak terpakai untuk transaksi yang dibatalkan atau dikembalikan
        (refund).
      </p>
    ),
  },
  {
    title: "3. Pembayaran",
    body: (
      <p>
        Komisyen akan dibayar pada minggu pertama setiap bulan (1–7hb) melalui
        pindahan bank ke akaun yang didaftarkan. Jumlah minimum untuk
        pengeluaran ialah <strong>RM50</strong>. Baki di bawah RM50 akan
        dikumpulkan ke bulan berikutnya. Kalifah.my berhak atas budi bicara
        dalam hal pembayaran luar biasa.
      </p>
    ),
  },
  {
    title: "4. Larangan",
    body: (
      <div className="space-y-2">
        <p>Affiliate dilarang daripada:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Menghantar mesej spam atau promosi tanpa kebenaran penerima;
          </li>
          <li>
            Membuat tuntutan palsu atau mengelirukan tentang produk Kalifah.my;
          </li>
          <li>Mendaftar menggunakan pautan sendiri (self-referral);</li>
          <li>
            Menjalankan iklan berbayar atas nama Kalifah.my tanpa kebenaran
            bertulis;
          </li>
          <li>Memanipulasi klik melalui sebarang cara tidak jujur;</li>
          <li>
            Menjanjikan diskaun tambahan yang tidak diluluskan oleh Kalifah.my.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "5. Penamatan Akaun",
    body: (
      <p>
        Kalifah.my berhak menamatkan akaun affiliate yang didapati melanggar
        mana-mana terma di atas. Komisyen yang belum dibayar mungkin akan
        terbatal bergantung kepada keseriusan pelanggaran.
      </p>
    ),
  },
];

function SyaratPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link
          to="/affiliate/daftar"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pendaftaran
        </Link>

        <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
          Terma &amp; Syarat Program Affiliate Kalifah.my
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sila baca dengan teliti sebelum mendaftar sebagai affiliate.
        </p>

        <div className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-lg font-extrabold text-foreground">
                {s.title}
              </h2>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/affiliate/daftar"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
          >
            Kembali ke Pendaftaran
          </Link>
        </div>
      </div>
    </div>
  );
}
