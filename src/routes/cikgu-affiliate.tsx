import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Wallet,
  Share2,
  UserPlus,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  BarChart3,
  Gift,
  Users,
  CheckCircle2,
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

  useEffect(() => {
    supabase
      .from("affiliates")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setCount(count ?? 0));
  }, []);

  const baki = count === null ? null : Math.max(0, SLOT_PERCUMA - count);
  const penuh = baki !== null && baki <= 0;

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
              Kongsi Kalifah.my,{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Dapat Komisyen 30%
              </span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              Cikgu &amp; ibu bapa — dapat pendapatan sampingan dengan
              berkongsi platform pembelajaran yang anda memang percaya. Percuma
              untuk disertai, tiada modal, tiada stok.
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
                  Slot percuma penuh — masih boleh sertai dengan pembelian
                  minimum 1 darjah.
                </span>
              ) : (
                <span>
                  Baki <span className="text-amber-700 dark:text-amber-100">{baki}</span> tempat
                  percuma sahaja!
                </span>
              )}
            </div>
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

            <div className="mt-5 rounded-2xl bg-primary/5 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                Contoh Pengiraan
              </p>
              <ul className="mt-2 space-y-2 text-sm text-foreground">
                <li className="flex justify-between gap-2">
                  <span>1 jualan pakej 1 darjah (RM49)</span>
                  <span className="font-bold text-primary">= RM14.70</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>10 jualan sebulan</span>
                  <span className="font-bold text-primary">= RM147</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>10 jualan pakej bundle (RM199)</span>
                  <span className="font-bold text-primary">= RM597</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Tiada had — makin ramai parent yang beli melalui link anda,
                makin besar komisyen bulanan.
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

      {/* FINAL CTA */}
      <section className="bg-gradient-to-b from-background to-primary/10 py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            <Users className="h-4 w-4" />
            Sertai komuniti affiliate Kalifah.my
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl md:text-5xl">
            Bersedia untuk mula?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Daftar percuma dalam 2 minit dan mula kongsi link anda hari ini.
            {baki !== null && !penuh && (
              <>
                {" "}
                <strong className="text-amber-700 dark:text-amber-300">
                  Baki {baki} tempat percuma sahaja.
                </strong>
              </>
            )}
          </p>

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

// unused import shim to keep ClipboardCheck available if referenced later
void ClipboardCheck;
