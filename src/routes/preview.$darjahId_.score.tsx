import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, BookOpen, Trophy, Gamepad2, BarChart3, ArrowRight } from "lucide-react";
import { getDarjah } from "@/lib/curriculum";

export const Route = createFileRoute("/preview/$darjahId_/score")({
  head: () => ({ meta: [{ title: "Keputusan — Kalifah.my" }] }),
  ssr: false,
  component: PreviewScorePage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

function PreviewScorePage() {
  const { darjahId } = useParams({ from: "/preview/$darjahId_/score" });
  const navigate = useNavigate();
  const darjah = getDarjah(darjahId);

  const [nama, setNama] = useState("");
  const [skor, setSkor] = useState(0);
  const [total, setTotal] = useState(3);

  useEffect(() => {
    const n = window.localStorage.getItem("previewNamaAnak");
    const s = window.localStorage.getItem("previewScore");
    const t = window.localStorage.getItem("previewTotal");
    if (!n || s === null) {
      navigate({ to: "/preview/nama" });
      return;
    }
    setNama(n);
    setSkor(Number(s));
    setTotal(Number(t ?? 3));
  }, [navigate]);

  if (!nama) return null;

  const ayat =
    skor >= 3
      ? `${nama} memang bijak! Jangan biar potensi dia terbazir.`
      : skor === 2
        ? `${nama} hampir perfect! Dengan latihan konsisten, dia boleh capai lebih.`
        : `${nama} baru bermula — dan setiap juara pun bermula dari sini.`;

  const darjahLabel = darjah?.label ?? `Darjah ${darjahId}`;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        {/* Score header */}
        <div className="rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-10">
          <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Tahniah {nama}! 🌟
          </h1>
          <div className="mt-5 flex items-center justify-center gap-2">
            {Array.from({ length: total }).map((_, idx) => (
              <Star
                key={idx}
                className="h-10 w-10"
                style={{
                  color: idx < skor ? EMAS : "#e5e7eb",
                  fill: idx < skor ? EMAS : "#e5e7eb",
                }}
              />
            ))}
          </div>
          <p className="mt-4 font-display text-2xl font-extrabold" style={{ color: HIJAU }}>
            {skor} daripada {total} betul
          </p>
          <p className="mt-3 text-base text-muted-foreground">{ayat}</p>
        </div>

        {/* Yang menanti */}
        <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
          <h2 className="font-display text-xl font-extrabold text-foreground">
            Yang menanti {nama}:
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Item icon={<BookOpen className="h-5 w-5" />} text={`Puluhan topik dalam ${darjahLabel}`} />
            <Item icon={<Trophy className="h-5 w-5" />} text="Lencana & Sijil Cemerlang" />
            <Item icon={<Gamepad2 className="h-5 w-5" />} text="Game pembelajaran interaktif" />
            <Item icon={<BarChart3 className="h-5 w-5" />} text="Laporan progress untuk ibu bapa" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Link
            to="/harga"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-display text-base font-extrabold text-white shadow-gold transition hover:-translate-y-0.5 md:text-lg"
            style={{ backgroundColor: EMAS }}
          >
            Mulakan Perjalanan {nama} Sekarang <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Darjah pilihan: <b>{darjahLabel}</b>
          </p>
        </div>
      </div>
    </main>
  );
}

function Item({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: `${HIJAU}10` }}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: HIJAU }}>
        {icon}
      </span>
      <span className="font-display text-sm font-extrabold text-foreground">{text}</span>
    </div>
  );
}
