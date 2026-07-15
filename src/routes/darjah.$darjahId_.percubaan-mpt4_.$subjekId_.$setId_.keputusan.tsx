import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";

export const Route = createFileRoute(
  "/darjah/$darjahId_/percubaan-mpt4_/$subjekId_/$setId_/keputusan",
)({
  head: () => ({
    meta: [{ title: "Percubaan MPT4 — Keputusan (Dalam Pembinaan) — Kalifah.my" }],
  }),
  ssr: false,
  component: KeputusanStubPage,
});

function KeputusanStubPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({
    from: "/darjah/$darjahId_/percubaan-mpt4_/$subjekId_/$setId_/keputusan",
  });
  const { user, loading } = useAuth();
  const mata = usePoints();
  const studentName = user?.user_metadata?.name as string | undefined;

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-border/60 bg-card p-8 shadow-card">
          <div className="text-5xl">🚧</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">
            Semakan & keputusan sedang dibina
          </h1>
          <p className="mt-2 text-muted-foreground">
            Jawapan anda telah disimpan. Semakan automatik dan keputusan akan tersedia tidak lama lagi.
          </p>
          <Link
            to="/darjah/$darjahId/percubaan-mpt4/$subjekId"
            params={{ darjahId, subjekId }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Senarai Set
          </Link>
        </div>
      </main>
    </div>
  );
}
