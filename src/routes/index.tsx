import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Target,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Zap,
  Send,
  FileX,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { HARGA_ASAL, PAKEJ_LIST } from "@/lib/curriculum";
import { KalifahLogo } from "@/components/KalifahLogo";

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
      <LiputanKurikulum />
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
    <div className="mx-auto max-w-xl">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {anak.map((a) => (
          <div
            key={a.nama}
            className="rounded-2xl bg-card p-4 text-left shadow-soft sm:p-5"
            style={{ border: `2px solid ${HIJAU}22` }}
          >
            <p className="font-display text-xs font-extrabold text-foreground sm:text-sm">{a.nama}</p>
            <p className="mt-1 font-display text-3xl font-extrabold sm:text-4xl" style={{ color: HIJAU }}>6/10</p>
            <div className="mt-3 space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs text-foreground sm:text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: HIJAU }} />
                {a.dikuasai}
              </span>
              <span
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs sm:text-sm"
                style={{ backgroundColor: `${EMAS}1a`, color: "#7a5300" }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: EMAS }} />
                {a.diperkukuhkan} — Perlu Diperkukuhkan
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-foreground">
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
    <section className="relative overflow-hidden">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: `${EMAS}33` }} />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: `${HIJAU}33` }} />
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Yang paling susah bukan bila anak salah. Yang susah bila kita tak tahu dia mula tak faham di mana.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Markah cuma tunjuk berapa yang betul. Ia tak tunjuk bahagian mana yang anak sebenarnya belum faham.
          </p>

          <div className="mt-8">
            <HeroBuktiVisual />
          </div>

          <p className="mx-auto mt-8 max-w-xl text-base font-semibold text-foreground md:text-lg">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: KALI_BLUE }} />
            KALI bantu cari bahagian yang perlu diberi perhatian — supaya anak tak sekadar buat lebih banyak latihan, tapi latihan yang lebih tepat.
          </p>

          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/cuba-kali-web"
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 sm:w-auto"
              style={{ backgroundColor: HIJAU }}
            >
              🧪 Cuba KALI Percuma
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
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
  const cards = [
    {
      ikon: FileX,
      tajuk: "Tuisyen Tiada Report",
      teks: "Anak pergi tuisyen 6 bulan. Bila tanya cikgu — 'Dia okay, tengah improve.' Improve kat mana? Tak tahu. Bayar RM900, dapat jawapan 4 perkataan.",
    },
    {
      ikon: Target,
      tajuk: "Buku Latihan = Tembak Serampang",
      teks: "Beli buku latihan tebal 200 muka surat. Anak buat 50 soalan. 30 soalan tu bab yang dia dah kuat. 10 soalan bab yang dia lemah — tapi tak perasan sebab campur-campur. Masa habis, kelemahan tetap kelemahan.",
    },
    {
      ikon: AlertCircle,
      tajuk: "Baru Tahu Lepas Exam",
      teks: "Ujian Darjah 4, anak 60%. Rupanya dia tersangkut kat 'Pecahan Tak Wajar' sejak Darjah 3. Kalau tahu awal, 10 minit sehari fokus situ je dah cukup. Tapi sekarang? Kena kejar balik 3 bulan.",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-muted/20 py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ ikon: Ikon, tajuk, teks }) => (
            <div
              key={tajuk}
              className="rounded-2xl bg-card p-6 shadow-soft"
              style={{ border: "2px solid hsl(var(--border))" }}
            >
              <div className="flex items-center gap-2">
                <Ikon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display text-sm font-extrabold text-foreground">{tajuk}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{teks}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Twist() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl lg:text-4xl">
            Bukan Anak Anda Tak Rajin. Bukan Ibu Bapa Tak Prihatin.
          </h2>
        </div>
        <div className="mx-auto mt-6 max-w-2xl space-y-4 text-center">
          <p className="text-base text-muted-foreground md:text-lg">
            Masalahnya: tiada siapa yang betul-betul kenal kelemahan spesifik anak anda — sampai ke subtopik yang tepat.
          </p>
          <p className="text-base text-muted-foreground md:text-lg">
            KALI buat benda yang cikgu tuisyen tak sempat buat: analisis 857 kemahiran kecil, satu persatu, untuk anak anda seorang.
          </p>
        </div>
        <div className="mt-10">
          <KaliCardsMockup />
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            to="/cuba-kali-web"
            className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
            style={{ backgroundColor: HIJAU }}
          >
            <Zap className="h-5 w-5" /> Cuba KALI Percuma — 10 Soalan, 2 Minit
          </Link>
        </div>
      </div>
    </section>
  );
}

