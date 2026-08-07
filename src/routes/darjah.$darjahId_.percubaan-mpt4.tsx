import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { getDarjah, SUBJEK_LIST, TONE_GRADIENT } from "@/lib/curriculum";
import { shouldSkipChildGuard } from "@/lib/child-auth";
import { resetModPenuh, tandaModPenuh } from "@/lib/mpt4-gate";
import { SambungTelegram } from "@/components/SambungTelegram";

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

  const [pilihanMod, setPilihanMod] = useState<"cepat" | "penuh" | null>(null);
  const [adaTrial, setAdaTrial] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  
  const [trialChecked, setTrialChecked] = useState(false);

  // Setiap kali skrin permulaan dibuka semula, buang tanda "mod penuh" supaya
  // pengguna wajib lalui gate Telegram + skrin pilihan 5/50 sekali lagi.
  useEffect(() => {
    if (Number(darjahId) === 4) resetModPenuh();
  }, [darjahId]);

  useEffect(() => {
    if (shouldSkipChildGuard()) return;
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);


  // Free-trial: does at least one is_trial set exist?
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("mpt4_set")
        .select("id")
        .eq("is_trial", true)
        .limit(1);
      if (cancelled) return;
      setAdaTrial((data ?? []).length > 0);
      setTrialChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Semak status sambungan Telegram bagi parent kepada akaun semasa
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: kanak } = await supabase
        .from("child_profiles" as never)
        .select("parent_id")
        .eq("child_user_id", user.id)
        .maybeSingle();
      const pid = (kanak as { parent_id: string } | null)?.parent_id ?? user.id;
      const { data: prof } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("id", pid)
        .maybeSingle();
      if (cancelled) return;
      const chatId = (prof as { telegram_chat_id: number | null } | null)?.telegram_chat_id;
      setParentId(pid);
      setTgLinked(chatId !== null && chatId !== undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const perluTungguSemakanTelegram =
    !!darjah && Number(darjah.id) === 4 && tgLinked === null;

  if (
    loading ||
    !user ||
    profileLoading ||
    !trialChecked ||
    perluTungguSemakanTelegram
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const darjahAkses = profile?.darjah_akses ?? [];
  const hasAccess = darjah ? darjahAkses.includes(Number(darjah.id)) : false;
  const trialAccess = !!darjah && Number(darjah.id) === 4 && adaTrial;

  if (!darjah || (!hasAccess && !trialAccess)) {
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


  // Gate: sambung Telegram dahulu (Darjah 4, sebelum skrin pilihan)
  if (
    Number(darjah.id) === 4 &&
    pilihanMod !== "penuh" &&
    tgLinked === false &&
    parentId
  ) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
        <SambungTelegram
          parentId={parentId}
          onLinked={() => setTgLinked(true)}
        />
      </div>
    );
  }

  // Skrin pilihan mod — Darjah 4 sahaja, sebelum orientasi 50-soalan
  if (Number(darjah.id) === 4 && pilihanMod !== "penuh") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
        <main className="container mx-auto max-w-3xl px-4 py-8">
          <Link
            to="/darjah/$darjahId"
            params={{ darjahId }}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Subjek
          </Link>

          <section className="mt-4 rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
              {darjah.label}
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
              Pilih <span className="text-primary">Cara Mula</span>
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Nak anggaran pantas dulu, atau terus buat percubaan penuh macam exam sebenar?
            </p>
          </section>

          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <Link
              to="/darjah/$darjahId/percubaan-mpt4/cepat"
              params={{ darjahId }}
              className="group flex flex-col gap-3 rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
            >
              <span className="text-4xl">⚡</span>
              <h2 className="font-display text-xl font-extrabold text-foreground">5 Soalan Cepat</h2>
              <p className="text-sm text-muted-foreground">
                ~2 minit — anggaran pantas merentas 4 subjek.
              </p>
              <span className="mt-1 font-display text-sm font-extrabold text-primary">Mula sekarang →</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                tandaModPenuh();
                setPilihanMod("penuh");
              }}
              className="group flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 text-left shadow-card transition hover:-translate-y-1 hover:shadow-soft"
            >
              <span className="text-4xl">📝</span>
              <h2 className="font-display text-xl font-extrabold text-foreground">50 Soalan Penuh</h2>
              <p className="text-sm text-muted-foreground">
                Macam exam sebenar — keputusan lebih tepat &amp; pelan belajar penuh.
              </p>
              <span className="mt-1 font-display text-sm font-extrabold text-primary">Pilih subjek →</span>
            </button>
          </section>
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
          {subjekMpt4.map((s) => {
            const terkunci = !hasAccess && s.id !== "matematik" && s.id !== "bahasa-melayu";
            const inner = (
              <>
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
              </>
            );

            if (terkunci) {
              return (
                <Link
                  key={s.id}
                  to="/harga"
                  className="group relative flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 opacity-70 shadow-card transition hover:opacity-100"
                >
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-display text-[10px] font-extrabold text-muted-foreground">
                    <Lock className="h-3 w-3" /> Berbayar
                  </span>
                  {inner}
                </Link>
              );
            }

            return (
              <Link
                key={s.id}
                to="/darjah/$darjahId/percubaan-mpt4/$subjekId"
                params={{ darjahId, subjekId: s.id }}
                className="group flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                {inner}
              </Link>
            );
          })}
        </section>

      </main>
    </div>
  );
}
