import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Star,
  Check,
  PenLine,
  Languages,
  Calculator,
  Award,
  TrendingUp,
  Target,
  BookOpen,
  Users,
  ShieldCheck,
  ChevronDown,
  FlaskConical,
  Calendar,
  Clock,
  Flame,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { HARGA_ASAL, PAKEJ_LIST } from "@/lib/curriculum";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalifah.my — Kenal Pasti Kelemahan Anak Sebelum Peperiksaan" },
      {
        name: "description",
        content:
          "Portal pembelajaran online untuk Darjah 1–6. Pantau prestasi anak dalam Bahasa Melayu, Matematik dan Bahasa Inggeris dengan latihan, kuiz dan sijil automatik.",
      },
      { property: "og:title", content: "Kalifah.my — Pembelajaran Pintar untuk Anak Anda" },
      { property: "og:description", content: "Lebih 32,000+ soalan latihan. Pantau progress anak. Sesuai untuk D1–D6." },
    ],
  }),
  ssr: true,
  component: LandingPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <Ciri />
      <Subjek />
      <Harga />
      <Testimoni />
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
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            <span className="font-display text-xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Kalifah<span style={{ color: HIJAU }}>.my</span>
          </span>
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
            className="hidden rounded-full px-4 py-2 font-display text-sm font-bold text-foreground hover:bg-secondary sm:inline-flex"
          >
            Log Masuk
          </Link>
          <div className="flex flex-col items-center">
            <Link
              to="/daftar"
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

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: `${EMAS}33` }} />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: `${HIJAU}33` }} />
      <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft"
            style={{ color: HIJAU }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Untuk Darjah 1 hingga 6
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-foreground md:text-6xl">
            Kenal Pasti{" "}
            <span style={{ color: HIJAU }}>Kelemahan Anak</span> Sebelum Peperiksaan
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Portal pembelajaran yang bantu ibu bapa pantau prestasi anak dalam{" "}
            <b>Bahasa Melayu</b>, <b>Matematik</b>, <b>Bahasa Inggeris</b>, <b>Sains</b> dan <b>Pendidikan Islam</b>.
            Lebih 32,000+ soalan latihan & sijil automatik.
          </p>

          <div className="mt-7 grid w-full max-w-xl gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
              <h3 className="font-display text-sm font-extrabold text-muted-foreground">Tuisyen biasa</h3>
              <p className="mt-1 font-display text-2xl font-extrabold text-foreground">RM100–200<span className="text-base font-bold text-muted-foreground">/bulan</span></p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="text-rose-500">✗</span> Tiada tracking kemajuan</li>
                <li className="flex items-center gap-2"><span className="text-rose-500">✗</span> Ibu bapa tak nampak progress</li>
                <li className="flex items-center gap-2"><span className="text-rose-500">✗</span> Bergantung pada jadual cikgu</li>
              </ul>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: `${HIJAU}44`, backgroundColor: `${HIJAU}08` }}>
              <h3 className="font-display text-sm font-extrabold" style={{ color: HIJAU }}>Kalifah.my</h3>
              <p className="mt-1 font-display text-2xl font-extrabold" style={{ color: HIJAU }}>RM49<span className="text-base font-bold text-muted-foreground">/tahun sahaja</span></p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2"><span style={{ color: HIJAU }}>✓</span> Dashboard pantau ibu bapa</li>
                <li className="flex items-center gap-2"><span style={{ color: HIJAU }}>✓</span> 32,000+ soalan latihan</li>
                <li className="flex items-center gap-2"><span style={{ color: HIJAU }}>✓</span> Belajar bila-bila masa</li>
              </ul>
            </div>
          </div>

          <blockquote className="mt-5 max-w-xl border-l-4 pl-4 italic text-foreground" style={{ borderColor: HIJAU }}>
            "Anak saya naik dari 60% ke 82% dalam masa 2 bulan. Dashboard tu memang membantu saya pantau dia setiap hari."
            <footer className="mt-1 text-xs not-italic text-muted-foreground">— Cikgu Eema Rahman, ibu kepada pelajar Darjah 4</footer>
          </blockquote>

          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              to="/daftar"
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 sm:flex-1"
              style={{ backgroundColor: HIJAU }}
            >
              <Sparkles className="h-5 w-5" /> Cuba Sekarang
            </Link>
            <a
              href="#harga"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-card px-6 py-3.5 font-display text-base font-extrabold shadow-soft sm:flex-1"
              style={{ color: HIJAU, border: `2px solid ${HIJAU}33` }}
            >
              <Star className="h-5 w-5" /> Lihat Harga
            </a>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftar percuma — cuba dulu, bayar kalau suka
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Terus tahu anak lemah subjek apa & topik apa
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" style={{ color: HIJAU }} /> Selamat & sesuai untuk kanak-kanak
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" style={{ color: EMAS }} /> Dipercayai ibu bapa
            </span>
          </div>
        </div>

        <div className="relative">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  const subjects = [
    { nama: "Bahasa Melayu", purata: 94, siap: 100, aktiviti: 8, terkini: "14/15" },
    { nama: "Matematik", purata: 88, siap: 80, aktiviti: 6, terkini: "13/15" },
    { nama: "Pendidikan Islam", purata: 96, siap: 60, aktiviti: 4, terkini: "12/15" },
    { nama: "Bahasa Inggeris", purata: 76, siap: 40, aktiviti: 3, terkini: null },
    { nama: "Sains", purata: 82, siap: 40, aktiviti: 3, terkini: null },
  ];
  return (
    <div
      className="rounded-[2rem] bg-card p-5 shadow-card"
      style={{ border: `2px solid ${HIJAU}22`, backgroundColor: "#FFFBF2" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-soft"
          style={{ backgroundColor: HIJAU }}
        >
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-extrabold leading-tight text-foreground">
            Dashboard Ibu Bapa
          </h3>
          <p className="text-[11px] text-muted-foreground">Pantau pembelajaran anak anda</p>
        </div>
      </div>

      {/* Pemilih anak */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className="rounded-full px-3 py-1 font-display text-[11px] font-extrabold text-white"
          style={{ backgroundColor: HIJAU, border: `2px solid ${HIJAU}` }}
        >
          Aisyah Sufiya • D5
        </span>
        <span
          className="rounded-full px-3 py-1 font-display text-[11px] font-extrabold"
          style={{ backgroundColor: `${HIJAU}14`, color: HIJAU, border: `2px solid ${HIJAU}33` }}
        >
          Adam Safwan • D3
        </span>
      </div>

      {/* Minggu Ini */}
      <SectionHead ikon={<Calendar className="h-3.5 w-3.5" />} tajuk="Minggu Ini" />
      <div className="grid grid-cols-4 gap-2">
        <MockStat label="Soalan" nilai="124" icon={<BookOpen className="h-3.5 w-3.5" />} warna={HIJAU} />
        <MockStat label="Ketepatan" nilai="92%" icon={<Target className="h-3.5 w-3.5" />} warna={EMAS} light />
        <MockStat label="Masa" nilai="45m" icon={<Clock className="h-3.5 w-3.5" />} warna={HIJAU} light />
        <MockStat label="Bab" nilai="18" icon={<TrendingUp className="h-3.5 w-3.5" />} warna={EMAS} />
      </div>

      {/* Kemajuan Subjek */}
      <SectionHead ikon={<BookOpen className="h-3.5 w-3.5" />} tajuk="Kemajuan Subjek" />
      <div className="grid gap-2 sm:grid-cols-2">
        {subjects.slice(0, 4).map((s) => (
          <div
            key={s.nama}
            className="rounded-xl bg-card p-2.5 shadow-soft"
            style={{ border: `2px solid ${HIJAU}1f` }}
          >
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-display text-[11px] font-extrabold text-foreground">{s.nama}</h4>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}
              >
                ⭐ {s.purata}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ backgroundColor: `${HIJAU}1a` }}>
              <div className="h-full" style={{ width: `${s.siap}%`, backgroundColor: HIJAU }} />
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">
              {s.siap}% siap • {s.aktiviti} aktiviti
              {s.terkini && <> • <b>{s.terkini}</b></>}
            </p>
          </div>
        ))}
      </div>

      {/* Insight cards */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div
          className="rounded-xl bg-card p-3 shadow-soft"
          style={{ border: `2px solid ${HIJAU}33` }}
        >
          <p className="text-[10px] font-extrabold text-muted-foreground">Subjek Terkuat 💪</p>
          <p className="mt-1 font-display text-sm font-extrabold text-foreground">Matematik</p>
          <p className="text-[10px] text-muted-foreground">Purata 88% • 6 aktiviti</p>
        </div>
        <div
          className="rounded-xl p-3 shadow-soft"
          style={{ border: `2px solid #dc262633`, backgroundColor: "#fef2f2" }}
        >
          <p className="text-[10px] font-extrabold text-muted-foreground">Perlukan Perhatian ⚠️</p>
          <p className="mt-1 font-display text-sm font-extrabold text-foreground">Bahasa Inggeris</p>
          <p className="text-[10px] text-muted-foreground">Purata 76% • 3 aktiviti</p>
        </div>
      </div>

      {/* Streak & Lencana */}
      <SectionHead ikon={<Flame className="h-3.5 w-3.5" />} tajuk="Streak & Lencana" />
      <div className="grid grid-cols-3 gap-2">
        <MockStat label="Streak" nilai="14 hari 🔥" icon={<Flame className="h-3.5 w-3.5" />} warna="#dc2626" />
        <MockStat label="Lencana" nilai="12" icon={<Award className="h-3.5 w-3.5" />} warna={EMAS} light />
        <MockStat label="Bab Siap" nilai="7" icon={<TrendingUp className="h-3.5 w-3.5" />} warna={HIJAU} />
      </div>
    </div>
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

function Ciri() {
  const items = [
    { ikon: Target, t: "Kenal Subjek & Topik Lemah", d: "Sistem auto-kesan subjek DAN topik spesifik yang anak perlukan perhatian lebih — bukan setakat subjek, sampai ke topik/subtopik." },
    { ikon: Zap, t: "Latih Tubi", d: "Merangkumi semua subtopik bagi setiap subjek, lebih 10,000+ soalan latih tubi." },
    { ikon: Award, t: "Kuiz", d: "Topik kuiz disusun mengikut standard kurikulum KSSR. Anak dapat sijil cemerlang bila skor penuh!" },
    { ikon: BookOpen, t: "Nota Ringkas", d: "Nota disusun mengikut topik, termasuk formula matematik yang disediakan untuk rujukan pantas." },
    { ikon: Star, t: "Ganjaran & Mata", d: "Anak kumpul mata setiap kali jawab soalan betul — sistem reward untuk galakan berterusan." },
  ];
  return (
    <section id="ciri" className="container mx-auto px-4 py-16">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: HIJAU }}>Ciri-Ciri</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Semua yang anda perlu untuk bantu anak cemerlang
        </h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ ikon: Ikon, t, d }) => (
          <div key={t} className="rounded-3xl bg-card p-6 shadow-soft transition hover:-translate-y-1" style={{ border: `2px solid ${HIJAU}1f` }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: HIJAU }}>
              <Ikon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Subjek() {
  const items = [
    {
      ikon: PenLine,
      t: "Bahasa Melayu",
      d: "Tatabahasa, imbuhan, sinonim, peribahasa & karangan ringkas.",
      contoh: ["Padankan jawapan", "Susun ayat", "Betul/Salah"],
    },
    {
      ikon: Calculator,
      t: "Matematik",
      d: "Nombor, operasi, pecahan, wang, masa dan ukuran.",
      contoh: ["Latih tubi pantas", "Kuiz timed", "Game perlumbaan"],
    },
    {
      ikon: Languages,
      t: "Bahasa Inggeris",
      d: "Vocabulary, grammar, reading & simple sentence building.",
      contoh: ["Match the word", "Fill in the blanks", "Quiz"],
    },
    {
      ikon: FlaskConical,
      t: "Sains",
      d: "Alam semula jadi, sains hayat, fizik asas & eksperimen mudah.",
      contoh: ["Soal jawab", "Kuiz gambar", "Latih tubi"],
    },
    {
      ikon: BookOpen,
      t: "Pendidikan Islam",
      d: "Aqidah, ibadah, sirah, akhlak & al-Quran.",
      contoh: ["Soal jawab", "Betul/Salah", "Latih tubi"],
    },
  ];
  return (
    <section id="subjek" className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: EMAS }}>Subjek Utama</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Fokus pada 5 subjek utama
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ ikon: Ikon, t, d, contoh }) => (
            <div key={t} className="rounded-3xl bg-card p-7 shadow-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: EMAS }}>
                <Ikon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-extrabold text-foreground">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              <ul className="mt-4 space-y-2">
                {contoh.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4" style={{ color: HIJAU }} /> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
              className={`relative rounded-[2rem] bg-card p-7 shadow-card transition ${popular ? "scale-[1.02] md:scale-105" : ""}`}
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
                Harga Beta
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
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Akses penuh nota, latih tubi, kuiz, game</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Dashboard ibu bapa</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Sijil automatik</li>
                {p.id === "bundle" && <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Untuk semua anak (D1–D6)</li>}
              </ul>
              <div className="mt-6 flex flex-col items-center">
                <Link
                  to="/daftar"
                  className="block w-full rounded-full px-5 py-3 text-center font-display text-sm font-extrabold shadow-soft transition hover:opacity-90"
                  style={{
                    backgroundColor: popular ? EMAS : HIJAU,
                    color: "#fff",
                  }}
                >
                  Pilih Pakej Ini
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">Daftar percuma — pilih darjah &amp; bayar selepas daftar</p>
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
      n: "Cikgu Eema Rahman",
      r: "Tanjung Malim",
      t: "Baru 3 minggu guna, anak dah ada pertambahan masa belajar di rumah. Saya suka sebab boleh tengok apa latihan yang anak buat. Anak pula suka kuiz dan game!",
    },
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
        <div className="mt-10 grid gap-6 md:grid-cols-3">
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
    <section id="faq" className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: HIJAU }}>FAQ</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">Soalan Lazim</h2>
      </div>
      <div className="mt-8 space-y-3">
        {items.map((it, i) => (
          <FaqItem key={i} q={it.q} a={it.a} />
        ))}
      </div>
    </section>
  );
}
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft" style={{ border: `2px solid ${HIJAU}1f` }}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="font-display text-sm font-extrabold text-foreground md:text-base">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} style={{ color: HIJAU }} />
      </button>
      {open && <p className="mt-3 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-soft" style={{ backgroundColor: HIJAU }}>
              <span className="font-display text-xl font-extrabold">ك</span>
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
              Kalifah<span style={{ color: HIJAU }}>.my</span>
            </span>
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
            <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Log Masuk</Link></li>
            <li><Link to="/daftar" className="text-muted-foreground hover:text-foreground">Daftar</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-extrabold text-foreground">Hubungi Kami</p>
          <p className="mt-3 text-sm text-muted-foreground">support@kalifah.my</p>
          <a
            href="https://wa.me/601111402553"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft transition hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hubungi Kami
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © 2026 Kalifah.my. Hak cipta terpelihara.
      </div>
    </footer>
  );
}
