import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Lightbulb, PenLine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/nota-ringkas")({
  head: () => ({ meta: [{ title: "Nota Ringkas — Kalifah.my" }] }),
  ssr: false,
  component: NotaRingkasPage,
});

type Istilah = { term: string; def: string };
type NotaRow = {
  id?: string;
  darjah: number;
  subjek: string;
  topik: string;
  bahasa: string;
  konsep: string[] | null;
  istilah: Istilah[] | null;
  formula: string[] | null;
  tips: string[] | null;
};

const HIJAU = "#1B8A5A";
const KUNING = "#F5A623";

function NotaRingkasPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/nota-ringkas" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);
  const [mulaMasa] = useState(() => Date.now());

  const [notaList, setNotaList] = useState<NotaRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedTopik, setSelectedTopik] = useState<string | null>(null);
  const [progressLogged, setProgressLogged] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function fetchNota() {
      setFetching(true);
      const darjahNum = parseInt(darjahId, 10);
      const { data, error } = await supabase
        .from("nota_topik")
        .select("*")
        .eq("darjah", darjahNum)
        .eq("subjek", subjekId)
        .eq("bahasa", subjekId === "bahasa-inggeris" ? "EN" : "BM")
        .order("topik");
      if (cancelled) return;
      if (error) {
        console.error("Gagal muat nota:", error);
        setNotaList([]);
      } else {
        const rows = (data ?? []) as NotaRow[];
        setNotaList(rows);
        if (rows.length > 0) setSelectedTopik(rows[0].topik);
      }
      setFetching(false);
    }
    if (user) fetchNota();
    return () => {
      cancelled = true;
    };
  }, [user, darjahId, subjekId]);

  useEffect(() => {
    if (user && !progressLogged && notaList.length > 0) {
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "nota",
        markah: 1,
        jumlahSoalan: 1,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
      setProgressLogged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, notaList.length]);

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

  const selected = notaList.find((n) => n.topik === selectedTopik) ?? null;
  const isEnglish = subjekId === "bahasa-inggeris";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
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
            style={{ backgroundColor: HIJAU }}
          >
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">Nota Ringkas</h1>
            <p className="text-sm text-muted-foreground">
              {darjah.label} • {subjek.title}
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-2xl p-5 text-center"
          style={{ backgroundColor: "#E8F5EE", border: "2px dashed " + HIJAU }}
        >
          <Lightbulb className="mx-auto h-8 w-8" style={{ color: KUNING }} />
          <p className="mt-2 text-sm font-medium" style={{ color: HIJAU }}>
            {isEnglish ? "Choose a topic below to read the notes." : "Pilih topik di bawah untuk membaca nota."}
          </p>
        </div>

        {fetching ? (
          <div className="mt-10 text-center text-muted-foreground">Memuatkan nota...</div>
        ) : notaList.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-gradient-hero p-10 text-center shadow-card">
            <PenLine className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-2xl font-extrabold text-foreground">
              Nota belum tersedia
            </h2>
            <p className="mt-2 text-muted-foreground">
              Nota ringkas untuk {subjek.title} ({darjah.label}) sedang disediakan.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {notaList.map((n) => {
                const aktif = n.topik === selectedTopik;
                return (
                  <button
                    key={n.topik}
                    onClick={() => setSelectedTopik(n.topik)}
                    className="rounded-full px-4 py-2 text-sm font-bold transition"
                    style={{
                      backgroundColor: aktif ? HIJAU : "#FFFFFF",
                      color: aktif ? "#FFFFFF" : HIJAU,
                      border: `2px solid ${HIJAU}`,
                    }}
                  >
                    {n.topik}
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="mt-6 grid gap-5">
                <SectionList
                  title={isEnglish ? "What We Learn" : "Apa yang kita pelajari"}
                  icon="📚"
                  items={selected.konsep ?? []}
                />
                <SectionIstilah istilah={selected.istilah ?? []} />
                <SectionList
                  title={isEnglish ? "Key Points" : "Formula / Poin Penting"}
                  icon="🧮"
                  items={selected.formula ?? []}
                />
                <SectionList title={isEnglish ? "Tips & Examples" : "Tips & Contoh"} icon="💡" items={selected.tips ?? []} />
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                to="/darjah/$darjahId/$subjekId/latih-tubi"
                params={{ darjahId, subjekId }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 font-display text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
                style={{ backgroundColor: HIJAU }}
              >
                Mula Latih Tubi →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SectionList({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-3xl bg-card p-6 shadow-card" style={{ border: "2px solid #E8F5EE" }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-soft"
          style={{ backgroundColor: HIJAU, color: "#FFFFFF" }}
        >
          {icon}
        </div>
        <h2 className="font-display text-xl font-extrabold" style={{ color: HIJAU }}>
          {title}
        </h2>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item, j) => (
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
              style={{ backgroundColor: KUNING }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionIstilah({ istilah }: { istilah: Istilah[] }) {
  if (!istilah || istilah.length === 0) return null;
  return (
    <div className="rounded-3xl bg-card p-6 shadow-card" style={{ border: "2px solid #E8F5EE" }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-soft"
          style={{ backgroundColor: HIJAU, color: "#FFFFFF" }}
        >
          🔤
        </div>
        <h2 className="font-display text-xl font-extrabold" style={{ color: HIJAU }}>
          Istilah Penting
        </h2>
      </div>
      <dl className="mt-4 space-y-3">
        {istilah.map((it, j) => (
          <div
            key={j}
            className="rounded-xl px-4 py-3 text-sm leading-relaxed text-foreground"
            style={{
              backgroundColor: j % 2 === 0 ? "#FEFCF5" : "#FFFFFF",
              border: "1px solid #F5A62333",
            }}
          >
            <dt className="font-extrabold" style={{ color: HIJAU }}>
              {it.term}
            </dt>
            <dd className="mt-1 font-medium">{it.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
