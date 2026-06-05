import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PenLine, Send, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/latihan")({
  head: () => ({ meta: [{ title: "Latihan Bertulis — Kalifah.my" }] }),
  ssr: false,
  component: LatihanSubjekPage,
});

type Soalan = { soalan: string; jawapan: string; petunjuk?: string };

const BANK: Record<string, Soalan[]> = {
  "1:matematik": [
    { soalan: "Kirakan: 2 + 3 = ___", jawapan: "5" },
    { soalan: "Kirakan: 9 - 4 = ___", jawapan: "5" },
    { soalan: "Kirakan: 6 + 7 = ___", jawapan: "13" },
    { soalan: "Selesaikan: 15 - 8 = ___", jawapan: "7" },
    { soalan: "Siti ada 4 guli, Abu ada 5 guli. Berapa jumlah guli mereka?", jawapan: "9" },
    { soalan: "Dalam bakul ada 10 oren. 3 dimakan. Berapa tinggal?", jawapan: "7" },
    { soalan: "Isi tempat kosong: 1, 2, 3, ___, 5", jawapan: "4" },
    { soalan: "Isi tempat kosong: 10, ___, 12, 13", jawapan: "11" },
  ],
  "1:bahasa-melayu": [
    { soalan: "Ejakan perkataan untuk gambar 🐘.", jawapan: "gajah", petunjuk: "haiwan besar berbelalai" },
    { soalan: "Ejakan perkataan untuk gambar 🍎.", jawapan: "epal", petunjuk: "buah berwarna merah" },
    { soalan: "Ejakan perkataan untuk gambar 🌙.", jawapan: "bulan", petunjuk: "cahaya pada malam hari" },
    { soalan: "Ejakan perkataan untuk gambar ⭐.", jawapan: "bintang", petunjuk: "ada di langit malam" },
    { soalan: "Ejakan perkataan untuk gambar 🐟.", jawapan: "ikan", petunjuk: "haiwan dalam air" },
    { soalan: "Lengkapkan: 'Ibu memasak ___.'", jawapan: "nasi", petunjuk: "apa yang dimasak ibu" },
    { soalan: "Lengkapkan: 'Langit berwarna ___.'", jawapan: "biru", petunjuk: "tengok langit siang" },
    { soalan: "Apakah lawan kata 'panas'?", jawapan: "sejuk", petunjuk: "lawan kepada panas" },
    { soalan: "Apakah lawan kata 'siang'?", jawapan: "malam", petunjuk: "masa yang gelap" },
    { soalan: "Tulis satu ayat mudah tentang diri anda.", jawapan: "nama saya", petunjuk: "cerita tentang diri sendiri" },
  ],
};

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function LatihanSubjekPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/latihan" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

  const soalanList = useMemo(() => BANK[`${darjahId}:${subjekId}`] ?? [], [darjahId, subjekId]);
  const [idx, setIdx] = useState(0);
  const [jwp, setJwp] = useState("");
  const [semak, setSemak] = useState<null | boolean>(null);
  const [bintang, setBintang] = useState(0);
  const [habis, setHabis] = useState(false);

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

  if (!darjah || !subjek || soalanList.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Latihan belum tersedia</h1>
          <Link to="/darjah/$darjahId/$subjekId" params={{ darjahId, subjekId }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  const soalan = soalanList[idx];

  function semakJawapan() {
    const betul = normalize(jwp) === normalize(soalan.jawapan);
    setSemak(betul);
    if (betul) setBintang((b) => b + 1);
  }

  function seterusnya() {
    if (idx + 1 >= soalanList.length) {
      setHabis(true);
    } else {
      setIdx(idx + 1);
      setJwp("");
      setSemak(null);
    }
  }

  function ulang() {
    setIdx(0);
    setJwp("");
    setSemak(null);
    setBintang(0);
    setHabis(false);
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">Latihan Bertulis</h1>
            <p className="text-sm text-muted-foreground">{darjah.label} • {subjek.title}</p>
          </div>
        </div>

        {!habis ? (
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-xs font-bold text-muted-foreground">
              Soalan {idx + 1} / {soalanList.length}
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground">{soalan.soalan}</h2>

            <input
              value={jwp}
              onChange={(e) => setJwp(e.target.value)}
              disabled={semak !== null}
              placeholder="Tulis jawapan kamu..."
              className="mt-5 w-full rounded-2xl border-2 border-input bg-background p-4 font-display text-xl font-extrabold text-foreground outline-none transition focus:border-primary disabled:opacity-70"
            />

            {semak === null ? (
              <button
                onClick={semakJawapan}
                disabled={jwp.trim().length === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" /> Semak Jawapan
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                <div
                  className={`rounded-2xl p-4 text-center font-display text-lg font-extrabold ${
                    semak ? "bg-secondary text-primary" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {semak ? "Betul! 🎉" : `Jawapan betul: ${soalan.jawapan}`}
                </div>
                <button
                  onClick={seterusnya}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft"
                >
                  {idx + 1 >= soalanList.length ? "Lihat Keputusan" : "Soalan Seterusnya →"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
            <Sparkles className="mx-auto h-12 w-12 text-gold" />
            <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Syabas! 🎉</h2>
            <p className="mt-2 text-muted-foreground">
              Kamu jawab betul <span className="font-extrabold text-primary">{bintang}</span> daripada {soalanList.length} soalan.
            </p>
            <div className="mt-4 flex justify-center">
              <StarReward earned={Math.min(3, Math.ceil((bintang / soalanList.length) * 3))} />
            </div>
            <button
              onClick={ulang}
              className="mt-5 rounded-full bg-card px-5 py-2 font-display font-extrabold text-foreground shadow-soft"
            >
              Cuba Lagi
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
