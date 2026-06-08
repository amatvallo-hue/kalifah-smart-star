import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SUBJEK_LIST, getDarjah, TONE_GRADIENT } from "@/lib/curriculum";

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
  const darjah = getDarjah(darjahId);

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

  if (!darjah || darjah.locked) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Darjah ini belum dibuka</h1>
          <p className="mt-2 text-muted-foreground">Sila pilih darjah lain yang tersedia.</p>
          <Link to="/pilih-darjah" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
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
            Pilih <span className="text-primary">Subjek</span> kamu
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Setiap subjek ada nota ringkas, latih tubi, game, kuiz dan latihan bertulis yang menyeronokkan!
          </p>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJEK_LIST.map((s) => (
            <Link
              key={s.id}
              to="/darjah/$darjahId/$subjekId"
              params={{ darjahId, subjekId: s.id }}
              className="group flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${TONE_GRADIENT[s.tone]} shadow-soft transition group-hover:scale-110`}>
                <s.icon className="h-7 w-7" strokeWidth={2.5} />
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
