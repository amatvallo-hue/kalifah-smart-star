import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { getQuiz } from "@/lib/quiz-bank";

export const Route = createFileRoute("/darjah/$darjahId/$subjekId/kuiz")({
  head: () => ({ meta: [{ title: "Kuiz — Kalifah.my" }] }),
  ssr: false,
  component: KuizPage,
});

function KuizPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId/$subjekId/kuiz" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);
  const soalanList = getQuiz(darjahId, subjekId);

  const [i, setI] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [skor, setSkor] = useState(0);
  const [selesai, setSelesai] = useState(false);

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

  if (!soalanList || soalanList.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader stars={42} onLogout={handleLogout} />
        <main className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <Link
            to="/darjah/$darjahId/$subjekId"
            params={{ darjahId, subjekId }}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="mt-8 rounded-3xl bg-gradient-hero p-10 shadow-card">
            <h1 className="font-display text-3xl font-extrabold text-foreground">Kuiz akan datang</h1>
            <p className="mt-2 text-muted-foreground">
              Kuiz untuk {subjek.title} ({darjah.label}) sedang disediakan. Nantikan!
            </p>
          </div>
        </main>
      </div>
    );
  }

  const soalan = soalanList[i];
  const betul = pilih !== null && pilih === soalan.jawapan;
  const bintang = skor >= Math.ceil(soalanList.length * 0.8) ? 3 : skor >= Math.ceil(soalanList.length * 0.5) ? 2 : skor >= 1 ? 1 : 0;

  const seterusnya = () => {
    if (i + 1 >= soalanList.length) setSelesai(true);
    else {
      setI(i + 1);
      setPilih(null);
    }
  };

  const handlePilih = (idx: number) => {
    if (pilih !== null) return;
    setPilih(idx);
    if (idx === soalan.jawapan) setSkor((s) => s + 1);
  };

  const reset = () => {
    setI(0);
    setPilih(null);
    setSkor(0);
    setSelesai(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Aktiviti
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
            {darjah.label}
          </span>
          <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-gold-foreground shadow-soft">
            {subjek.title}
          </span>
          <span className="rounded-full bg-gradient-primary px-4 py-1.5 font-display text-xs font-extrabold text-primary-foreground shadow-soft">
            Kuiz
          </span>
        </div>

        {!selesai ? (
          <>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-muted-foreground">
                Soalan {i + 1} / {soalanList.length}
              </span>
              <span className="rounded-full bg-gradient-gold px-3 py-1 font-display text-xs font-extrabold text-gold-foreground">
                Skor: {skor}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${((i + (pilih !== null ? 1 : 0)) / soalanList.length) * 100}%` }}
              />
            </div>

            <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
              <h1 className="font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl">
                {soalan.soalan}
              </h1>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {soalan.pilihan.map((p, idx) => {
                  const isPilih = pilih === idx;
                  const showBetul = pilih !== null && idx === soalan.jawapan;
                  const showSalah = isPilih && idx !== soalan.jawapan;
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePilih(idx)}
                      disabled={pilih !== null}
                      className={`group flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left font-bold transition ${
                        showBetul
                          ? "border-success bg-success/10 text-success"
                          : showSalah
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : pilih !== null
                              ? "border-border bg-secondary/50 text-muted-foreground"
                              : "border-border bg-background hover:-translate-y-0.5 hover:border-primary hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold ${
                          showBetul
                            ? "bg-success text-success-foreground"
                            : showSalah
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}
                      >
                        {showBetul ? <Check className="h-5 w-5" /> : showSalah ? <X className="h-5 w-5" /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>

              {pilih !== null && (
                <div
                  className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${
                    betul ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm font-bold">
                    {betul ? "Syabas! Jawapan kamu betul! 🎉" : "Hampir betul! Cuba lagi pada soalan seterusnya."}
                    {soalan.nota && <div className="mt-1 font-medium opacity-90">{soalan.nota}</div>}
                  </div>
                </div>
              )}

              <button
                onClick={seterusnya}
                disabled={pilih === null}
                className="mt-6 w-full rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {i + 1 >= soalanList.length ? "Selesai" : "Soalan Seterusnya →"}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <Sparkles className="h-10 w-10 text-gold-foreground" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-4xl">
              Tahniah! 🎉
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Kamu jawab betul <span className="font-extrabold text-primary">{skor}</span> daripada{" "}
              <span className="font-extrabold text-primary">{soalanList.length}</span> soalan
            </p>
            <div className="mt-5 flex justify-center">
              <StarReward earned={bintang} />
            </div>
            <p className="mt-4 font-display font-extrabold text-foreground">
              {bintang === 3 ? "Cemerlang! Kamu hebat!" : bintang === 2 ? "Bagus sekali!" : bintang === 1 ? "Terus berusaha!" : "Jangan putus asa, cuba lagi!"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Cuba Lagi
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full bg-card px-6 py-3 font-display font-extrabold text-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Kembali ke Aktiviti
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
