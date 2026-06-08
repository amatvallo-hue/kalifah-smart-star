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
      { property: "og:description", content: "Lebih 2000 soalan latihan. Pantau progress anak. Sesuai untuk D1–D6." },
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
          <Link
            to="/daftar"
            className="rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            Daftar
          </Link>
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
            <b>Bahasa Melayu</b>, <b>Matematik</b> dan <b>Bahasa Inggeris</b>.
            Lebih 2000 soalan latihan & sijil automatik.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/daftar"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
              style={{ backgroundColor: HIJAU }}
            >
              <Sparkles className="h-5 w-5" /> Cuba Sekarang
            </Link>
            <a
              href="#harga"
              className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 font-display text-base font-extrabold shadow-soft"
              style={{ color: HIJAU, border: `2px solid ${HIJAU}33` }}
            >
              <Star className="h-5 w-5" /> Lihat Harga
            </a>
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" style={{ color: HIJAU }} /> Selamat & sesuai untuk kanak-kanak
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" style={{ color: EMAS }} /> Dipercayai ibu bapa
            </span>
          </div>
        </div>

        <div className="relative">
          <div
            className="rounded-[2.5rem] bg-card p-8 shadow-card"
            style={{ border: `2px solid ${HIJAU}22` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-xs font-bold uppercase text-muted-foreground">Progress Aisyah</p>
                <p className="font-display text-2xl font-extrabold text-foreground">Darjah 3</p>
              </div>
              <div className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}>
                🔥 7 hari streak
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { sj: "Bahasa Melayu", p: 86, w: HIJAU },
                { sj: "Matematik", p: 72, w: EMAS },
                { sj: "Bahasa Inggeris", p: 54, w: "#dc2626" },
              ].map((r) => (
                <div key={r.sj}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">{r.sj}</span>
                    <span className="font-extrabold" style={{ color: r.w }}>{r.p}%</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full transition-all" style={{ width: `${r.p}%`, backgroundColor: r.w }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { l: "Soalan", v: "245" },
                { l: "Lencana", v: "12" },
                { l: "Sijil", v: "3" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl p-3" style={{ backgroundColor: `${HIJAU}14` }}>
                  <p className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>{s.v}</p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ciri() {
  const items = [
    { ikon: TrendingUp, t: "Pantau Real-Time", d: "Lihat progress anak secara langsung selepas setiap aktiviti." },
    { ikon: Target, t: "Kenal Subjek Lemah", d: "Sistem auto-kesan subjek yang perlukan perhatian lebih." },
    { ikon: BookOpen, t: "2000+ Soalan", d: "Bank soalan luas untuk latih tubi, kuiz dan latihan." },
    { ikon: Award, t: "Sijil Automatik", d: "Anak terima sijil PDF bila tamat subjek atau darjah." },
    { ikon: Users, t: "Dashboard Ibu Bapa", d: "Tambah profil anak & pantau prestasi mingguan/bulanan." },
    { ikon: ShieldCheck, t: "Darjah 1 – 6", d: "Lengkap untuk seluruh peringkat sekolah rendah." },
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
  ];
  return (
    <section id="subjek" className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: EMAS }}>Subjek Utama</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Fokus pada 3 subjek teras
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
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
              <Link
                to="/daftar"
                className="mt-6 block w-full rounded-full px-5 py-3 text-center font-display text-sm font-extrabold shadow-soft transition hover:opacity-90"
                style={{
                  backgroundColor: popular ? EMAS : HIJAU,
                  color: "#fff",
                }}
              >
                Pilih Pakej Ini
              </Link>
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
      n: "Puan Nadia",
      r: "Ibu kepada 2 anak D2 & D4",
      t: "Senang nak pantau anak. Sejak guna Kalifah.my, Matematik anak saya meningkat dari 60% ke 85%!",
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
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © 2026 Kalifah.my. Hak cipta terpelihara.
      </div>
    </footer>
  );
}
