import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookMarked, Lightbulb, PenLine } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/nota-tatabahasa")({
  head: () => ({
    meta: [
      { title: "Nota Tatabahasa — Kalifah.my" },
      {
        name: "description",
        content: "Nota tatabahasa Bahasa Inggeris untuk murid sekolah rendah — konsep, contoh dan latihan.",
      },
    ],
  }),
  ssr: false,
  component: NotaTatabahasaPage,
});

type TatabahasaRow = {
  id?: string;
  darjah: number;
  subjek: string;
  topik_kod: string;
  topik_nama: string;
  bahagian_no: number;
  bahagian_nama: string;
  kandungan: string;
};

const HIJAU = "#1B8A5A";
const KUNING = "#F5A623";

const mdOptions = {
  overrides: {
    h1: {
      props: {
        className: "mt-5 font-display text-2xl font-extrabold",
        style: { color: HIJAU },
      },
    },
    h2: {
      props: {
        className: "mt-5 font-display text-xl font-extrabold",
        style: { color: HIJAU },
      },
    },
    h3: {
      props: {
        className: "mt-4 font-display text-lg font-extrabold",
        style: { color: HIJAU },
      },
    },
    p: { props: { className: "mt-3 text-sm leading-relaxed text-foreground" } },
    ul: { props: { className: "mt-3 list-disc space-y-1.5 pl-6 text-sm leading-relaxed text-foreground" } },
    ol: { props: { className: "mt-3 list-decimal space-y-1.5 pl-6 text-sm leading-relaxed text-foreground" } },
    li: { props: { className: "marker:text-[#F5A623]" } },
    strong: { props: { className: "font-extrabold text-foreground" } },
    em: { props: { className: "italic" } },
    a: { props: { className: "font-bold underline", style: { color: HIJAU } } },
    hr: { props: { className: "my-5 border-border" } },
    table: {
      props: {
        className: "mt-4 w-full border-collapse overflow-hidden rounded-xl border border-border text-sm",
      },
    },
    thead: { props: { className: "bg-secondary" } },
    th: {
      props: {
        className: "border border-border px-3 py-2 text-left font-display font-extrabold",
        style: { color: HIJAU },
      },
    },
    td: { props: { className: "border border-border px-3 py-2 align-top text-foreground" } },
    blockquote: {
      props: {
        className: "mt-4 rounded-r-xl bg-secondary/60 px-4 py-3 text-sm font-medium leading-relaxed text-foreground",
        style: { borderLeft: `4px solid ${KUNING}` },
      },
    },
    code: {
      props: {
        className: "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
      },
    },
    pre: {
      props: {
        className: "mt-4 overflow-x-auto rounded-xl bg-muted p-4 font-mono text-xs leading-relaxed text-foreground",
      },
    },
    img: { props: { className: "mt-4 max-h-64 rounded-2xl object-contain", loading: "lazy" } },
  },
};

function NotaTatabahasaPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({
    from: "/darjah/$darjahId_/$subjekId_/nota-tatabahasa",
  });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

  const [rows, setRows] = useState<TatabahasaRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedKod, setSelectedKod] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function fetchNota() {
      setFetching(true);
      const darjahNum = parseInt(darjahId, 10);
      const { data, error } = await supabase
        .from("nota_tatabahasa_bi")
        .select("*")
        .eq("darjah", darjahNum)
        .order("topik_kod")
        .order("bahagian_no");
      if (cancelled) return;
      if (error) {
        console.error("Gagal muat nota tatabahasa:", error);
        setRows([]);
      } else {
        const list = (data ?? []) as TatabahasaRow[];
        setRows(list);
        if (list.length > 0) setSelectedKod(list[0].topik_kod);
      }
      setFetching(false);
    }
    if (user) fetchNota();
    return () => {
      cancelled = true;
    };
  }, [user, darjahId]);

  const topics = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) if (!seen.has(r.topik_kod)) seen.set(r.topik_kod, r.topik_nama);
    return Array.from(seen, ([kod, nama]) => ({ kod, nama }));
  }, [rows]);

  const bahagianList = useMemo(
    () => rows.filter((r) => r.topik_kod === selectedKod).sort((a, b) => a.bahagian_no - b.bahagian_no),
    [rows, selectedKod],
  );

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
          <Link
            to="/"
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
      <SiteHeader onLogout={handleLogout} />
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
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">Nota Tatabahasa</h1>
            <p className="text-sm text-muted-foreground">
              <Link to="/darjah/$darjahId" params={{ darjahId }} className="transition hover:text-primary hover:underline">
                {darjah.label}
              </Link>
              {" • "}
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="transition hover:text-primary hover:underline"
              >
                {subjek.title}
              </Link>
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-2xl p-5 text-center"
          style={{ backgroundColor: "#E8F5EE", border: "2px dashed " + HIJAU }}
        >
          <Lightbulb className="mx-auto h-8 w-8" style={{ color: KUNING }} />
          <p className="mt-2 text-sm font-medium" style={{ color: HIJAU }}>
            Choose a grammar topic below to read the notes.
          </p>
        </div>

        {fetching ? (
          <div className="mt-10 text-center text-muted-foreground">Memuatkan nota...</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-gradient-hero p-10 text-center shadow-card">
            <PenLine className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-2xl font-extrabold text-foreground">Nota belum tersedia</h2>
            <p className="mt-2 text-muted-foreground">
              Nota tatabahasa untuk {subjek.title} ({darjah.label}) sedang disediakan.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {topics.map((t) => {
                const aktif = t.kod === selectedKod;
                return (
                  <button
                    key={t.kod}
                    onClick={() => setSelectedKod(t.kod)}
                    className="rounded-full px-4 py-2 text-sm font-bold transition"
                    style={{
                      backgroundColor: aktif ? HIJAU : "#FFFFFF",
                      color: aktif ? "#FFFFFF" : HIJAU,
                      border: `2px solid ${HIJAU}`,
                    }}
                  >
                    {t.nama}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-5">
              {bahagianList.map((b) => (
                <article
                  key={b.id ?? `${b.topik_kod}-${b.bahagian_no}`}
                  className="rounded-3xl bg-card p-6 shadow-card"
                  style={{ border: "2px solid #E8F5EE" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-extrabold shadow-soft"
                      style={{ backgroundColor: HIJAU, color: "#FFFFFF" }}
                    >
                      {b.bahagian_no}
                    </div>
                    <h2 className="font-display text-xl font-extrabold" style={{ color: HIJAU }}>
                      {b.bahagian_nama}
                    </h2>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <Markdown options={mdOptions}>{b.kandungan ?? ""}</Markdown>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
