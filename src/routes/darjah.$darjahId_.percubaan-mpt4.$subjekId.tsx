import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { getDarjah, getSubjek, TONE_GRADIENT } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/percubaan-mpt4/$subjekId")({
  head: () => ({
    meta: [{ title: "Percubaan MPT4 — Pilih Set — Kalifah.my" }],
  }),
  ssr: false,
  component: PercubaanMpt4SetPage,
});

const SLUG_TO_LABEL: Record<string, string> = {
  "bahasa-melayu": "Bahasa Melayu",
  "bahasa-inggeris": "Bahasa Inggeris",
  "matematik": "Matematik",
  "sains": "Sains",
};

interface Mpt4Set {
  id: string;
  subjek: string;
  nombor_set: number;
  tajuk: string | null;
  jumlah_markah: number | null;
  tempoh_minit: number | null;
  markah_andaian: boolean | null;
  status: string | null;
}

function formatTempoh(minit: number | null): string {
  if (!minit || minit <= 0) return "—";
  const jam = Math.floor(minit / 60);
  const baki = minit % 60;
  if (jam === 0) return `${baki} minit`;
  if (baki === 0) return `${jam} jam`;
  return `${jam} jam ${baki} minit`;
}

function PercubaanMpt4SetPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/percubaan-mpt4/$subjekId" });
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);
  const mata = usePoints();
  const studentName = user?.user_metadata?.name as string | undefined;

  const [sets, setSets] = useState<Mpt4Set[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const subjekLabel = SLUG_TO_LABEL[subjekId];

  useEffect(() => {
    if (!subjekLabel) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("mpt4_set")
        .select("id, subjek, nombor_set, tajuk, jumlah_markah, tempoh_minit, markah_andaian, status")
        .eq("subjek", subjekLabel)
        .order("nombor_set", { ascending: true });
      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
        setSets([]);
        return;
      }
      setSets((data ?? []) as Mpt4Set[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [subjekLabel]);

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

  if (!darjah || !subjek || !subjekLabel || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Tidak dijumpai</h1>
          <Link
            to="/darjah/$darjahId/percubaan-mpt4"
            params={{ darjahId }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Link
          to="/darjah/$darjahId/percubaan-mpt4"
          params={{ darjahId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Subjek MPT4
        </Link>

        <section className="mt-4 rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
              {darjah.label}
            </span>
            <span className="rounded-full bg-primary px-4 py-1.5 font-display text-xs font-extrabold text-primary-foreground shadow-soft">
              🎯 Percubaan MPT4
            </span>
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-gold-foreground shadow-soft">
              {subjek.title}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Pilih <span className="text-primary">Set</span>
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Pilih set peperiksaan percubaan untuk dimulakan.
          </p>
        </section>

        {fetchError && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Ralat memuatkan set: {fetchError}
          </div>
        )}

        {sets === null && !fetchError && (
          <p className="mt-8 text-muted-foreground">Memuatkan set...</p>
        )}

        {sets !== null && sets.length === 0 && !fetchError && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 text-center text-muted-foreground">
            Tiada set tersedia buat masa ini.
          </div>
        )}

        {sets !== null && sets.length > 0 && (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${TONE_GRADIENT[subjek.tone]} shadow-soft text-xl`}>
                    {subjek.emoji}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-extrabold text-foreground">
                      {s.tajuk || `Set ${s.nombor_set}`}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground">{subjek.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Jumlah Markah</div>
                    <div className="font-display text-lg font-extrabold text-foreground">{s.jumlah_markah ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tempoh</div>
                    <div className="font-display text-lg font-extrabold text-foreground">{formatTempoh(s.tempoh_minit)}</div>
                  </div>
                </div>

                {s.markah_andaian && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-800/40 dark:bg-orange-950/20">
                    <span className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 font-display text-[10px] font-extrabold text-white">
                      Markah anggaran
                    </span>
                    <p className="mt-2 text-xs text-orange-800 dark:text-orange-200">
                      Struktur markah belum disahkan rasmi, tertakluk kepada pembetulan.
                    </p>
                  </div>
                )}

                <Link
                  to="/darjah/$darjahId/percubaan-mpt4/$subjekId/$setId"
                  params={{ darjahId, subjekId, setId: s.id }}
                  className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition hover:translate-x-1"
                >
                  Mula →
                </Link>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
