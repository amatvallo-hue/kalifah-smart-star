import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Zap,
  Send,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { HARGA_ASAL, PAKEJ_LIST } from "@/lib/curriculum";
import { KalifahLogo } from "@/components/KalifahLogo";
import heroStudyRoom from "@/assets/hero-study-room.jpg";
import ciriNotaAsset from "@/assets/product-proof/real-nota.jpg.asset.json";
import ciriGameAsset from "@/assets/product-proof/real-soalan.jpg.asset.json";
import ciriGanjaranAsset from "@/assets/product-proof/real-hadiah.jpg.asset.json";
import parentEvidenceAsset from "@/assets/product-proof/real-parent-private.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalifah.my — Tahu Ke Anak Awak Lemah Bab Mana, Atau Just Teka?" },
      {
        name: "description",
        content:
          "Ujian sekolah je baru terbongkar anak dah tersangkut bab mana. KALI kesan kelemahan spesifik anak anda dari sekarang — percuma, 10 soalan, 2 minit.",
      },
      { property: "og:title", content: "Kalifah.my — Tahu Ke Anak Awak Lemah Bab Mana, Atau Just Teka?" },
      { property: "og:description", content: "Ujian sekolah je baru terbongkar anak dah tersangkut bab mana. KALI kesan kelemahan spesifik anak anda dari sekarang — percuma, 10 soalan, 2 minit." },
    ],
  }),
  ssr: true,
  component: LandingPage,
});


const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const KALI_BLUE = "#3654C9";

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <PainAmplifier />
      <Twist />
      <Mekanisme />
      <Ciri />
      <ParentEvidence />
      <LiputanKurikulum />
      <Harga />
      <Faq />
      <Footer />
    </div>
  );
}


