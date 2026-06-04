import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Calculator, Globe, Sparkles, Trophy, Flame, Target, PenLine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SubjectCard } from "@/components/SubjectCard";
import heroKids from "@/assets/hero-kids.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalifah.my — Belajar Sambil Seronok" },
      { name: "description", content: "Portal pembelajaran Islamik untuk kanak-kanak Malaysia. Kuiz, latihan dan ganjaran bintang." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const studentName = "Ahmad";
  const totalStars = 42;
  const streak = 5;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={totalStars} />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative grid items-center gap-6 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
                <Sparkles className="h-3.5 w-3.5" />
                Assalamualaikum!
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
                Selamat datang,
                <br />
                <span className="text-primary">{studentName}!</span> 🌟
              </h1>
              <p className="mt-3 max-w-md text-base text-muted-foreground">
                Hari ini hari yang hebat untuk belajar perkara baru. Mari mulakan pengembaraan kamu!
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/kuiz"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
                >
                  <Target className="h-5 w-5" />
                  Mula Kuiz
                </Link>
                <Link
                  to="/latihan"
                  className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 font-display font-extrabold text-foreground shadow-soft transition hover:-translate-y-0.5"
                >
                  <PenLine className="h-5 w-5 text-primary" />
                  Latihan Bertulis
                </Link>
              </div>
            </div>

            <div className="relative hidden justify-center md:flex">
              <img
                src={heroKids}
                alt="Kanak-kanak gembira belajar"
                width={420}
                height={420}
                className="h-auto w-[360px] animate-float drop-shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatTile icon={Trophy} label="Jumlah Bintang" value={totalStars} tone="gold" />
          <StatTile icon={Flame} label="Hari Berturut-turut" value={`${streak} hari`} tone="rose" />
          <StatTile icon={BookOpen} label="Kuiz Selesai" value={12} tone="emerald" />
        </section>

        {/* Subjects */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
                Mata Pelajaran
              </h2>
              <p className="text-sm text-muted-foreground">Pilih satu untuk mula belajar</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SubjectCard
              to="/kuiz"
              title="Pendidikan Islam"
              description="Rukun Iman, doa harian & sirah."
              icon={BookOpen}
              progress={75}
              tone="emerald"
            />
            <SubjectCard
              to="/kuiz"
              title="Matematik"
              description="Tambah, tolak, darab & bahagi."
              icon={Calculator}
              progress={60}
              tone="gold"
            />
            <SubjectCard
              to="/kuiz"
              title="Bahasa Melayu"
              description="Tatabahasa & karangan ringkas."
              icon={PenLine}
              progress={45}
              tone="sky"
            />
            <SubjectCard
              to="/kuiz"
              title="Sains & Dunia"
              description="Alam sekitar dan ciptaan Allah."
              icon={Globe}
              progress={30}
              tone="rose"
            />
          </div>
        </section>

        {/* Daily mission */}
        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl bg-card p-6 shadow-card lg:col-span-2">
            <h3 className="font-display text-xl font-extrabold text-foreground">Misi Hari Ini</h3>
            <ul className="mt-4 space-y-3">
              {[
                { task: "Selesaikan 1 kuiz Pendidikan Islam", done: true },
                { task: "Hafal doa sebelum makan", done: true },
                { task: "Selesaikan 5 soalan matematik", done: false },
              ].map((m, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-4"
                >
                  <span className={`font-bold ${m.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {m.task}
                  </span>
                  {m.done ? (
                    <span className="rounded-full bg-success/15 px-3 py-1 font-display text-xs font-extrabold text-success">
                      ✓ Selesai
                    </span>
                  ) : (
                    <span className="rounded-full bg-gold/20 px-3 py-1 font-display text-xs font-extrabold text-gold-foreground">
                      Belum
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
            <Sparkles className="h-8 w-8" />
            <h3 className="mt-3 font-display text-xl font-extrabold">Pesanan Hari Ini</h3>
            <p className="mt-2 text-sm opacity-95">
              "Menuntut ilmu itu wajib ke atas setiap Muslim."
            </p>
            <p className="mt-2 text-xs opacity-80">— Hadis Riwayat Ibnu Majah</p>
          </div>
        </section>

        <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kalifah.my — Belajar dengan ceria & berkat.
        </footer>
      </main>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  tone: "gold" | "rose" | "emerald";
}) {
  const toneClasses = {
    gold: "bg-gradient-gold text-gold-foreground",
    rose: "bg-rose-100 text-rose-700",
    emerald: "bg-gradient-primary text-primary-foreground",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-card">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
        <Icon className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-extrabold text-foreground">{value}</div>
      </div>
    </div>
  );
}
