import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Sparkles, Star, LogOut } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DARJAH_LIST } from "@/lib/curriculum";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pilih Darjah — Kalifah.my" },
      { name: "description", content: "Pilih tahap darjah pelajar untuk mula belajar di Kalifah.my." },
    ],
  }),
  ssr: false,
  component: DarjahDashboard,
});

function DarjahDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const metaName =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined);
  const emailLocal = user.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : "";
  const prettyEmail = emailLocal
    ? emailLocal.split(" ").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "";
  const displayName = (metaName && metaName.trim()) || prettyEmail || "Pelajar";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} userName={firstName} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Assalamualaikum!
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              Selamat datang,
              <br />
              <span className="text-primary">{firstName}!</span> 🌟
            </h1>
            <p className="mt-3 max-w-lg text-base text-muted-foreground">
              Pilih darjah kamu di bawah untuk mula belajar hari ini.
            </p>
            <button
              onClick={handleLogout}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-card/70 px-5 py-2.5 font-display text-sm font-extrabold text-muted-foreground shadow-soft transition hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log Keluar
            </button>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
                Pilih Darjah Kamu
              </h2>
              <p className="text-sm text-muted-foreground">Mula dengan Darjah 1. Lain-lain akan datang!</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DARJAH_LIST.map((d, i) => (
              <DarjahCard key={d.id} darjah={d} index={i} />
            ))}
          </div>
        </section>

        <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kalifah.my — Belajar dengan ceria & berkat.
        </footer>
      </main>
    </div>
  );
}

function DarjahCard({ darjah, index }: { darjah: typeof DARJAH_LIST[number]; index: number }) {
  const palettes = [
    "from-primary to-primary-glow text-primary-foreground",
    "from-gold to-gold/80 text-gold-foreground",
    "from-sky-400 to-sky-300 text-sky-900",
    "from-rose-400 to-rose-300 text-rose-900",
    "from-violet-400 to-violet-300 text-violet-900",
    "from-teal-400 to-teal-300 text-teal-900",
  ];
  const tone = palettes[index % palettes.length];

  const inner = (
    <div className="relative flex h-full flex-col justify-between gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition group-hover:-translate-y-1 group-hover:shadow-soft">
      {darjah.locked && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
          <Lock className="h-3 w-3" />
          Akan Datang
        </div>
      )}
      <div className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${tone} shadow-soft transition group-hover:scale-110`}>
        <span className="font-display text-4xl font-extrabold">{darjah.id}</span>
      </div>
      <div>
        <h3 className="font-display text-2xl font-extrabold text-foreground">{darjah.label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{darjah.tagline}</p>
      </div>
      <div className="flex items-center justify-between">
        {darjah.locked ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Belum dibuka
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1 font-display text-xs font-extrabold text-gold-foreground">
            <Star className="h-3.5 w-3.5 fill-gold-foreground" />
            Aktif
          </span>
        )}
      </div>
    </div>
  );

  if (darjah.locked) {
    return <div className="group cursor-not-allowed opacity-70">{inner}</div>;
  }
  return (
    <Link to="/darjah/$darjahId" params={{ darjahId: darjah.id }} className="group">
      {inner}
    </Link>
  );
}
