import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/preview/nama")({
  head: () => ({ meta: [{ title: "Cuba Percuma — Kalifah.my" }] }),
  ssr: false,
  component: PreviewNamaPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

function PreviewNamaPage() {
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [darjahId, setDarjahId] = useState<string | null>(null);

  useEffect(() => {
    const d = window.localStorage.getItem("previewDarjah");
    if (!d) {
      navigate({ to: "/pilih-darjah" });
      return;
    }
    setDarjahId(d);
    const existing = window.localStorage.getItem("previewNamaAnak");
    if (existing) setNama(existing);
  }, [navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nama.trim();
    if (trimmed.length < 2) {
      setErr("Sila masukkan nama yang sah");
      return;
    }
    // Only letters (incl. accents) and spaces, apostrophe, hyphen
    if (!/^[\p{L}][\p{L}\s'’-]*$/u.test(trimmed)) {
      setErr("Sila masukkan nama yang sah");
      return;
    }
    setErr(null);
    window.localStorage.setItem("previewNamaAnak", trimmed);
    navigate({ to: "/preview/$darjahId", params: { darjahId: darjahId ?? "1" } });
  }

  if (!darjahId) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl bg-gradient-hero p-8 shadow-card md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft" style={{ color: HIJAU }}>
            <Sparkles className="h-3.5 w-3.5" /> Cuba percuma
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Siapa nama anak awak?
          </h1>
          <p className="mt-2 text-muted-foreground">Kami nak kenal anak awak dulu 😊</p>

          <form onSubmit={submit} className="mt-6">
            <input
              type="text"
              value={nama}
              onChange={(e) => { setNama(e.target.value); if (err) setErr(null); }}
              placeholder="Contoh: Ahlaa Sumayyah"
              autoFocus
              maxLength={60}
              className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 font-display text-base shadow-soft focus:outline-none focus:ring-2"
              style={{ borderColor: err ? "#dc2626" : `${HIJAU}55` }}
            />
            {err && <p className="mt-2 text-sm font-bold text-destructive">{err}</p>}

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
              style={{ backgroundColor: HIJAU }}
            >
              Cuba Sekarang <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