function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <KalifahLogo className="h-8 md:h-9" />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#ciri" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">Ciri-Ciri</a>
          <a href="#subjek" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">Subjek</a>
          <a href="#harga" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">Harga</a>
          <a href="#faq" className="font-display text-sm font-bold text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-full px-3 py-2 font-display text-sm font-bold text-foreground hover:bg-secondary sm:px-4"
          >
            Log Masuk
          </Link>
          <div className="flex flex-col items-center">
            <Link
              to="/daftar"
              search={{ ref: undefined }}
              className="rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              Daftar
            </Link>
            <p className="hidden text-center text-sm text-muted-foreground sm:block">Daftar percuma — cuba dulu, bayar kalau suka</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroBuktiVisual() {
  const anak = [
    { nama: "Anak A", dikuasai: "Tambah", diperkukuhkan: "Bahagi" },
    { nama: "Anak B", dikuasai: "Bahagi", diperkukuhkan: "Pecahan" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl" aria-label="Perbandingan perjalanan pembelajaran Anak A dan Anak B">
      <style>{`
        @keyframes hero-path-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes hero-node-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-kali-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-kali) 32%, transparent); }
          55% { box-shadow: 0 0 0 10px color-mix(in oklab, var(--color-kali) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-kali) 0%, transparent); }
        }
        .hero-branch-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: hero-path-draw 900ms ease-out 180ms forwards;
        }
        .hero-journey-node {
          opacity: 0;
          animation: hero-node-in 550ms ease-out 820ms forwards;
        }
        .hero-journey-node:nth-child(2) { animation-delay: 940ms; }
        .hero-kali-marker { animation: hero-kali-pulse 900ms ease-out 660ms 1; }
        @media (prefers-reduced-motion: reduce) {
          .hero-branch-path { animation: none; stroke-dashoffset: 0; }
          .hero-journey-node { animation: none; opacity: 1; transform: none; }
          .hero-kali-marker { animation: none; }
        }
      `}</style>

      <div className="relative rounded-lg border border-background/70 bg-background/85 px-2.5 pb-2.5 pt-2.5 shadow-card backdrop-blur-sm sm:px-6 sm:pb-5 sm:pt-5 sm:bg-background/55">
        <div className="relative z-10 mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-full border border-primary/25 bg-background/95 shadow-card sm:h-24 sm:w-24">
          <span className="font-display text-lg font-extrabold leading-none text-primary sm:text-3xl">6/10</span>
          <span className="mt-1 text-[8px] font-bold text-muted-foreground sm:text-[10px]">Markah yang sama</span>
        </div>

        <div className="relative mx-auto h-12 max-w-2xl sm:h-24">
          <svg
            className="absolute inset-0 hidden h-full w-full overflow-visible sm:block"
            viewBox="0 0 720 96"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="hero-branch-path"
              pathLength="1"
              d="M360 0 V24 C360 54 180 38 180 96"
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity="0.48"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="hero-branch-path"
              pathLength="1"
              d="M360 24 C360 54 540 38 540 96"
              fill="none"
              stroke="var(--color-gold)"
              strokeOpacity="0.58"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            className="absolute inset-0 h-full w-full overflow-visible sm:hidden"
            viewBox="0 0 360 48"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="hero-branch-path"
              pathLength="1"
              d="M180 0 V12 C180 28 88 20 88 48"
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity="0.48"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="hero-branch-path"
              pathLength="1"
              d="M180 12 C180 28 272 20 272 48"
              fill="none"
              stroke="var(--color-gold)"
              strokeOpacity="0.58"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 text-center sm:top-5">
            <span
              className="hero-kali-marker mx-auto block h-2 w-2 rounded-full border-2 border-background sm:h-2.5 sm:w-2.5"
              style={{ backgroundColor: KALI_BLUE }}
            />
            <span className="mt-1 block whitespace-nowrap text-[9px] font-extrabold sm:text-xs" style={{ color: KALI_BLUE }}>
              KALI nampak perbezaannya.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-5">
          {anak.map((a) => (
            <div
              key={a.nama}
              className="hero-journey-node rounded-md border border-background/80 bg-background/90 p-2 text-left shadow-card backdrop-blur-md sm:p-4"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5 sm:pb-2">
                <p className="font-display text-sm font-extrabold text-foreground sm:text-base">{a.nama}</p>
                <span className="hidden text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:inline">Perjalanan</span>
              </div>
              <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/10 sm:h-2.5 sm:w-2.5" />
                  <div>
                    <p className="font-display text-sm font-extrabold leading-tight text-foreground">{a.dikuasai}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-primary sm:text-xs">Sudah dikuasai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-sm bg-gold/10 px-1.5 py-1.5 sm:px-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold ring-4 ring-gold/10 sm:h-2.5 sm:w-2.5" />
                  <div>
                    <p className="font-display text-sm font-extrabold leading-tight text-foreground">{a.diperkukuhkan}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-gold-foreground sm:text-xs">Perlu Diperkukuhkan</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-2 max-w-xl text-center text-sm font-bold text-foreground sm:mt-5 sm:text-base">
        Markah sama. Tapi apa yang mereka perlukan selepas ini tak sama.
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Contoh — bukan data sebenar.
      </p>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background">
      <img
        src={heroStudyRoom}
        alt="Dua murid sekolah rendah sedang berfikir di meja belajar"
        width={1920}
        height={1088}
        fetchPriority="high"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-center md:block"
      />
      <div className="pointer-events-none absolute inset-0 hidden bg-background/20 md:block" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, var(--color-background) 90%, transparent) 0%, color-mix(in oklab, var(--color-background) 52%, transparent) 32%, color-mix(in oklab, var(--color-background) 18%, transparent) 72%, color-mix(in oklab, var(--color-background) 82%, transparent) 100%), radial-gradient(ellipse 35% 76% at 50% 52%, color-mix(in oklab, var(--color-background) 88%, transparent), transparent 78%)`,
        }}
        aria-hidden="true"
      />
      <div className="container relative mx-auto px-4 pb-10 pt-8 sm:pt-14 md:min-h-[940px] md:pb-14 md:pt-14 lg:min-h-[980px] lg:pt-16">
        <div className="mx-auto text-center">
          <div className="mx-auto max-w-3xl rounded-lg bg-background/70 px-2 py-1 backdrop-blur-[2px] sm:px-5 sm:py-2 md:bg-background/55">
            <h1 className="font-display text-xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-5xl lg:text-6xl">
              Yang paling susah bukan bila anak salah. Yang susah bila kita tak tahu dia mula tak faham di mana.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-5 md:mt-6 md:text-lg">
              Markah cuma tunjuk berapa yang betul. Ia tak tunjuk bahagian mana yang anak sebenarnya belum faham.
            </p>
          </div>

          <div className="relative z-0 mx-[-1rem] mt-3 h-36 overflow-hidden md:hidden">
            <img
              src={heroStudyRoom}
              alt="Dua murid sekolah rendah sedang berfikir di meja belajar"
              width={1920}
              height={1088}
              className="h-full w-full object-cover object-[center_38%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/70" aria-hidden="true" />
          </div>

          <div className="relative z-10 -mt-8 sm:-mt-9 md:mx-auto md:mt-10 md:max-w-3xl lg:mt-12">
            <HeroBuktiVisual />
          </div>

          <p className="mx-auto mt-3 max-w-2xl rounded-md bg-background/75 px-3 py-2 text-sm font-semibold leading-relaxed text-foreground backdrop-blur-sm sm:mt-7 md:mt-8 md:text-lg">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: KALI_BLUE }} />
            KALI bantu cari bahagian yang perlu diberi perhatian — supaya anak tak sekadar buat lebih banyak latihan, tapi latihan yang lebih tepat.
          </p>

          <div className="mt-3 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center md:mt-7">
            <Link
              to="/cuba-kali-web"
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 sm:w-auto"
              style={{ backgroundColor: HIJAU }}
            >
              🧪 Cuba KALI Percuma
            </Link>
          </div>
          <div className="mx-auto mt-3 flex w-fit flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-full bg-background/75 px-4 py-2 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" style={{ color: HIJAU }} /> Selamat & sesuai untuk kanak-kanak
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" style={{ color: EMAS }} /> Dipercayai ibu bapa
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PainAmplifier() {
  return (
    <section className="overflow-hidden border-y border-border/60 bg-muted/20 py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <p className="mx-auto mb-10 max-w-2xl text-center text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground sm:mb-14">
          Kebanyakan ibu bapa menghadapi ini
        </p>
        <div className="relative mx-auto max-w-4xl space-y-10 md:space-y-14">
          <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-border md:block" />

          <SceneCard
            align="left"
            number={1}
            visual={<Scene1Visual />}
            title="Tuisyen Tiada Report"
            support="Bayar setiap bulan, tapi masih tak tahu anak sebenarnya perlu bantuan di bahagian mana."
          />
          <SceneCard
            align="right"
            number={2}
            visual={<Scene2Visual />}
            title="Banyak Latihan Tak Semestinya Tepat"
            support="Anak boleh buat banyak soalan, tetapi bahagian yang benar-benar perlu diperkukuhkan masih tenggelam."
          />
          <SceneCard
            align="left"
            number={3}
            visual={<Scene3Visual />}
            title="Baru Tahu Lepas Exam"
            support="Bila keputusan keluar, kadang-kadang masalah sebenar sudah bermula lebih awal."
          />
        </div>
      </div>
    </section>
  );
}

function SceneCard({
  align,
  number,
  visual,
  title,
  support,
}: {
  align: "left" | "right";
  number: number;
  visual: ReactNode;
  title: string;
  support: string;
}) {
  const isRight = align === "right";
  return (
    <div className={`relative flex items-center ${isRight ? "md:flex-row-reverse" : ""}`}>
      <div className="absolute left-1/2 top-1/2 z-10 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-xs font-extrabold text-muted-foreground md:flex">
        {number}
      </div>
      <div
        className={`w-full rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-6 md:max-w-sm lg:max-w-md ${
          isRight ? "md:ml-auto" : ""
        }`}
      >
        <div className="mb-4">{visual}</div>
        <h3 className="font-display text-lg font-extrabold text-foreground sm:text-xl">{title}</h3>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{support}</p>
      </div>
    </div>
  );
}

function Scene1Visual() {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5" aria-hidden="true">
      <div className="relative w-28 rounded-lg border border-dashed border-border bg-background p-3 shadow-card sm:w-32">
        <div className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rounded-full border border-border bg-muted/50" />
        <div className="mt-2 space-y-1.5">
          <div className="h-1 w-full rounded bg-muted/70" />
          <div className="h-1 w-5/6 rounded bg-muted/70" />
          <div className="h-1 w-4/6 rounded bg-muted/70" />
        </div>
        <div className="mt-3 border-t border-border pt-2 text-center">
          <span className="font-display text-lg font-extrabold text-foreground">RM 900</span>
        </div>
      </div>
      <div className="relative max-w-[10rem] rounded-2xl rounded-bl-none border border-border bg-card p-3 shadow-card sm:max-w-[12rem]">
        <p className="text-xs font-bold text-foreground sm:text-sm">“Dia okay, tengah improve.”</p>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Info tidak lengkap
        </div>
      </div>
    </div>
  );
}

function Scene2Visual() {
  const items = [
    ...Array.from({ length: 8 }, () => "green" as const),
    ...Array.from({ length: 2 }, () => "gold" as const),
    ...Array.from({ length: 2 }, () => "neutral" as const),
  ];
  return (
    <div className="mx-auto max-w-[16rem]" aria-hidden="true">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
          <div className="h-6 w-5 rounded-sm bg-primary/20" />
          <div className="h-2 w-20 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {items.map((type, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-md text-xs font-extrabold ${
                type === "green"
                  ? "bg-primary/15 text-primary"
                  : type === "gold"
                    ? "bg-gold/20 text-gold"
                    : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {type === "green" ? <Check className="h-3.5 w-3.5" /> : type === "gold" ? "!" : "?"}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
          <span className="inline-flex items-center gap-1 text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Dah kuat
          </span>
          <span className="inline-flex items-center gap-1 text-gold">
            <span className="h-2 w-2 rounded-full bg-gold" />
            Perlu fokus
          </span>
        </div>
      </div>
    </div>
  );
}

function Scene3Visual() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6" aria-hidden="true">
      <div className="rounded-xl border border-border bg-card px-6 py-4 text-center shadow-card">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Keputusan Ujian</p>
        <p className="font-display text-4xl font-extrabold text-foreground">60%</p>
      </div>
      <div className="flex flex-col items-center">
        <svg width="24" height="48" viewBox="0 0 24 48" fill="none" aria-hidden="true">
          <path d="M12 0 V36" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
          <path
            d="M6 30 L12 36 L18 30"
            stroke="var(--color-gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="mt-1 text-[10px] font-bold text-muted-foreground">lebih awal</span>
      </div>
      <div className="rounded-xl border border-gold/40 bg-gold/10 px-5 py-3 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gold">Masalah sebenar</p>
        <p className="font-display text-base font-extrabold text-gold-foreground">Pecahan Tak Wajar</p>
        <p className="text-[10px] font-bold text-muted-foreground">Darjah 3</p>
      </div>
    </div>
  );
}

function Twist() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1.6fr_1fr] md:items-center md:gap-12">
        <div>
          <h2 className="font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl lg:text-4xl">
            Bukan Anak Anda Tak Rajin. Bukan Ibu Bapa Tak Prihatin.
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Masalahnya: tiada siapa yang betul-betul kenal kelemahan spesifik anak anda — sampai ke subtopik yang tepat.
          </p>
        </div>
        <div className="border-t pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0" style={{ borderColor: `${HIJAU}1f` }}>
          <p className="font-display text-lg font-extrabold text-foreground sm:text-xl">Sampai ke kemahiran yang spesifik</p>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            KALI teliti corak jawapan anak untuk mengenal pasti bahagian yang benar-benar perlu diberi perhatian.
          </p>
        </div>
      </div>
    </section>
  );
}


function SectionHead({ ikon, tajuk }: { ikon: React.ReactNode; tajuk: string }) {
  return (
    <div className="mt-4 mb-2 flex items-center gap-1.5">
      <span
        className="flex h-5 w-5 items-center justify-center rounded-md text-white"
        style={{ backgroundColor: HIJAU }}
      >
        {ikon}
      </span>
      <h4 className="font-display text-xs font-extrabold text-foreground">{tajuk}</h4>
    </div>
  );
}

function MockStat({
  label,
  nilai,
  icon,
  warna,
  light,
}: {
  label: string;
  nilai: string;
  icon: React.ReactNode;
  warna: string;
  light?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-2 shadow-soft"
      style={{ backgroundColor: light ? `${warna}1f` : warna, color: light ? "#1a1a1a" : "#fff" }}
    >
      <div className="flex items-center gap-1 text-[9px] font-extrabold opacity-90">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-sm font-extrabold leading-tight">{nilai}</p>
    </div>
  );
}

function Mekanisme() {
  return (
    <section id="mekanisme" className="overflow-hidden bg-muted/15 py-14 sm:py-16">
      <style>{`
        @keyframes mekanisme-path-draw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes mekanisme-answer-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mekanisme-insight-pulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklab, ${KALI_BLUE} 0%, transparent); }
          45% { box-shadow: 0 0 0 8px color-mix(in oklab, ${KALI_BLUE} 16%, transparent); }
        }
        .mekanisme-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: mekanisme-path-draw 900ms ease-out 150ms forwards;
        }
        .mekanisme-answer {
          opacity: 0;
          animation: mekanisme-answer-in 300ms ease-out forwards;
        }
        .mekanisme-answer:nth-child(2) { animation-delay: 120ms; }
        .mekanisme-answer:nth-child(3) { animation-delay: 210ms; }
        .mekanisme-answer:nth-child(4) { animation-delay: 300ms; }
        .mekanisme-answer:nth-child(5) { animation-delay: 390ms; }
        .mekanisme-insight { animation: mekanisme-insight-pulse 1000ms ease-out 650ms 1; }
        @media (prefers-reduced-motion: reduce) {
          .mekanisme-path { animation: none; stroke-dashoffset: 0; }
          .mekanisme-answer { animation: none; opacity: 1; transform: none; }
          .mekanisme-insight { animation: none; }
        }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
            MEKANISME KALI
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Bagaimana KALI Membantu
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            KALI bukan sekadar kira markah — ia guna corak jawapan untuk tentukan apa anak perlu buat selepas ini.
          </p>
        </div>

        <div className="relative mx-auto mt-8 max-w-5xl sm:mt-10">
          <svg
            className="pointer-events-none absolute left-[9%] right-[9%] top-0 hidden h-10 w-[82%] overflow-visible md:block"
            viewBox="0 0 820 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="mekanisme-path"
              pathLength="1"
              d="M0 18 C170 18 650 18 820 18"
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity="0.42"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="relative grid grid-cols-1 gap-0 md:grid-cols-[1fr_1.18fr_1fr] md:items-center">
            <li className="relative pb-12 pl-12 md:pb-0 md:pl-0 md:pr-7">
              <div className="absolute bottom-0 left-[1.15rem] top-6 w-px bg-primary/30 md:hidden" aria-hidden="true" />
              <span className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-background font-display text-sm font-extrabold text-primary md:left-1/2 md:top-[-1.1rem] md:-translate-x-1/2">
                1
              </span>
              <div className="rounded-lg border border-primary/20 bg-card p-4 shadow-sm sm:p-5 md:mt-5">
                <div className="rounded-md bg-secondary/60 p-3 text-center">
                  <p className="font-display text-xl font-extrabold text-foreground">8 ÷ 2 = ?</p>
                  <div className="mt-3 grid grid-cols-4 gap-1.5" aria-label="Pilihan jawapan; 4 ialah jawapan betul">
                    {["2", "3", "4", "6"].map((jawapan) => (
                      <span
                        key={jawapan}
                        className={`flex h-8 items-center justify-center rounded-md border text-sm font-extrabold ${
                          jawapan === "4"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {jawapan}{jawapan === "4" ? " ✓" : ""}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-center gap-1.5" aria-label="Corak jawapan: betul, salah, betul, betul, salah">
                    {["✓", "✗", "✓", "✓", "✗"].map((tanda, index) => (
                      <span
                        key={`${tanda}-${index}`}
                        className="mekanisme-answer flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold"
                        style={{
                          backgroundColor: tanda === "✓" ? `${HIJAU}1a` : `${EMAS}24`,
                          color: tanda === "✓" ? HIJAU : "#7a5300",
                        }}
                      >
                        {tanda}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">Anak Jawab</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Anak menjawab soalan seperti biasa.</p>
              </div>
              <ChevronRight className="absolute bottom-3 left-[0.7rem] h-4 w-4 rotate-90 text-primary md:hidden" aria-hidden="true" />
            </li>

            <li className="relative pb-12 pl-12 md:z-10 md:pb-0 md:pl-0">
              <div className="absolute bottom-0 left-[1.15rem] top-6 w-px bg-primary/30 md:hidden" aria-hidden="true" />
              <span
                className="absolute left-0 top-0 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background font-display text-sm font-extrabold text-primary-foreground shadow-sm md:left-1/2 md:top-[-1.2rem] md:-translate-x-1/2"
                style={{ backgroundColor: KALI_BLUE }}
              >
                2
              </span>
              <div
                className="mekanisme-insight rounded-lg border p-4 shadow-card sm:p-5 md:scale-[1.04] md:p-6"
                style={{ backgroundColor: `${KALI_BLUE}0d`, borderColor: `${KALI_BLUE}40` }}
              >
                <div className="rounded-md border bg-card p-3.5" style={{ borderColor: `${KALI_BLUE}38` }}>
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: KALI_BLUE }} aria-hidden="true" />
                      <p className="font-display text-sm font-extrabold" style={{ color: KALI_BLUE }}>KALI Insight</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Corak dikesan</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-md bg-secondary/60 px-3 py-2">
                      <span className="font-display text-sm font-extrabold text-foreground">Tambah</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Check className="h-3.5 w-3.5" /> Sudah Dikuasai</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: `${EMAS}1a` }}>
                      <span className="font-display text-sm font-extrabold text-foreground">Bahagi</span>
                      <span className="inline-flex items-center gap-1 text-right text-xs font-bold" style={{ color: "#7a5300" }}><span aria-hidden="true">!</span> Perlu Diperkukuhkan</span>
                    </div>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">KALI Nampak Corak</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">KALI menganalisis corak jawapan untuk mengenal pasti bahagian yang perlu diberi perhatian.</p>
              </div>
              <ChevronRight className="absolute bottom-3 left-[0.7rem] h-4 w-4 rotate-90 text-primary md:hidden" aria-hidden="true" />
            </li>

            <li className="relative pl-12 md:pl-7">
              <span className="absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-background font-display text-sm font-extrabold text-primary md:left-1/2 md:top-[-1.1rem] md:-translate-x-1/2">
                3
              </span>
              <div className="rounded-lg border border-primary/20 bg-card p-4 shadow-sm sm:p-5 md:mt-5">
                <div className="rounded-md border border-primary/20 bg-secondary/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seterusnya</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-foreground">Bahagi</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-display text-xs font-extrabold text-primary-foreground" aria-label="Contoh tindakan Mulakan Latihan">
                    <Zap className="h-3.5 w-3.5" /> Mulakan Latihan <span aria-hidden="true">→</span>
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">Latihan Seterusnya</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">KALI pilih latihan yang lebih tepat berdasarkan dapatan ini.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function Ciri() {
  const temas = [
    {
      no: "01",
      t: "Faham Dulu",
      d: "Nota ringkas ikut topik bantu anak faham semula sebelum terus berlatih.",
      image: ciriNotaAsset.url,
      alt: "Screenshot Nota Ringkas Sains Kalifah dengan pilihan topik, rajah tumbuhan dan isi pembelajaran",
    },
    {
      no: "02",
      t: "Berlatih Dengan Cara Berbeza",
      d: "Latihan, kuiz dan game bantu anak belajar dengan lebih aktif dan tidak membosankan.",
      image: ciriGameAsset.url,
      alt: "Screenshot pilihan set soalan bergambar Sains Kalifah",
    },
    {
      no: "03",
      t: "Kekal Bermotivasi",
      d: "Setiap jawapan betul beri star. Anak boleh tebus hadiah dan raikan pencapaian dengan sijil.",
      image: ciriGanjaranAsset.url,
      alt: "Screenshot Kedai Hadiah Kalifah dengan baki star dan hadiah untuk ditebus",
    },
  ];
  return (
    <section id="ciri" className="overflow-hidden py-14 sm:py-16">
      <div className="container mx-auto px-4">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Anak Bukan Hanya Jawab Soalan.
        </h2>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">
          Selepas KALI kenal pasti bahagian yang perlu diberi perhatian, ini bagaimana anak belajar setiap hari.
        </p>
      </div>
      <div className="mt-9 space-y-12 sm:mt-12 sm:space-y-16">
        {temas.map((tema, i) => (
          <article
            key={tema.no}
            className={`grid items-center gap-5 md:gap-10 lg:gap-14 ${
              i % 2 === 1
                ? "md:grid-cols-[minmax(260px,0.55fr)_minmax(0,1.45fr)]"
                : "md:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)]"
            }`}
          >
            <div className={`min-w-0 ${i % 2 === 1 ? "md:order-2" : ""}`}>
              <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
                <img
                  src={tema.image}
                  alt={tema.alt}
                  width={725}
                  height={732}
                  loading="lazy"
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className={`flex gap-4 md:block ${i % 2 === 1 ? "md:order-1 md:text-right" : ""}`}>
              <span
                className="shrink-0 font-display text-3xl font-extrabold leading-none sm:text-4xl md:text-5xl"
                style={{ color: `${HIJAU}55` }}
              >
                {tema.no}
              </span>
              <div className="min-w-0 md:mt-4">
                <h3 className="font-display text-xl font-extrabold leading-tight text-foreground sm:text-2xl">{tema.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{tema.d}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}

function ParentEvidence() {
  const points = [
    {
      title: "Tahu apa yang perlu diberi perhatian",
      description: "Ibu bapa tidak perlu teka subtopik mana yang anak perlukan bantuan.",
    },
    {
      title: "Nampak perkembangan dari masa ke masa",
      description: "Perubahan pembelajaran lebih mudah dilihat, bukan tunggu keputusan peperiksaan sahaja.",
    },
    {
      title: "Ada bukti anak benar-benar belajar",
      description: "Aktiviti dan perkembangan anak direkodkan supaya ibu bapa lebih yakin dengan apa yang sedang berlaku.",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-muted/20 py-14 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <p className="font-display text-xs font-extrabold uppercase tracking-wider text-primary">
            Untuk Ibu Bapa
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Anak Belajar. Ibu Bapa Nampak Apa Yang Berubah.
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            Bukan sekadar tahu anak sudah buat latihan. Kalifah bantu ibu bapa nampak bahagian yang perlu diberi perhatian dan perkembangan yang sedang berlaku.
          </p>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.75fr)] lg:gap-12">
          <div className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card">
            <img
              src={parentEvidenceAsset.url}
              alt="Screenshot Dashboard Ibu Bapa: Apa KALI Nampak, Bukti Kemajuan Bersama KALI dan Ringkasan Prestasi; identiti peribadi ditutup"
              width={796}
              height={1010}
              loading="lazy"
              className="h-auto w-full"
            />
          </div>

          <div className="space-y-6">
            {points.map((point) => (
              <div key={point.title} className="flex gap-3 border-b border-border/70 pb-6 last:border-b-0 last:pb-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-base font-extrabold text-foreground sm:text-lg">
                    {point.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiputanKurikulum() {
  const darjahList = ["1", "2", "3", "4", "5", "6"];
  const subjekList = [
    "Bahasa Melayu",
    "Bahasa Inggeris",
    "Matematik",
    "Sains",
    "Pendidikan Islam",
    "Sejarah*",
  ];
  return (
    <section id="subjek" className="bg-muted/20 py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base text-muted-foreground md:text-lg">
            Untuk Darjah 1 hingga 6, dengan sehingga 6 subjek mengikut darjah.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-2">
          {darjahList.map((d, i) => (
            <div key={d} className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-extrabold"
                style={{ backgroundColor: `${HIJAU}14`, color: HIJAU }}
              >
                {d}
              </span>
              {i < darjahList.length - 1 && (
                <span className="h-px w-4 sm:w-6" style={{ backgroundColor: `${HIJAU}33` }} />
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl pt-6 text-center" style={{ borderTop: `1px solid ${HIJAU}1f` }}>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-sm font-semibold text-foreground sm:text-base">
            {subjekList.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-2">
                {s}
                {i < subjekList.length - 1 && <span className="text-muted-foreground">·</span>}
              </span>
            ))}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">*Sejarah tersedia bermula Darjah 4.</p>
        </div>
      </div>
    </section>
  );
}

function Harga() {
  return (
    <section id="harga" className="container mx-auto px-4 py-16">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: HIJAU }}>Harga Berbaloi</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Pilih pakej yang sesuai untuk keluarga
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Semua harga adalah untuk tempoh 1 tahun penuh.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PAKEJ_LIST.map((p) => {
          const popular = !!p.popular;
          return (
            <div
              key={p.id}
              className={`relative rounded-[2rem] bg-card p-7 shadow-card transition ${popular ? "order-first scale-[1.02] md:order-none md:scale-105" : ""}`}
              style={{
                border: popular ? `3px solid ${EMAS}` : `2px solid ${HIJAU}22`,
              }}
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
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                Harga Pengenalan
              </span>
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
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Akses penuh nota, latih tubi, kuiz & game</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Ibu bapa boleh lihat perkembangan anak</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Sijil cemerlang automatik bila skor kuiz penuh</li>
                {p.id === "bundle" && <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Untuk semua anak (D1–D6)</li>}
              </ul>
              <div className="mt-6 flex flex-col items-center">
                <Link
                  to="/daftar"
                  search={{ ref: undefined }}
                  className="block w-full rounded-full px-5 py-3 text-center font-display text-sm font-extrabold shadow-soft transition hover:opacity-90"
                  style={{
                    backgroundColor: popular ? EMAS : HIJAU,
                    color: "#fff",
                  }}
                >
                  Pilih Pakej Ini
                </Link>
                <p className="mt-1 text-sm font-semibold text-foreground">Daftar percuma — pilih darjah & bayar selepas daftar</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Testimoni() {
  const items = [
    {
      n: "Encik Rizal",
      r: "Bapa kepada D6",
      t: "Anak saya seronok dengan game dan kuiz. Sijil PDF buat dia lebih bersemangat belajar.",
    },
    {
      n: "Puan Hidayah",
      r: "Ibu kepada D1",
      t: "Antaramuka mesra kanak-kanak. Saya boleh tahu subjek mana anak saya lemah dengan cepat.",
    },
  ];
  return (
    <section className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: EMAS }}>Testimoni</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Apa kata ibu bapa
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {items.map((it) => (

            <div key={it.n} className="rounded-3xl bg-card p-6 shadow-soft">
              <div className="flex gap-1 text-xl" style={{ color: EMAS }}>★★★★★</div>
              <p className="mt-3 text-sm text-foreground">"{it.t}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full font-display font-extrabold text-white"
                  style={{ backgroundColor: HIJAU }}
                >
                  {it.n[6]}
                </div>
                <div>
                  <p className="font-display text-sm font-extrabold text-foreground">{it.n}</p>
                  <p className="text-xs text-muted-foreground">{it.r}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "Adakah portal ini sesuai untuk semua darjah?",
      a: "Ya, Kalifah.my menyokong Darjah 1 hingga Darjah 6 dengan kandungan yang disesuaikan untuk setiap tahap.",
    },
    {
      q: "Bagaimana saya pantau progress anak saya?",
      a: "Daftar akaun ibu bapa, tambah profil anak, dan akses dashboard ibu bapa untuk lihat soalan dijawab, ketepatan, masa belajar dan banyak lagi.",
    },
    {
      q: "Adakah anak perlukan emel sendiri?",
      a: "Tidak. Ibu bapa boleh cipta akaun anak menggunakan username & password sahaja — tanpa perlukan emel.",
    },
    {
      q: "Bolehkah saya batal langganan?",
      a: "Langganan adalah untuk tempoh 1 tahun. Anda boleh memilih untuk tidak memperbaharui pada bila-bila masa.",
    },
    {
      q: "Adakah sijil sah?",
      a: "Sijil yang dijana adalah sijil penghargaan dalam talian dengan kod unik, sesuai untuk motivasi anak. Bukan pengganti sijil rasmi sekolah.",
    },
  ];
  return (
    <section id="faq" className="border-t border-border/60 container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: HIJAU }}>FAQ</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">Soalan Lazim</h2>
      </div>
      <div className="mx-auto mt-10 max-w-2xl">
        {items.map((it, i) => (
          <FaqItem key={i} q={it.q} a={it.a} isFirst={i === 0} />
        ))}
      </div>
    </section>
  );
}
function FaqItem({ q, a, isFirst }: { q: string; a: string; isFirst?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5" style={{ borderTop: isFirst ? "none" : `1px solid ${HIJAU}1f` }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="font-display text-sm font-extrabold text-foreground md:text-base">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} style={{ color: HIJAU }} />
      </button>
      {open && (
        <p className="mt-3 pl-4 text-sm text-muted-foreground" style={{ borderLeft: `2px solid ${HIJAU}` }}>
          {a}
        </p>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Link to="/" className="flex items-center gap-2">
          <KalifahLogo className="h-8 md:h-9" />
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Portal pembelajaran online untuk Darjah 1–6. Belajar dengan ceria & berkat.
          </p>
        </div>
        <div>
          <p className="font-display text-sm font-extrabold text-foreground">Link Penting</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#ciri" className="text-muted-foreground hover:text-foreground">Ciri-Ciri</a></li>
            <li><a href="#harga" className="text-muted-foreground hover:text-foreground">Harga</a></li>
            <li><a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a></li>
            <li><Link to="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>

            <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Log Masuk</Link></li>
            <li><Link to="/daftar" search={{ ref: undefined }} className="text-muted-foreground hover:text-foreground">Daftar</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-extrabold text-foreground">Hubungi Kami</p>
          <p className="mt-3 text-sm text-muted-foreground">support@kalifah.my</p>
          <a
            href="https://t.me/KalifahAssistantbot"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft transition hover:opacity-90"
            style={{ backgroundColor: "#229ED9" }}
          >
            <Send className="h-5 w-5" />
            Chat di Telegram
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © 2026 Kalifah.my. Hak cipta terpelihara.
      </div>
    </footer>
  );
}
