import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Gamepad2, PenLine, Target, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
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
    id: "nota-ringkas" as const,
    title: "Nota Ringkas",
    description: "Rujukan ringkas sebelum buat kuiz.",
    icon: BookOpen,
    tone: "from-emerald-600 to-emerald-400 text-white",
    to: "/nota-ringkas" as const,
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
    id: "game" as const,
    title: "Game",
    description: "Main sambil belajar — seronok!",
    icon: Gamepad2,
    tone: "from-rose-400 to-rose-300 text-rose-900",
    to: "/kuiz" as const,
  },
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
];

function AktivitiPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId" });
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const isAdmin = profile?.role === "admin";
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);
  const mata = usePoints();

  const [isiKosongCount, setIsiKosongCount] = useState<number | null>(null);
  const [bergambarCount, setBergambarCount] = useState<number | null>(null);
  const [mendengarCount, setMendengarCount] = useState<number | null>(null);


  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    const darjahNum = Number(darjahId);
    if (!Number.isFinite(darjahNum)) return;

    (async () => {
      const { count } = await supabase
        .from("soalan_isi_kosong")
        .select("id", { count: "exact", head: true })
        .eq("darjah", darjahNum)
        .in("subjek", [subjekId, `${subjekId}-en`]);
      if (!cancelled) setIsiKosongCount(count ?? 0);
    })();

    const bergambarCodes =
      subjekId === "sains" ? ["SC", "SC-EN"] : subjekId === "matematik" ? ["MT", "MT-EN"] : subjekId === "bahasa-melayu" ? ["BM"] : subjekId === "bahasa-inggeris" ? ["bahasa-inggeris"] : null;
    if (bergambarCodes) {
      (async () => {
        const { count } = await supabase
          .from("soalan_bergambar_rajah")
          .select("id", { count: "exact", head: true })
          .eq("darjah", darjahNum)
          .in("subjek", bergambarCodes);
        if (!cancelled) setBergambarCount(count ?? 0);
      })();
    } else {
      setBergambarCount(0);
    }

    return () => {
      cancelled = true;
    };
  }, [darjahId, subjekId]);

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

  if (!darjah || !subjek) {
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
      <SiteHeader stars={mata} onLogout={handleLogout} />
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
            <Link
              to="/darjah/$darjahId"
              params={{ darjahId }}
              className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft transition hover:opacity-80"
            >
              {darjah.label}
            </Link>
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


        {/* Hero — Latih Tubi */}
        {(() => {
          const latihTubi = ACTIVITIES.find((a) => a.id === "latih-tubi")!;
          return (
            <Link
              to="/darjah/$darjahId/$subjekId/latih-tubi"
              params={{ darjahId, subjekId }}
              className="group mt-8 flex flex-col gap-4 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-emerald-50 to-amber-50 p-8 shadow-card transition hover:-translate-y-1 hover:shadow-soft dark:from-emerald-950/30 dark:to-amber-950/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-400 text-white shadow-soft transition group-hover:scale-110">
                  <Zap className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <span className="rounded-full bg-primary px-4 py-1.5 font-display text-xs font-extrabold text-primary-foreground">
                  ⚡ Cuba Dulu Ni!
                </span>
              </div>
              <div>
                <h3 className="font-display text-3xl font-extrabold text-foreground">Latih Tubi</h3>
                <p className="mt-1 text-base text-muted-foreground">
                  Soalan rawak tanpa had — makin banyak buat, makin pandai! Ini cara terbaik nak tahu kamu lemah topik mana.
                </p>
              </div>
              <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition group-hover:translate-x-1">
                Mula Latih Tubi →
              </span>
            </Link>
          );
        })()}


        {/* Isi Tempat Kosong */}
        {isiKosongCount !== null && (isiKosongCount > 0 || isAdmin) && (
          <Link
            to="/darjah/$darjahId/$subjekId/isi-kosong"
            params={{ darjahId, subjekId }}
            className="group mt-4 flex items-center gap-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 shadow-card transition hover:-translate-y-1 hover:shadow-soft dark:border-emerald-800/40 dark:bg-emerald-950/20"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-soft transition group-hover:scale-110 text-2xl">
              ✍️
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-extrabold text-foreground">Isi Tempat Kosong</h3>
                {isAdmin && isiKosongCount === 0 && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 font-display text-[10px] font-extrabold text-amber-900">
                    Admin: belum ada data
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">Taip jawapan sendiri — asah ingatan tanpa pilihan A/B/C/D!</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-4 py-2 font-display text-sm font-extrabold text-white shadow-soft transition group-hover:translate-x-1">
              Mula →
            </span>
          </Link>
        )}

        {/* Soalan Bergambar Rajah */}
        {bergambarCount !== null && (bergambarCount > 0 || isAdmin) && (
          <Link
            to="/darjah/$darjahId/$subjekId/bergambar-rajah"
            params={{ darjahId, subjekId }}
            className="group mt-4 flex items-center gap-5 rounded-2xl border-2 border-violet-200 bg-violet-50 p-5 shadow-card transition hover:-translate-y-1 hover:shadow-soft dark:border-violet-800/40 dark:bg-violet-950/20"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white shadow-soft transition group-hover:scale-110 text-2xl">
              📖🖼️
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-extrabold text-foreground">Soalan Bergambar Rajah</h3>
                {isAdmin && bergambarCount === 0 && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 font-display text-[10px] font-extrabold text-amber-900">
                    Admin: belum ada data
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">Baca gambar & petikan, jawab beberapa soalan berkaitan.</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-violet-500 px-4 py-2 font-display text-sm font-extrabold text-white shadow-soft transition group-hover:translate-x-1">
              Mula →
            </span>
          </Link>
        )}



        {/* 4 aktiviti lain */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVITIES.filter((a) => a.id !== "latih-tubi").map((a) => {
            const linkProps =
              a.id === "kuiz"
                ? { to: "/darjah/$darjahId/$subjekId/kuiz" as const, params: { darjahId, subjekId } }
                : a.id === "latihan"
                ? { to: "/darjah/$darjahId/$subjekId/latihan" as const, params: { darjahId, subjekId } }
                : a.id === "nota-ringkas"
                ? { to: "/darjah/$darjahId/$subjekId/nota-ringkas" as const, params: { darjahId, subjekId } }
                : { to: "/darjah/$darjahId/$subjekId/game" as const, params: { darjahId, subjekId } };
            return (
              <Link
                key={a.id}
                {...linkProps}
                className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.tone} shadow-soft transition group-hover:scale-110`}>
                  <a.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-foreground">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                </div>
                <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-display text-xs font-extrabold text-foreground transition group-hover:translate-x-0.5">
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
