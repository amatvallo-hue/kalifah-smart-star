import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Wallet,
  Share2,
  UserPlus,
  ShieldCheck,
  Clock,
  BarChart3,
  Gift,
  Users,
  CheckCircle2,
  BookOpen,
  Gamepad2,
  FileQuestion,
  NotebookPen,
  GraduationCap,
  Monitor,
  ChevronDown,
  Quote,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

const SLOT_PERCUMA = 20;

export const Route = createFileRoute("/cikgu-affiliate")({
  head: () => ({
    meta: [
      { title: "Jadi Affiliate Kalifah.my — Dapat Komisyen 30% Setiap Jualan" },
      {
        name: "description",
        content:
          "Kongsi Kalifah.my dengan parent & cikgu lain, dapat komisyen 30% setiap jualan. Percuma untuk 20 orang pertama. Daftar sekarang!",
      },
      { property: "og:title", content: "Jadi Affiliate Kalifah.my — Komisyen 30%" },
      {
        property: "og:description",
        content:
          "Program affiliate Kalifah.my. Percuma sertai untuk 20 orang pertama, komisyen 30% setiap jualan, bayaran bulanan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: CikguAffiliateLanding,
});

function CikguAffiliateLanding() {
  const [count, setCount] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("affiliates")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setCount(count ?? 0));
  }, []);

  const baki = count === null ? null : Math.max(0, SLOT_PERCUMA - count);
  const penuh = baki !== null && baki <= 0;

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
              <Sparkles className="h-4 w-4" />
              Program Affiliate Kalifah.my
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl md:text-6xl">
              Buat Pendapatan Sampingan Dengan Kongsi Kalifah.my
            </h1>
            <p className="mt-4 text-xl font-extrabold text-primary sm:text-2xl">
              Dapat Komisyen Sehingga RM2,985 Sebulan
            </p>
            <p className="mt-2 text-base text-muted-foreground sm:text-lg">
              Tiada modal • Tiada stok • Tiada urus pelanggan
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                to="/affiliate/daftar"
                className="rounded-full bg-gradient-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Daftar Sekarang
              </Link>
              <p className="text-sm text-muted-foreground">
                Percuma • Ambil masa 2 minit sahaja
              </p>
            </div>

            {/* Urgency banner */}
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <Gift className="h-5 w-5" />
              {count === null ? (
                <span>Sedang muat maklumat slot...</span>
              ) : penuh ? (
                <span>
                  Promosi Percuma Tamat — Kuota 20 Orang Dipenuhi. Masih boleh
                  sertai dengan pembelian minimum 1 darjah.
                </span>
              ) : (
                <span>
                  Baki {baki}/20 Slot Affiliate Percuma Masih Dibuka
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SIAPA SESUAI SERTAI */}
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Program Ini Sesuai Untuk
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <AudienceCard emoji="👩‍🏫" label="Guru Sekolah" />
          <AudienceCard emoji="👨‍👩‍👧‍👦" label="Ibu Bapa" />
          <AudienceCard emoji="📱" label="Content Creator Pendidikan" />
          <AudienceCard emoji="🕌" label="Guru KAFA" />
          <AudienceCard emoji="🎓" label="Tutor & Pusat Tuisyen" />
        </div>
      </section>

      {/* APA YANG ANDA AKAN PROMOTE */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Apa Yang Anda Akan Promote?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Kongsi platform pembelajaran yang ibu bapa Malaysia memang perlukan.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PromoCard
              icon={BookOpen}
              title="32,000+ Soalan KSSR"
              body="Bank soalan lengkap mengikut sukatan Darjah 1–6."
            />
            <PromoCard
              icon={Gamepad2}
              title="Game Pembelajaran"
              body="Anak belajar sambil bermain — matematik, sains & bahasa."
            />
            <PromoCard
              icon={FileQuestion}
              title="Latih Tubi Interaktif"
              body="Latihan auto-marked dengan penjelasan jawapan."
            />
            <PromoCard
              icon={NotebookPen}
              title="Nota Ringkas"
              body="Nota visual & ringkas untuk setiap topik utama."
            />
            <PromoCard
              icon={GraduationCap}
              title="Darjah 1–6"
              body="Satu platform untuk semua peringkat sekolah rendah."
            />
            <PromoCard
              icon={Monitor}
              title="Akses Online 24 Jam"
              body="Belajar bila-bila masa, di mana-mana peranti."
            />
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Kenapa Sertai?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pendapatan sampingan yang mudah, tanpa perlu cipta produk sendiri.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Earnings */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Wallet className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h3 className="mt-4 font-display text-2xl font-extrabold">
              Komisyen 30% Setiap Jualan
            </h3>
            <p className="mt-2 text-muted-foreground">
              Anda dapat 30% daripada harga yang customer bayar. Tiada had
              maksimum — makin banyak share, makin banyak dapat.
            </p>

            <div className="mt-5 rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                Contoh Pakej Bundle (RM199)
              </p>
              <ul className="mt-3 space-y-3 text-foreground">
                <li className="flex items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-sm">
                  <span className="text-sm">💰 10 jualan Bundle</span>
                  <span className="font-display text-lg font-extrabold text-primary">
                    = RM597
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-sm">
                  <span className="text-sm">💰 20 jualan Bundle</span>
                  <span className="font-display text-lg font-extrabold text-primary">
                    = RM1,194
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-sm">
                  <span className="text-sm">💰 50 jualan Bundle</span>
                  <span className="font-display text-lg font-extrabold text-primary">
                    = RM2,985
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                1 jualan pakej 1 darjah (RM49) = RM14.70 komisyen. Tiada had —
                makin ramai parent yang beli melalui link anda, makin besar
                komisyen bulanan.
              </p>
            </div>
          </div>

          {/* Ease */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold/80 text-gold-foreground shadow-soft">
              <Share2 className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h3 className="mt-4 font-display text-2xl font-extrabold">
              Mudah &amp; Percuma
            </h3>
            <ul className="mt-4 space-y-3 text-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>
                  <strong>Percuma sertai</strong> untuk 20 orang pertama.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>Tidak perlu cipta produk atau jual sesuatu sendiri.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>Tiada stok, tiada penghantaran, tiada layanan customer.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>
                  Hanya kongsi <strong>link rujukan unik</strong> anda.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>
                  Dashboard automatik untuk pantau klik, jualan &amp; komisyen.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Macam Mana Ia Berfungsi
            </h2>
            <p className="mt-3 text-muted-foreground">
              3 langkah mudah untuk mula dapat komisyen.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              icon={UserPlus}
              tone="from-primary to-primary-glow text-primary-foreground"
              title="Daftar Percuma"
              body="Isi borang ringkas & dapat kod rujukan unik anda dengan segera."
            />
            <Step
              n={2}
              icon={Share2}
              tone="from-sky-400 to-sky-300 text-sky-900"
              title="Kongsi Link Anda"
              body="Share ke WhatsApp, Facebook, Instagram, TikTok — mana-mana platform yang anda selesa."
            />
            <Step
              n={3}
              icon={Wallet}
              tone="from-gold to-gold/80 text-gold-foreground"
              title="Dapat Komisyen"
              body="30% komisyen automatik setiap kali ada yang beli melalui link anda. Bayaran 1–7hb setiap bulan."
            />
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <div className="relative rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
            <Quote className="absolute left-6 top-6 h-8 w-8 text-primary/20" />
            <blockquote className="relative pt-6 text-center text-lg font-medium text-foreground sm:text-xl">
              “Saya hanya kongsi dalam WhatsApp group sekolah anak. Dapat
              komisyen pertama dalam minggu pertama.”
            </blockquote>
            <p className="mt-5 text-center text-sm font-bold text-muted-foreground">
              — Affiliate Kalifah.my
            </p>
          </div>
        </div>
      </section>

      {/* DIPERCAYAI IBU BAPA MALAYSIA */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Dipercayai Ibu Bapa Malaysia
            </h2>
          </div>
          <div className="mx-auto mt-8 max-w-2xl">
            <ul className="space-y-3">
              <CheckItem text="32,000+ Soalan Latihan" />
              <CheckItem text="Darjah 1–6" />
              <CheckItem text="Nota Ringkas" />
              <CheckItem text="Kuiz Interaktif" />
              <CheckItem text="Game Pembelajaran" />
              <CheckItem text="Latihan Bertulis" />
            </ul>
          </div>
        </div>
      </section>

      {/* TRUST / LOGISTICS */}
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Telus &amp; Boleh Dipercayai
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={Wallet}
            title="Bayaran Minimum RM50"
            body="Komisyen dibayar terus ke akaun bank anda setiap bulan (1–7hb) apabila mencecah RM50."
          />
          <InfoCard
            icon={Clock}
            title="Attribution 30 Hari"
            body="Guna last-click attribution 30 hari — bermakna anda tetap dapat komisyen walaupun customer beli beberapa hari selepas klik link anda."
          />
          <InfoCard
            icon={BarChart3}
            title="Dashboard Sendiri"
            body="Pantau klik, jualan & komisyen anda secara real-time melalui dashboard affiliate peribadi."
          />
          <InfoCard
            icon={ShieldCheck}
            title="Produk Berkualiti"
            body="Kalifah.my adalah platform pembelajaran KSSR untuk Darjah 1–6, dipercayai ramai ibu bapa Malaysia."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Soalan Lazim
            </h2>
          </div>
          <div className="mt-10 space-y-4">
            <FaqItem
              q="Perlu bayar untuk sertai?"
              a="Tidak. Percuma untuk 20 orang pertama."
              open={openFaq === 0}
              onToggle={() => toggleFaq(0)}
            />
            <FaqItem
              q="Bila komisyen dibayar?"
              a="1–7 haribulan setiap bulan."
              open={openFaq === 1}
              onToggle={() => toggleFaq(1)}
            />
            <FaqItem
              q="Perlu simpan stok?"
              a="Tidak."
              open={openFaq === 2}
              onToggle={() => toggleFaq(2)}
            />
            <FaqItem
              q="Ada minimum payout?"
              a="Ya, RM50."
              open={openFaq === 3}
              onToggle={() => toggleFaq(3)}
            />
            <FaqItem
              q="Saya bukan cikgu, boleh sertai?"
              a="Boleh — program ini terbuka untuk sesiapa sahaja."
              open={openFaq === 4}
              onToggle={() => toggleFaq(4)}
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-b from-background to-primary/10 py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            <Users className="h-4 w-4" />
            Sertai komuniti affiliate Kalifah.my
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl md:text-5xl">
            Mula Jana Komisyen Hari Ini
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Daftar dalam masa 2 minit dan terus dapat link affiliate anda.
            {baki !== null && !penuh && (
              <>
                {" "}
                <strong className="text-amber-700 dark:text-amber-300">
                  Baki {baki} tempat percuma sahaja.
                </strong>
              </>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-success">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Percuma
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Tiada Risiko
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Tiada Modal
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/affiliate/daftar"
              className="rounded-full bg-gradient-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
            >
              Daftar Sekarang
            </Link>
            <Link
              to="/affiliate/syarat"
              className="text-sm font-bold text-primary hover:underline"
            >
              Baca Terma &amp; Syarat
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- helpers ---------- */

function AudienceCard({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-0.5">
      <span className="text-4xl">{emoji}</span>
      <span className="mt-3 text-sm font-bold leading-snug text-foreground">
        {label}
      </span>
    </div>
  );
}

function PromoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-display text-base font-extrabold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
      <span className="text-sm font-semibold text-foreground">{text}</span>
    </li>
  );
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display font-extrabold text-foreground"
      >
        {q}
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground">{a}</div>
      )}
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
  tone,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <div className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-display text-sm font-extrabold text-background">
        {n}
      </div>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} shadow-soft`}
      >
        <Icon className="h-7 w-7" strokeWidth={2.5} />
      </div>
      <h3 className="mt-4 font-display text-xl font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <h3 className="mt-3 font-display text-base font-extrabold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
