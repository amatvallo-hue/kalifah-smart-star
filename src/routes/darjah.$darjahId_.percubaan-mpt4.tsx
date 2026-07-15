import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { getDarjah, SUBJEK_LIST, TONE_GRADIENT } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/percubaan-mpt4")({
  head: () => ({
    meta: [{ title: "Percubaan MPT4 — Pilih Subjek — Kalifah.my" }],
  }),
  ssr: false,
  component: PercubaanMpt4SubjekPage,
});

const MPT4_SUBJEK_IDS = ["bahasa-melayu", "bahasa-inggeris", "matematik", "sains"] as const;

function PercubaanMpt4SubjekPage() {
  const navigate = useNavigate();
  const { darjahId } = useParams({ from: "/darjah/$darjahId_/percubaan-mpt4" });
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const darjah = getDarjah(darjahId);
  const mata = usePoints();
  const studentName = user?.user_metadata?.name as string | undefined;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const darjahAkses = profile?.darjah_akses ?? [];
  const hasAccess = darjah ? darjahAkses.includes(Number(darjah.id)) : false;

  if (!darjah || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Darjah ini belum dibuka</h1>
          <p className="mt-2 text-muted-foreground">Sila pilih pakej untuk membuka darjah ini.</p>
          <Link to="/harga" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            Lihat Pakej
          </Link>
        </main>
      </div>
    );
  }

  const subjekMpt4 = SUBJEK_LIST.filter((s) => (MPT4_SUBJEK_IDS as readonly string[]).includes(s.id));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
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
            <span className="rounded-full bg-primary px-4 py-1.5 font-display text-xs font-extrabold text-primary-foreground shadow-soft">
              🎯 Percubaan MPT4
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Pilih <span className="text-primary">Subjek</span>
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Peperiksaan percubaan ikut format sebenar Matriks Pembelajaran Tahun 4.
          </p>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {subjekMpt4.map((s) => (
            <Link
              key={s.id}
              to="/darjah/$darjahId/percubaan-mpt4/$subjekId"
              params={{ darjahId, subjekId: s.id }}
              className="group flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl">{s.emoji}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${TONE_GRADIENT[s.tone]} shadow-soft transition group-hover:scale-110`}>
                  <s.icon className="h-4 w-4" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className="font-display text-xl font-extrabold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
