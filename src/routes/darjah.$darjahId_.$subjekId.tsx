import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Gamepad2, PenLine, Target, Zap } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId")({
  head: () => ({
    meta: [{ title: "Pilih Aktiviti — Kalifah.my" }],
  }),
  ssr: false,
  component: AktivitiPage,
});

const ACTIVITIES = [
  {
    id: "kuiz" as const,
    title: "Kuiz",
    description: "Jawab soalan & kumpul bintang.",
    icon: Target,
    tone: "from-primary to-primary-glow text-primary-foreground",
    to: "/kuiz" as const,
  },
  {
    id: "latihan" as const,
    title: "Latihan Bertulis",
    description: "Tulis jawapan dan asah kemahiran.",
    icon: PenLine,
    tone: "from-gold to-gold/80 text-gold-foreground",
    to: "/latihan" as const,
  },
  {
    id: "game" as const,
    title: "Game",
    description: "Main sambil belajar — seronok!",
    icon: Gamepad2,
    tone: "from-rose-400 to-rose-300 text-rose-900",
    to: "/kuiz" as const,
  },
  {
    id: "latih-tubi" as const,
    title: "Latih Tubi",
    description: "Soalan rawak tanpa had — uji daya tahan!",
    icon: Zap,
    tone: "from-emerald-500 to-amber-400 text-white",
    to: "/kuiz" as const,
  },
  {
    id: "nota-ringkas" as const,
    title: "Nota Ringkas",
    description: "Rujukan ringkas sebelum buat kuiz.",
    icon: BookOpen,
    tone: "from-emerald-600 to-emerald-400 text-white",
    to: "/nota-ringkas" as const,
  },
];

function AktivitiPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

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

  if (!darjah || darjah.locked || !subjek) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Tidak dijumpai</h1>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Link
          to="/darjah/$darjahId"
          params={{ darjahId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Subjek
        </Link>

        <section className="mt-4 rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
              {darjah.label}
            </span>
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-gold-foreground shadow-soft">
              {subjek.title}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Pilih <span className="text-primary">Aktiviti</span>
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Pelbagai cara seronok untuk belajar {subjek.title}!
          </p>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITIES.map((a) => {
            const linkProps =
              a.id === "kuiz"
                ? { to: "/darjah/$darjahId/$subjekId/kuiz" as const, params: { darjahId, subjekId } }
                : a.id === "latihan"
                ? { to: "/darjah/$darjahId/$subjekId/latihan" as const, params: { darjahId, subjekId } }
                : a.id === "latih-tubi"
                ? { to: "/darjah/$darjahId/$subjekId/latih-tubi" as const, params: { darjahId, subjekId } }
                : a.id === "nota-ringkas"
                ? { to: "/darjah/$darjahId/$subjekId/nota-ringkas" as const, params: { darjahId, subjekId } }
                : { to: "/darjah/$darjahId/$subjekId/game" as const, params: { darjahId, subjekId } };
            return (
              <Link
                key={a.id}
                {...linkProps}
                className="group flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${a.tone} shadow-soft transition group-hover:scale-110`}>
                  <a.icon className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-extrabold text-foreground">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                </div>
                <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition group-hover:translate-x-1">
                  Mula →
                </span>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
