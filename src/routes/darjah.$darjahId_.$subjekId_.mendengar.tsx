import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, X, Headphones, Play, RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress, rekodJawapan } from "@/lib/progress";
import { tambahMata } from "@/lib/tambah-mata";
import { usePoints } from "@/hooks/use-points";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/mendengar")({
  head: () => ({ meta: [{ title: "Latihan Mendengar — Kalifah.my" }] }),
  ssr: false,
  component: MendengarPage,
});

const BIRU = "#0284c7";
const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

interface Soalan {
  id: string;
  no_soalan: number;
  audio_url: string;
  soalan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  jawapan: string;
  penjelasan: string | null;
  intro_audio_url: string | null;
  outro_audio_url: string | null;
}

type Fasa = "mula" | "intro" | "soalan" | "outro" | "selesai";

const SUBJEK_DB = "Bahasa Inggeris";

function MendengarPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/mendengar" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}` };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId };
  const mata = usePoints();
  const darjahNum = Number(darjahId);

  const [bank, setBank] = useState<Soalan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [fasa, setFasa] = useState<Fasa>("mula");
  const [cursor, setCursor] = useState(0);
  const [pilih, setPilih] = useState<string | null>(null);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [mulaMasa, setMulaMasa] = useState(() => Date.now());
  const [mulaSoalan, setMulaSoalan] = useState(() => Date.now());
  const [sesiId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("soalan_pendengaran")
        .select("id, no_soalan, audio_url, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan, penjelasan, intro_audio_url, outro_audio_url")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", SUBJEK_DB)
        .order("no_soalan", { ascending: true });
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setFetching(false);
        return;
      }
      setBank((data ?? []) as Soalan[]);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahId, darjahNum]);

  const soalan = bank[cursor] ?? null;
  const introUrl = bank[0]?.intro_audio_url ?? null;
  const outroUrl = bank[0]?.outro_audio_url ?? null;

  function playSrc(url: string | null | undefined) {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {});
    }
  }

  function mula() {
    setFasa("intro");
    setCursor(0);
    setPilih(null);
    setBetul(0);
    setSalah(0);
    setMulaMasa(Date.now());
    setMulaSoalan(Date.now());
    if (introUrl) {
      playSrc(introUrl);
    } else {
      setFasa("soalan");
      // autoplay first question audio
      setTimeout(() => playSrc(bank[0]?.audio_url), 50);
    }
  }

  function introTamat() {
    setFasa("soalan");
    setMulaSoalan(Date.now());
    setTimeout(() => playSrc(bank[0]?.audio_url), 50);
  }

  function pilihJawapan(huruf: string) {
    if (!soalan || pilih) return;
    setPilih(huruf);
    const isBetul = huruf.toUpperCase() === soalan.jawapan.toUpperCase();
    const masaSoalanSaat = Math.max(0, Math.round((Date.now() - mulaSoalan) / 1000));
    rekodJawapan({
      sesiId,
      darjah: darjahNum,
      subjek: subjekId,
      aktiviti: "mendengar",
      topik: "Listening Beta Test",
      soalanRef: soalan.id,
      soalanTeks: soalan.soalan,
      jawapanMurid: huruf,
      jawapanBetul: soalan.jawapan,
      betul: isBetul,
      masaSoalanSaat,
    });
    if (isBetul) {
      setBetul((b) => b + 1);
      if (user) {
        tambahMata({ userId: user.id, mata: 1, sumber: "mendengar", darjah: darjahId, subjek: subjekId });
      }
    } else {
      setSalah((s) => s + 1);
    }
  }

  function seterusnya() {
    if (cursor + 1 >= bank.length) {
      const masaSec = Math.round((Date.now() - mulaMasa) / 1000);
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "mendengar",
        markah: betul,
        jumlahSoalan: bank.length,
        masaAmbil: masaSec,
        topik: "Listening Beta Test",
      });
      if (outroUrl) {
        setFasa("outro");
        playSrc(outroUrl);
      } else {
        setFasa("selesai");
      }
      return;
    }
    const next = cursor + 1;
    setCursor(next);
    setPilih(null);
    setMulaSoalan(Date.now());
    setTimeout(() => playSrc(bank[next]?.audio_url), 50);
  }

  function outroTamat() {
    setFasa("selesai");
  }

  function ulangSesi() {
    if (audioRef.current) audioRef.current.pause();
    mula();
  }

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
      <SiteHeader stars={mata} onLogout={handleLogout} />
      <audio
        ref={audioRef}
        onEnded={() => {
          if (fasa === "intro") introTamat();
          else if (fasa === "outro") outroTamat();
        }}
        hidden
      />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
          style={{ color: BIRU }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Aktiviti
        </Link>

        {/* HERO */}
        <section
          className="mt-4 rounded-[2rem] p-6 shadow-card md:p-8"
          style={{ background: `linear-gradient(135deg, ${BIRU}15, ${HIJAU}15)` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft"
              style={{ color: HIJAU }}
            >
              {darjah.label}
            </span>
            <span
              className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft"
              style={{ color: BIRU }}
            >
              {subjek.title}
            </span>
            <span
              className="rounded-full px-3 py-1 font-display text-[10px] font-extrabold text-white shadow-soft"
              style={{ backgroundColor: EMAS }}
            >
              BETA
            </span>
          </div>
          <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            <Headphones className="h-8 w-8" style={{ color: BIRU }} />
            Latihan <span style={{ color: BIRU }}>Mendengar</span>
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Dengar audio, baca soalan, pilih jawapan. Boleh ulang audio bila-bila!
          </p>
        </section>

        {errMsg && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Ralat: {errMsg}
          </div>
        )}

        {fetching && (
          <p className="mt-8 text-center text-muted-foreground">Memuatkan soalan...</p>
        )}

        {!fetching && bank.length === 0 && !errMsg && (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-border/60 bg-card p-8 text-center">
            <Headphones className="mx-auto h-12 w-12" style={{ color: BIRU }} />
            <h3 className="mt-3 font-display text-xl font-extrabold">Belum ada soalan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Latihan Mendengar untuk {subjek.title} ({darjah.label}) sedang disediakan.
            </p>
          </div>
        )}

        {/* MULA */}
        {!fetching && bank.length > 0 && fasa === "mula" && (
          <section className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
            <div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: `${BIRU}20` }}
            >
              <Headphones className="h-12 w-12" style={{ color: BIRU }} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">Sedia untuk mula?</h2>
            <p className="mt-2 text-muted-foreground">
              {bank.length} soalan • Pakai fon kepala untuk pengalaman terbaik.
            </p>
            <button
              onClick={mula}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-8 py-4 font-display text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
              style={{ backgroundColor: BIRU }}
            >
              <Play className="h-5 w-5" /> Mula
            </button>
          </section>
        )}

        {/* INTRO */}
        {fasa === "intro" && (
          <section className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
            <div
              className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full"
              style={{ backgroundColor: `${BIRU}20` }}
            >
              <Headphones className="h-10 w-10" style={{ color: BIRU }} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">Mendengar arahan…</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sila dengar sehingga tamat.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => playSrc(introUrl)}
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-display font-extrabold text-foreground shadow-soft"
              >
                <RotateCcw className="h-4 w-4" /> Ulang
              </button>
              <button
                onClick={introTamat}
                className="rounded-full px-6 py-2 font-display font-extrabold text-white shadow-soft"
                style={{ backgroundColor: BIRU }}
              >
                Langkau →
              </button>
            </div>
          </section>
        )}

        {/* SOALAN */}
        {fasa === "soalan" && soalan && (
          <section className="mt-6">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-card">
              <div className="text-sm font-bold text-muted-foreground">
                Soalan {cursor + 1} / {bank.length}
              </div>
              <div className="flex gap-3 text-sm font-bold">
                <span className="inline-flex items-center gap-1" style={{ color: HIJAU }}>
                  <Check className="h-4 w-4" /> {betul}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <X className="h-4 w-4" /> {salah}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-card p-6 shadow-card md:p-8">
              {/* Audio controls */}
              <div
                className="flex flex-wrap items-center justify-center gap-3 rounded-2xl p-4"
                style={{ backgroundColor: `${BIRU}10` }}
              >
                <button
                  onClick={() => playSrc(soalan.audio_url)}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
                  style={{ backgroundColor: BIRU }}
                >
                  <Play className="h-5 w-5" /> Main Audio
                </button>
                <button
                  onClick={() => playSrc(soalan.audio_url)}
                  className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 font-display font-extrabold text-foreground shadow-soft"
                >
                  <RotateCcw className="h-4 w-4" /> Ulang
                </button>
              </div>

              <p className="mt-6 font-display text-xl font-bold text-foreground md:text-2xl">
                {soalan.soalan}
              </p>

              <div className="mt-4 grid gap-3">
                {(["A", "B", "C", "D"] as const).map((huruf) => {
                  const teks =
                    huruf === "A" ? soalan.pilihan_a : huruf === "B" ? soalan.pilihan_b : huruf === "C" ? soalan.pilihan_c : soalan.pilihan_d;
                  const sudahPilih = pilih !== null;
                  const iniPilihan = pilih === huruf;
                  const iniBetul = soalan.jawapan.toUpperCase() === huruf;
                  let cls = "border-border bg-card hover:border-primary/50";
                  if (sudahPilih) {
                    if (iniBetul) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
                    else if (iniPilihan) cls = "border-red-500 bg-red-50 dark:bg-red-950/30";
                    else cls = "border-border bg-card opacity-60";
                  }
                  return (
                    <button
                      key={huruf}
                      disabled={sudahPilih}
                      onClick={() => pilihJawapan(huruf)}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-bold text-foreground transition ${cls}`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-white"
                        style={{ backgroundColor: BIRU }}
                      >
                        {huruf}
                      </span>
                      <span className="flex-1">{teks}</span>
                      {sudahPilih && iniBetul && <Check className="h-5 w-5 text-emerald-600" />}
                      {sudahPilih && iniPilihan && !iniBetul && <X className="h-5 w-5 text-red-600" />}
                    </button>
                  );
                })}
              </div>

              {pilih !== null && (
                <div
                  className={`mt-5 rounded-2xl border-2 p-4 ${
                    pilih.toUpperCase() === soalan.jawapan.toUpperCase()
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-red-300 bg-red-50 dark:bg-red-950/30"
                  }`}
                >
                  <p className="font-display font-extrabold text-foreground">
                    {pilih.toUpperCase() === soalan.jawapan.toUpperCase() ? "✅ Betul!" : `❌ Jawapan sebenar: ${soalan.jawapan.toUpperCase()}`}
                  </p>
                  {soalan.penjelasan && (
                    <p className="mt-2 text-sm text-muted-foreground">{soalan.penjelasan}</p>
                  )}
                  <button
                    onClick={seterusnya}
                    className="mt-4 w-full rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
                    style={{ backgroundColor: BIRU }}
                  >
                    {cursor + 1 >= bank.length ? "Selesai →" : "Soalan Seterusnya →"}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* OUTRO */}
        {fasa === "outro" && (
          <section className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
            <div
              className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full"
              style={{ backgroundColor: `${HIJAU}20` }}
            >
              <Headphones className="h-10 w-10" style={{ color: HIJAU }} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">Terima kasih!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sedang mendengar mesej penutup…</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => playSrc(outroUrl)}
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-display font-extrabold text-foreground shadow-soft"
              >
                <RotateCcw className="h-4 w-4" /> Ulang
              </button>
              <button
                onClick={outroTamat}
                className="rounded-full px-6 py-2 font-display font-extrabold text-white shadow-soft"
                style={{ backgroundColor: HIJAU }}
              >
                Lihat Keputusan →
              </button>
            </div>
          </section>
        )}

        {/* SELESAI */}
        {fasa === "selesai" && (
          <section className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl"
              style={{ backgroundColor: `${EMAS}25` }}
            >
              🎉
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground">Syabas!</h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Kamu dapat{" "}
              <span className="font-extrabold" style={{ color: BIRU }}>
                {betul}/{bank.length}
              </span>{" "}
              betul.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={ulangSesi}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
                style={{ backgroundColor: BIRU }}
              >
                Cuba Lagi
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full bg-secondary px-6 py-3 font-display font-extrabold text-foreground shadow-soft"
              >
                Aktiviti Lain
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
