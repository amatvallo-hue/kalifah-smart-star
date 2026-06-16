import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStreak } from "@/hooks/use-streak";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { subjekListUntukRole, getDarjah, TONE_GRADIENT } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId")({
  head: () => ({
    meta: [{ title: "Pilih Subjek — Kalifah.my" }],
  }),
  ssr: false,
  component: SubjekPage,
});

function SubjekPage() {
  const navigate = useNavigate();
  const { darjahId } = useParams({ from: "/darjah/$darjahId" });
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const darjah = getDarjah(darjahId);
  const studentName = user?.user_metadata?.name as string | undefined;
  const streak = useStreak();
  const mata = usePoints();

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
          <div className="mt-3">
            <Link to="/pilih-darjah" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
      <Outlet />
      <main className="container mx-auto px-4 py-8">
        <Link to="/pilih-darjah" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pilihan Darjah
        </Link>

        <section className="mt-4 rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <span className="inline-flex rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
            {darjah.label}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            {studentName ? `Hai, ${studentName.split(' ')[0]}! 👋` : 'Hai! 👋'}
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Nak belajar apa hari ini? Pilih subjek kesukaan kamu!
          </p>
          {streak > 0 && (
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-orange-700 shadow-soft">
              <span className="text-lg">🔥</span>
              <span className="font-display text-sm font-extrabold">{streak} hari berturut-turut!</span>
              {streak >= 7 && <span className="text-sm font-bold">⭐ Hebat!</span>}
              {streak >= 30 && <span className="text-sm font-bold">🥇 Luar biasa!</span>}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjekListUntukRole(profile?.role).map((s) => (
            <Link
              key={s.id}
              to="/darjah/$darjahId/$subjekId"
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