function KaliCardsMockup() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        {/* Kad Anak A */}
        <div
          className="flex-1 rounded-3xl bg-card p-6 shadow-card"
          style={{ border: `2px solid ${HIJAU}22`, backgroundColor: "#FFFBF2" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-foreground">Anak A</h3>
            <span
              className="rounded-full px-2.5 py-1 font-display text-[10px] font-extrabold text-white"
              style={{ backgroundColor: HIJAU }}
            >
              Matematik
            </span>
          </div>
          <div className="mt-4 text-center">
            <p className="font-display text-5xl font-extrabold" style={{ color: HIJAU }}>6/10</p>
            <p className="mt-1 text-xs text-muted-foreground">Markah ujian terkini</p>
          </div>
          <div className="mt-5 rounded-2xl bg-white/60 p-4" style={{ border: `2px solid ${HIJAU}1a` }}>
            <p className="font-display text-xs font-extrabold text-foreground">Latihan seterusnya:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Pecahan (ulang asas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Masa & Waktu (pengenalan)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Kad Anak B */}
        <div
          className="flex-1 rounded-3xl bg-card p-6 shadow-card"
          style={{ border: `2px solid ${EMAS}44`, backgroundColor: "#FFFBF2" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-foreground">Anak B</h3>
            <span
              className="rounded-full px-2.5 py-1 font-display text-[10px] font-extrabold text-white"
              style={{ backgroundColor: EMAS }}
            >
              Bahasa Melayu
            </span>
          </div>
          <div className="mt-4 text-center">
            <p className="font-display text-5xl font-extrabold" style={{ color: EMAS }}>6/10</p>
            <p className="mt-1 text-xs text-muted-foreground">Markah ujian terkini</p>
          </div>
          <div className="mt-5 rounded-2xl bg-white/60 p-4" style={{ border: `2px solid ${EMAS}1a` }}>
            <p className="font-display text-xs font-extrabold text-foreground">Latihan seterusnya:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: EMAS }}>✓</span>
                <span>Ayat Majmuk (Tatabahasa BM)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: EMAS }}>✓</span>
                <span>Kata Adjektif (perkatan)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Contoh cara KALI memilih latihan — bukan data sebenar.
      </p>
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

function Mekanisme() {
  const steps = [
    {
      label: "1. Anak Jawab",
      visual: (
        <div className="mt-2 flex items-center gap-1.5 md:mt-3">
          {["✓", "✗", "✓", "✓", "✗"].map((tanda, i) => (
            <span
              key={i}
              className="flex h-5 w-5 items-center justify-center rounded-md text-xs font-extrabold md:h-6 md:w-6"
              style={{
                backgroundColor: tanda === "✓" ? `${HIJAU}1a` : `${EMAS}1a`,
                color: tanda === "✓" ? HIJAU : "#7a5300",
              }}
            >
              {tanda}
            </span>
          ))}
        </div>
      ),
      d: "Setiap jawapan direkodkan — bukan sekadar markah akhir.",
    },
    {
      label: "2. KALI Nampak Corak",
      visual: (
        <div className="mt-2 md:mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Contoh: Anak A</p>
          <div className="mt-1.5 space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm text-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: HIJAU }} />
              Tambah
            </span>
            <span
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm"
              style={{ backgroundColor: `${EMAS}1a`, color: "#7a5300" }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: EMAS }} />
              Bahagi — Perlu Diperkukuhkan
            </span>
          </div>
        </div>
      ),
      d: "KALI kenal pasti bahagian yang masih perlu diperkukuhkan — corak yang markah sahaja tidak tunjukkan.",
    },
    {
      label: "3. Latihan Seterusnya",
      visual: (
        <div className="mt-2 md:mt-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-extrabold"
            style={{ backgroundColor: `${EMAS}1a`, color: "#7a5300", border: `1.5px solid ${EMAS}55` }}
          >
            <Zap className="h-3.5 w-3.5" />
            Latihan: Bahagi
          </span>
        </div>
      ),
      d: "Anak terus dapat latihan yang sesuai dengan tahapnya sekarang — automatik.",
    },
  ];

  return (
    <section id="mekanisme" className="container mx-auto px-4 py-16">
      <div className="text-center">
        <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: HIJAU }}>
          Dari Jawapan Kepada Latihan Yang Tepat
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Bagaimana KALI Membantu
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
          Ingat Anak A dan Anak B tadi? Ini macam mana KALI tahu apa yang setiap seorang sebenarnya perlukan.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-col items-stretch gap-2 md:mt-12 md:flex-row md:items-start">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-stretch gap-2 md:flex-row md:items-start">
            <div className="flex-1 rounded-2xl bg-card p-4 shadow-soft md:p-5" style={{ border: `2px solid ${HIJAU}1f` }}>
              <p className="font-display text-xs font-extrabold" style={{ color: HIJAU }}>{s.label}</p>
              {s.visual}
              <p className="mt-2 text-sm text-muted-foreground md:mt-3">{s.d}</p>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="mx-auto h-5 w-5 shrink-0 rotate-90 text-muted-foreground md:mx-0 md:mt-8 md:h-6 md:w-6 md:rotate-0" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Ciri() {
  const temas = [
    {
      no: "01",
      t: "Faham Dulu",
      d: "Nota ringkas disusun ikut topik — termasuk formula matematik untuk rujukan pantas semasa buat latihan.",
    },
    {
      no: "02",
      t: "Berlatih Dengan Cara Berbeza",
      d: "Latih tubi merentasi semua subtopik dengan lebih 13,000 soalan tersedia, ditambah kuiz ikut standard kurikulum KSSR — supaya anak tak bosan ulang benda yang sama.",
    },
    {
      no: "03",
      t: "Kekal Bermotivasi",
      d: "Anak kumpul mata setiap jawapan betul, dan dapat sijil cemerlang automatik bila skor kuiz penuh.",
    },
  ];
  return (
    <section id="ciri" className="container mx-auto px-4 py-16">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Anak Bukan Hanya Jawab Soalan.
        </h2>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">
          Selepas KALI kenal pasti bahagian yang perlu diberi perhatian, ini bagaimana anak belajar setiap hari.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-3xl">
        {temas.map((tema, i) => (
          <div
            key={tema.no}
            className="flex gap-5 py-6 sm:gap-8"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${HIJAU}1f` }}
          >
            <span
              className="shrink-0 font-display text-3xl font-extrabold sm:text-4xl"
              style={{ color: `${HIJAU}55` }}
            >
              {tema.no}
            </span>
            <div>
              <h3 className="font-display text-lg font-extrabold text-foreground sm:text-xl">{tema.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{tema.d}</p>
            </div>
          </div>
        ))}
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
                  search={{ ref: undefined }}
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
