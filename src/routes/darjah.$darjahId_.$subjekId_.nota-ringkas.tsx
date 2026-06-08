import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Lightbulb, PenLine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { getNotes } from "@/lib/notes-bank";
import { simpanProgress } from "@/lib/progress";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/nota-ringkas")({
  head: () => ({ meta: [{ title: "Nota Ringkas — Kalifah.my" }] }),
  ssr: false,
  component: NotaRingkasPage,
});

function NotaRingkasPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/nota-ringkas" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);
  const notes = getNotes(darjahId, subjekId);
  const [mulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user && notes) {
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "nota",
        markah: 1,
        jumlahSoalan: 1,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, !!notes]);

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
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Aktiviti
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft"
            style={{ backgroundColor: "#1B8A5A" }}
          >
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Nota Ringkas
            </h1>
            <p className="text-sm text-muted-foreground">
              {darjah.label} • {subjek.title}
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-2xl p-5 text-center"
          style={{ backgroundColor: "#E8F5EE", border: "2px dashed #1B8A5A" }}
        >
          <Lightbulb className="mx-auto h-8 w-8" style={{ color: "#F5A623" }} />
          <p className="mt-2 text-sm font-medium" style={{ color: "#1B8A5A" }}>
            Baca nota ini sebelum mula kuiz. Semoga berjaya!
          </p>
        </div>

        {notes ? (
          <div className="mt-6 grid gap-5">
            {notes.sections.map((section, i) => (
              <div
                key={i}
                className="rounded-3xl bg-card p-6 shadow-card"
                style={{ border: "2px solid #E8F5EE" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-soft"
                    style={{ backgroundColor: "#1B8A5A", color: "#FFFFFF" }}
                  >
                    {section.icon}
                  </div>
                  <h2
                    className="font-display text-xl font-extrabold"
                    style={{ color: "#1B8A5A" }}
                  >
                    {section.title}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {section.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold leading-relaxed text-foreground"
                      style={{
                        backgroundColor: j % 2 === 0 ? "#FEFCF5" : "#FFFFFF",
                        border: "1px solid #F5A62333",
                      }}
                    >
                      <span
                        className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: "#F5A623" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl bg-gradient-hero p-10 text-center shadow-card">
            <PenLine className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-2xl font-extrabold text-foreground">
              Nota akan datang
            </h2>
            <p className="mt-2 text-muted-foreground">
              Nota ringkas untuk {subjek.title} ({darjah.label}) sedang disediakan.
            </p>
          </div>
        )}

        {notes && (
          <div className="mt-8 text-center">
            <Link
              to="/darjah/$darjahId/$subjekId/latih-tubi"
              params={{ darjahId, subjekId }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 font-display text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
              style={{ backgroundColor: "#1B8A5A" }}
            >
              Mula Latih Tubi →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
