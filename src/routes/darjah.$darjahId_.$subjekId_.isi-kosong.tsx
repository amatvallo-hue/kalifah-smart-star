import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, X, Lightbulb, PencilLine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";
import { tambahMata } from "@/lib/tambah-mata";
import { usePoints } from "@/hooks/use-points";
import { gradeAnswer, type SoalanIsiKosong as SoalanGrade } from "@/lib/gradeIsiKosong";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/isi-kosong")({
  head: () => ({ meta: [{ title: "Isi Tempat Kosong — Kalifah.my" }] }),
  ssr: false,
  component: IsiKosongPage,
});

interface Soalan extends SoalanGrade {
  id: string;
  topik_kod: string;
  topik_nama: string;
  no_soalan: number;
  soalan: string;
  petunjuk: string | null;
}

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const HIJAU_LEMBUT = "#d1fae5";
const KUNING_LEMBUT = "#fef3c7";
const SOALAN_PER_SESI = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderSoalanDenganKosong(teks: string) {
  // Papar "___" sebagai underline yang menonjol
  const parts = teks.split(/(_{2,})/g);
  return parts.map((p, i) =>
    /^_{2,}$/.test(p) ? (
      <span
        key={i}
        className="mx-1 inline-block min-w-[80px] border-b-4 align-baseline"
        style={{ borderColor: EMAS, height: "1.2em" }}
      />
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function IsiKosongPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/isi-kosong" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}` };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId };
  const mata = usePoints();
  const darjahNum = Number(darjahId);
  const isKecil = darjahNum <= 3;
  const showBahasaToggle = subjekId === "sains" || subjekId === "matematik";

  const [bahasa, setBahasa] = useState<"bm" | "en" | null>(showBahasaToggle ? null : "bm");
  const subjekQuery =
    subjekId === "sains"
      ? bahasa === "en"
        ? "sains-en"
        : "sains"
      : subjekId === "matematik"
        ? bahasa === "en"
          ? "matematik-en"
          : "matematik"
        : subjekId;

  const [bank, setBank] = useState<Soalan[]>([]);
  const [topikList, setTopikList] = useState<{ kod: string; nama: string; bilangan: number }[]>([]);
  const [topikKod, setTopikKod] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [cursor, setCursor] = useState(0);
  const [input, setInput] = useState("");
  const [hasil, setHasil] = useState<{ betul: boolean; feedback: string } | null>(null);
  const [tunjukPetunjuk, setTunjukPetunjuk] = useState(false);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [mulaMasa, setMulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Fetch senarai topik yang ada soalan
  useEffect(() => {
    if (showBahasaToggle && !bahasa) {
      setTopikList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setFetching(true);
      setErrMsg(null);
      const { data, error } = await supabase
        .from("soalan_isi_kosong")
        .select("topik_kod, topik_nama")
        .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
        .eq("subjek", subjekQuery);
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setFetching(false);
        return;
      }
      const agg = new Map<string, { kod: string; nama: string; bilangan: number }>();
      (data ?? []).forEach((r: any) => {
        const kod = String(r.topik_kod ?? "");
        const nama = String(r.topik_nama ?? kod);
        const cur = agg.get(kod);
        if (cur) cur.bilangan += 1;
        else agg.set(kod, { kod, nama, bilangan: 1 });
      });
      setTopikList(Array.from(agg.values()).sort((a, b) => a.nama.localeCompare(b.nama)));
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahId, subjekId, subjekQuery, darjahNum, showBahasaToggle, bahasa]);

  async function mulaSesi(kod: string) {
    setFetching(true);
    setErrMsg(null);
    const { data, error } = await supabase
      .from("soalan_isi_kosong")
      .select("id, topik_kod, topik_nama, no_soalan, soalan, jawapan_utama, jawapan_alternatif, keyword_haram, feedback_betul, feedback_salah, petunjuk")
      .eq("darjah", Number.isFinite(darjahNum) ? darjahNum : darjahId)
      .eq("subjek", subjekQuery)
      .eq("topik_kod", kod);
    if (error) {
      setErrMsg(error.message);
      setFetching(false);
      return;
    }
    const rows = (data ?? []).map((r: any) => ({
      id: r.id as string,
      topik_kod: r.topik_kod as string,
      topik_nama: r.topik_nama as string,
      no_soalan: r.no_soalan as number,
      soalan: r.soalan as string,
      jawapan_utama: r.jawapan_utama as string,
      jawapan_alternatif: (r.jawapan_alternatif ?? r.jawapan_utama) as string,
      keyword_haram: (r.keyword_haram ?? null) as string | null,
      feedback_betul: r.feedback_betul as string,
      feedback_salah: r.feedback_salah as string,
      petunjuk: (r.petunjuk ?? null) as string | null,
    })) as Soalan[];
    const dipilih = shuffle(rows).slice(0, SOALAN_PER_SESI);
    setBank(dipilih);
    setTopikKod(kod);
    setCursor(0);
    setInput("");
    setHasil(null);
    setTunjukPetunjuk(false);
    setBetul(0);
    setSalah(0);
    setSelesai(false);
    setMulaMasa(Date.now());
    setStarted(true);
    setFetching(false);
  }

  const soalan = bank[cursor] ?? null;

  function semak() {
    if (!soalan || hasil) return;
    const res = gradeAnswer(input, soalan);
    setHasil(res);
    if (res.betul) {
      setBetul((b) => b + 1);
      if (user) {
        tambahMata({
          userId: user.id,
          mata: 1,
          sumber: "isi-kosong",
          darjah: darjahId,
          subjek: subjekId,
        });
      }
    } else {
      setSalah((s) => s + 1);
    }
  }

  function seterusnya() {
    if (cursor + 1 >= bank.length) {
      // Selesai — simpan progress
      const masaSec = Math.round((Date.now() - mulaMasa) / 1000);
      const topikNama = bank[0]?.topik_nama ?? topikKod;
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "isi-kosong",
        markah: betul,
        jumlahSoalan: bank.length,
        masaAmbil: masaSec,
        topik: topikNama,
      });
      setSelesai(true);
      return;
    }
    setCursor((c) => c + 1);
    setInput("");
    setHasil(null);
    setTunjukPetunjuk(false);
  }

  function ulangSesi() {
    if (topikKod) mulaSesi(topikKod);
  }

  function kembaliPilih() {
    setStarted(false);
    setSelesai(false);
    setBank([]);
    setTopikKod("");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const fontKlas = isKecil ? "text-xl md:text-2xl" : "text-lg md:text-xl";

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
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Aktiviti
        </Link>

        {/* HERO */}
        <section
          className="mt-4 rounded-[2rem] p-6 shadow-card md:p-8"
          style={{ background: `linear-gradient(135deg, ${HIJAU}15, ${EMAS}20)` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft" style={{ color: HIJAU }}>
              {darjah.label}
            </span>
            <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft" style={{ color: EMAS }}>
              {subjek.title}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Isi Tempat <span style={{ color: HIJAU }}>Kosong</span>
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Taip jawapan sendiri — tiada pilihan A/B/C/D. Cuba fikir dulu, kemudian semak!
          </p>
        </section>

        {errMsg && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Ralat: {errMsg}
          </div>
        )}

        {/* PILIH BAHASA */}
        {!started && showBahasaToggle && !bahasa && (
          <section className="mt-6 rounded-3xl bg-card p-6 text-center shadow-card md:p-8">
            <h2 className="font-display text-2xl font-extrabold text-foreground">Pilih Bahasa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih bahasa untuk Isi Tempat Kosong {subjek.title} {darjah.label}.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setBahasa("bm")}
                className="rounded-3xl border-2 px-6 py-8 font-display text-xl font-extrabold shadow-soft transition hover:-translate-y-1"
                style={{ borderColor: `${HIJAU}44`, color: HIJAU, backgroundColor: `${HIJAU}10` }}
              >
                🇲🇾 Bahasa Melayu
              </button>
              <button
                onClick={() => setBahasa("en")}
                className="rounded-3xl border-2 px-6 py-8 font-display text-xl font-extrabold shadow-soft transition hover:-translate-y-1"
                style={{ borderColor: `${EMAS}44`, color: EMAS, backgroundColor: `${EMAS}10` }}
              >
                🇬🇧 English
              </button>
            </div>
          </section>
        )}

        {/* PICKER TOPIK */}
        {!started && (!showBahasaToggle || bahasa) && (
          <section className="mt-6">
            {fetching ? (
              <p className="text-center text-muted-foreground">Memuatkan senarai topik...</p>
            ) : topikList.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card p-8 text-center">
                <PencilLine className="mx-auto h-12 w-12" style={{ color: EMAS }} />
                <h3 className="mt-3 font-display text-xl font-extrabold">Belum ada soalan</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Soalan Isi Tempat Kosong untuk {subjek.title} ({darjah.label}) sedang disediakan.
                </p>
              </div>
            ) : (
              <>

                {showBahasaToggle && bahasa && (
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 font-display text-xs font-extrabold text-white"
                      style={{ backgroundColor: bahasa === "en" ? EMAS : HIJAU }}
                    >
                      {bahasa === "en" ? "🇬🇧 English" : "🇲🇾 Bahasa Melayu"}
                    </span>
                    <button
                      onClick={() => setBahasa(null)}
                      className="text-xs font-bold text-muted-foreground underline hover:text-primary"
                    >
                      Tukar bahasa
                    </button>
                  </div>
                )}
                <h2 className="font-display text-xl font-extrabold text-foreground">Pilih Topik</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {topikList.map((t) => (
                    <button
                      key={t.kod}
                      onClick={() => mulaSesi(t.kod)}
                      className="group flex items-center justify-between gap-4 rounded-2xl border-2 bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
                      style={{ borderColor: `${HIJAU}30` }}
                    >
                      <div>
                        <h3 className="font-display text-lg font-extrabold text-foreground">{t.nama}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.bilangan} soalan tersedia</p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-4 py-2 font-display text-sm font-extrabold text-white shadow-soft transition group-hover:translate-x-1"
                        style={{ backgroundColor: HIJAU }}
                      >
                        Mula →
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* RINGKASAN SELESAI */}
        {started && selesai && (
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
              <span className="font-extrabold" style={{ color: HIJAU }}>
                {betul}/{bank.length}
              </span>{" "}
              betul.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={ulangSesi}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
                style={{ backgroundColor: HIJAU }}
              >
                Cuba Lagi
              </button>
              <button
                onClick={kembaliPilih}
                className="rounded-full bg-secondary px-6 py-3 font-display font-extrabold text-foreground shadow-soft"
              >
                Pilih Topik Lain
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
                style={{ backgroundColor: EMAS }}
              >
                Aktiviti Lain
              </Link>
            </div>
          </section>
        )}

        {/* SESI AKTIF */}
        {started && !selesai && soalan && (
          <section className="mt-6">
            {/* Skor bar */}
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

            {/* Kad soalan */}
            <div className="mt-4 rounded-3xl bg-card p-6 shadow-card md:p-8">
              <p className={`font-display font-bold text-foreground ${fontKlas}`}>
                {renderSoalanDenganKosong(soalan.soalan)}
              </p>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (hasil) seterusnya();
                    else semak();
                  }
                }}
                disabled={!!hasil}
                placeholder="Taip jawapan di sini..."
                className={`mt-6 w-full rounded-2xl border-2 bg-background px-5 py-4 font-display font-bold text-foreground outline-none transition focus:border-current disabled:opacity-70 ${fontKlas}`}
                style={{ borderColor: hasil ? "transparent" : `${HIJAU}60` }}
                autoFocus
              />

              {/* Feedback */}
              {hasil && (
                <div
                  className="mt-4 rounded-2xl p-4"
                  style={{ backgroundColor: hasil.betul ? HIJAU_LEMBUT : KUNING_LEMBUT }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: hasil.betul ? HIJAU : EMAS }}
                    >
                      {hasil.betul ? <Check className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-display font-extrabold ${isKecil ? "text-lg" : "text-base"}`}
                        style={{ color: hasil.betul ? HIJAU : "#92400e" }}
                      >
                        {hasil.betul ? "Betul!" : "Cuba lagi lain kali!"}
                      </p>
                      <p className={`mt-1 text-foreground ${isKecil ? "text-base" : "text-sm"}`}>
                        {hasil.feedback}
                      </p>
                      {!hasil.betul && (
                        <p className={`mt-2 font-bold ${isKecil ? "text-base" : "text-sm"}`}>
                          Jawapan sebenar:{" "}
                          <span style={{ color: HIJAU }}>{soalan.jawapan_utama}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Petunjuk */}
              {!hasil && soalan.petunjuk && (
                <div className="mt-4">
                  {tunjukPetunjuk ? (
                    <div className="rounded-2xl border-2 border-dashed p-4" style={{ borderColor: `${EMAS}80`, backgroundColor: `${EMAS}10` }}>
                      <p className="flex items-start gap-2 text-sm font-bold text-foreground">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color: EMAS }} />
                        {soalan.petunjuk}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setTunjukPetunjuk(true)}
                      className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition hover:opacity-80"
                      style={{ borderColor: EMAS, color: EMAS }}
                    >
                      💡 Nak Petunjuk?
                    </button>
                  )}
                </div>
              )}

              {/* Butang */}
              <div className="mt-6 flex flex-wrap gap-3">
                {!hasil ? (
                  <button
                    onClick={semak}
                    disabled={!input.trim()}
                    className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft disabled:opacity-50"
                    style={{ backgroundColor: HIJAU }}
                  >
                    Semak Jawapan
                  </button>
                ) : (
                  <button
                    onClick={seterusnya}
                    className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
                    style={{ backgroundColor: HIJAU }}
                  >
                    {cursor + 1 >= bank.length ? "Tamat" : "Seterusnya →"}
                  </button>
                )}
                <button
                  onClick={kembaliPilih}
                  className="rounded-full bg-secondary px-6 py-3 font-display font-extrabold text-foreground shadow-soft"
                >
                  Berhenti
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
