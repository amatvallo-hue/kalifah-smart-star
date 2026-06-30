import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { simpanProgress } from "@/lib/progress";
import { downloadSijil } from "@/lib/sijil";
import { simpanRekodSijil } from "@/lib/sijil-rekod";
import { useAuth } from "@/hooks/use-auth";
import { useAward } from "@/hooks/use-award";

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

interface Soalan {
  id: string;
  soalan: string;
  pilihan: string[];
  jawapan: number; // 0..3
  penjelasan?: string | null;
  topik: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function letterToIdx(l: string): number {
  return ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(l).toUpperCase()] ?? 0;
}

interface Props {
  darjahId: string;
  darjahLabel: string;
  subjekId: string;
  subjekTitle: string;
  subjekKod?: string; // kod dalam table kuiz_soalan, contoh "BM" atau "MT"
  showBahasaToggle?: boolean;
}

export function KuizBMTopik({ darjahId, darjahLabel, subjekId, subjekTitle, subjekKod = "BM", showBahasaToggle = false }: Props) {
  const darjahNum = Number(darjahId);
  const { user } = useAuth();
  const award = useAward();
  const profileName =
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : undefined);

  const [topicList, setTopicList] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [topik, setTopik] = useState<string>("");
  const [soalanList, setSoalanList] = useState<Soalan[]>([]);
  const [jawapanMurid, setJawapanMurid] = useState<(number | null)[]>([]);

  const [started, setStarted] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [i, setI] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [skor, setSkor] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [mulaMasa, setMulaMasa] = useState(() => Date.now());
  const [bahasa, setBahasa] = useState<"bm" | "en" | null>(null);
  const isEnglish = subjekKod === "Bahasa Inggeris";
  const effectiveSubjekKod = showBahasaToggle && bahasa ? (bahasa === "en" ? `${subjekKod}-EN` : subjekKod) : subjekKod;
  const en = (showBahasaToggle && bahasa === "en") || isEnglish;
  const tr = {
    pilihTopik: en ? "Choose Topic" : "Pilih Topik",
    soalanRawak: en ? "10 questions randomly selected for your chosen topic." : "10 soalan dipilih secara rawak untuk topik yang kamu pilih.",
    mula: en ? "Start" : "Mula",
    tukarBahasa: en ? "Change language" : "Tukar bahasa",
    seterusnya: en ? "Next Question →" : "Soalan Seterusnya →",
    lihatKeputusan: en ? "Finish" : "Selesai",
    betul: en ? "Great! Your answer is correct! 🎉" : "Syabas! Jawapan kamu betul! 🎉",
    salah: en ? "Almost there! Try the next question." : "Hampir betul! Cuba lagi pada soalan seterusnya.",
    skor: en ? "Score" : "Skor",
    soalan: en ? "Question" : "Soalan",
    memuatTopik: en ? "Loading topic list..." : "Memuatkan senarai topik...",
    tiadaTopik: en ? `No quiz topics yet for ${subjekTitle} (${darjahLabel}). Stay tuned!` : `Belum ada topik kuiz untuk ${subjekTitle} (${darjahLabel}). Nantikan!`,
    semakanJawapan: en ? "Answer Review" : "Semakan Jawapan",
    pilihTopikLain: en ? "Try Again" : "Cuba Lagi",
    kembali: en ? "Back to Activities" : "Kembali ke Aktiviti",
    tahniah: en ? "Well Done! 🎉" : "Tahniah! 🎉",
    topikLabel: en ? "Topic" : "Topik",
    skorKamu: en ? "Your score" : "Skor kamu",
    tiadaJawapan: en ? "(No answer selected)" : "(Tiada jawapan dipilih)",
    penjelasan: en ? "Explanation: " : "Penjelasan: ",
    pilihBahasa: en ? "Choose Language" : "Pilih Bahasa",
    pilihBahasaDesc: en ? `Choose a language for the ${subjekTitle} ${darjahLabel} quiz.` : `Pilih bahasa untuk kuiz ${subjekTitle} ${darjahLabel}.`,
    mengikutTopik: en ? "Quiz by Topic" : "Kuiz Mengikut Topik",
    muatTurunSijil: en ? "Download Certificate" : "Muat Turun Sijil",
  };

  // Fetch distinct topics for BM, this darjah
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTopics(true);
      setErrMsg(null);
      const { data, error } = await supabase
        .from("kuiz_soalan")
        .select("topik")
        .eq("darjah", darjahNum)
        .eq("subjek", effectiveSubjekKod)
        .not("penjelasan", "is", null)
        .neq("penjelasan", "");
      if (cancelled) return;
      if (error) {
        setErrMsg(error.message);
        setLoadingTopics(false);
        return;
      }
      const seen = new Set<string>();
      const ordered: string[] = [];
      for (const r of data ?? []) {
        const t = (r as any).topik as string | null;
        if (t && !seen.has(t)) {
          seen.add(t);
          ordered.push(t);
        }
      }
      setTopicList(ordered);
      setLoadingTopics(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [darjahNum, effectiveSubjekKod]);

  useEffect(() => {
    if (selesai && soalanList.length > 0) {
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "kuiz",
        markah: skor,
        jumlahSoalan: soalanList.length,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selesai]);

  // Auto-simpan rekod sijil bila 100% tanpa tunggu butang download
  useEffect(() => {
    if (selesai && skor === soalanList.length && soalanList.length > 0 && topik) {
      const nama = profileName ?? "Murid";
      simpanRekodSijil({
        namaPelajar: nama,
        subjek: subjekId,
        topik,
        darjah: darjahId,
        kodSijil: `KUIZ-${darjahId}-${subjekId}-${topik.replace(/\s+/g, "-")}-${Date.now()}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selesai]);


  async function mulaKuiz(pilihTopik: string) {
    setFetching(true);
    setErrMsg(null);
    const { data, error } = await supabase
      .from("kuiz_soalan")
      .select("id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan, penjelasan, topik")
      .eq("darjah", darjahNum)
      .eq("subjek", effectiveSubjekKod)
      .eq("topik", pilihTopik)
      .not("penjelasan", "is", null)
      .neq("penjelasan", "");
    if (error) {
      setErrMsg(error.message);
      setFetching(false);
      return;
    }
    const rows: Soalan[] = (data ?? []).map((r: any) => ({
      id: String(r.id),
      soalan: r.soalan as string,
      pilihan: [r.pilihan_a, r.pilihan_b, r.pilihan_c, r.pilihan_d] as string[],
      jawapan: letterToIdx(r.jawapan),
      penjelasan: (r.penjelasan ?? null) as string | null,
      topik: r.topik as string,
    }));
    const shuffled = shuffle(rows).slice(0, 10);
    if (shuffled.length === 0) {
      setErrMsg("Tiada soalan untuk topik ini.");
      setFetching(false);
      return;
    }
    setSoalanList(shuffled);
    setJawapanMurid(new Array(shuffled.length).fill(null));
    setTopik(pilihTopik);
    setStarted(true);
    setI(0);
    setPilih(null);
    setSkor(0);
    setSelesai(false);
    setMulaMasa(Date.now());
    setFetching(false);
  }

  function reset() {
    setStarted(false);
    setSelesai(false);
    setSoalanList([]);
    setJawapanMurid([]);
    setTopik("");
    setI(0);
    setPilih(null);
    setSkor(0);
  }

  function handlePilih(idx: number) {
    if (pilih !== null) return;
    setPilih(idx);
    setJawapanMurid((prev) => {
      const next = [...prev];
      next[i] = idx;
      return next;
    });
    if (idx === soalanList[i].jawapan) {
      setSkor((s) => s + 1);
      award({ sumber: "kuiz", darjah: darjahId, subjek: subjekId });
    }
  }

  function seterusnya() {
    if (i + 1 >= soalanList.length) setSelesai(true);
    else {
      setI(i + 1);
      setPilih(null);
    }
  }

  const backLink = (
    <Link
      to="/darjah/$darjahId/$subjekId"
      params={{ darjahId, subjekId }}
      className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" /> {tr.kembali}
    </Link>
  );

  const headerChips = (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft" style={{ color: HIJAU }}>
        {darjahLabel}
      </span>
      <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft" style={{ color: EMAS }}>
        {subjekTitle}
      </span>
      <span className="rounded-full px-4 py-1.5 font-display text-xs font-extrabold text-white shadow-soft" style={{ backgroundColor: HIJAU }}>
        {tr.mengikutTopik}
      </span>
    </div>
  );

  // 1) Language picker (for Matematik only)
  if (!started && showBahasaToggle && !bahasa) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {backLink}
        {headerChips}
        <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-10">
          <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
            {tr.pilihBahasa.split(" ")[0]} <span style={{ color: HIJAU }}>{tr.pilihBahasa.split(" ").slice(1).join(" ") || "Bahasa"}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tr.pilihBahasaDesc}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
        </div>
      </main>
    );
  }

  // 2) Topic picker
  if (!started) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {backLink}
        {headerChips}
        <div className="mt-6 rounded-3xl bg-gradient-hero p-8 shadow-card md:p-10">
          <h1 className="font-display text-3xl font-extrabold text-foreground md:text-4xl">
            <span style={{ color: HIJAU }}>{tr.pilihTopik}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tr.soalanRawak}
          </p>

          {showBahasaToggle && bahasa && (
            <div className="mt-4 flex items-center gap-2">
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
                {tr.tukarBahasa}
              </button>
            </div>
          )}

          {errMsg && (
            <div className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive">
              {errMsg}
            </div>
          )}

          <div className="mt-6">
            {loadingTopics ? (
              <p className="text-sm text-muted-foreground">{tr.memuatTopik}</p>
            ) : topicList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tr.tiadaTopik}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {topicList.map((t) => (
                  <button
                    key={t}
                    disabled={fetching}
                    onClick={() => mulaKuiz(t)}
                    className="group flex items-center gap-3 rounded-2xl border-2 bg-card px-4 py-4 text-left font-bold shadow-soft transition hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ borderColor: `${HIJAU}33` }}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: HIJAU }}
                    >
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <span className="flex-1 text-foreground">{t}</span>
                    <span className="font-display text-sm" style={{ color: EMAS }}>
                      {tr.mula} →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // 3) Results
  if (selesai) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {backLink}
        {headerChips}

        <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-10">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-gold"
            style={{ backgroundColor: EMAS }}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            {tr.tahniah}
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            {tr.topikLabel}: <span className="font-extrabold">{topik}</span>
          </p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: HIJAU }}>
            {tr.skorKamu}: {skor}/{soalanList.length}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
              style={{ backgroundColor: HIJAU }}
            >
              {tr.pilihTopikLain}
            </button>
            <Link
              to="/darjah/$darjahId/$subjekId"
              params={{ darjahId, subjekId }}
              className="rounded-full bg-card px-6 py-3 font-display font-extrabold text-foreground shadow-soft transition hover:-translate-y-0.5"
            >
              {tr.kembali}
            </Link>
            {skor === soalanList.length && soalanList.length > 0 && (
              <button
                onClick={async () => {
                  const nama = profileName ?? "Murid";
                  // Simpan rekod sijil dulu (idempoten) — guna kod sedia ada kalau ada
                  const rekod = await simpanRekodSijil({
                    namaPelajar: nama,
                    subjek: subjekId,
                    topik,
                    darjah: darjahId,
                    kodSijil: `KUIZ-${darjahId}-${subjekId}-${topik.replace(/\s+/g, "-")}-${Date.now()}`,
                  });
                  const kodSijil = rekod?.kod_sijil ?? `KUIZ-${darjahId}-${subjekId}-${Date.now()}`;
                  const tarikh = rekod?.tarikh
                    ? new Date(rekod.tarikh + "T00:00:00").toLocaleDateString(en ? "en-GB" : "ms-MY")
                    : new Date().toLocaleDateString(en ? "en-GB" : "ms-MY");
                  await downloadSijil(
                    {
                      jenis: "kuiz-cemerlang",
                      namaMurid: nama,
                      tajuk: `${subjekTitle} — ${topik} — ${darjahLabel}`,
                      tarikh,
                      purata: 100,
                      kodSijil,
                    },
                    `sijil-kuiz-${subjekId}-${darjahId}-${topik.replace(/\s+/g, "-")}.pdf`,
                  );
                }}
                className="rounded-full bg-gradient-gold px-6 py-3 font-display font-extrabold text-gold-foreground shadow-gold transition hover:-translate-y-0.5"
                style={{ backgroundColor: EMAS, color: "white" }}
              >
                🏆 {tr.muatTurunSijil}
              </button>
            )}
          </div>
        </div>


        <div className="mt-6 space-y-4">
          <h3 className="font-display text-xl font-extrabold text-foreground">{tr.semakanJawapan}</h3>
          {soalanList.map((s, idx) => {
            const muridIdx = jawapanMurid[idx];
            const betul = muridIdx === s.jawapan;
            return (
              <div key={s.id} className="rounded-3xl bg-card p-5 shadow-card md:p-6">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-white"
                    style={{ backgroundColor: betul ? HIJAU : "#dc2626" }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-display font-extrabold text-foreground">{s.soalan}</p>
                    <div className="mt-3 grid gap-2">
                      {s.pilihan.map((p, pi) => {
                        const isJawapan = pi === s.jawapan;
                        const isPilihMurid = pi === muridIdx;
                        return (
                          <div
                            key={pi}
                            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold ${
                              isJawapan
                                ? "border-success bg-success/10 text-success"
                                : isPilihMurid
                                  ? "border-destructive bg-destructive/10 text-destructive"
                                  : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary font-display text-xs">
                              {String.fromCharCode(65 + pi)}
                            </span>
                            <span className="flex-1">{p}</span>
                            {isJawapan && <Check className="h-4 w-4" />}
                            {isPilihMurid && !isJawapan && <X className="h-4 w-4" />}
                          </div>
                        );
                      })}
                    </div>
                    {muridIdx === null && (
                      <p className="mt-2 text-xs italic text-muted-foreground">
                        {tr.tiadaJawapan}
                      </p>
                    )}
                    {s.penjelasan && s.penjelasan.trim().length > 0 && (
                      <div
                        className="mt-3 flex items-start gap-2 rounded-2xl p-3 text-sm"
                        style={{ backgroundColor: `${EMAS}15`, color: "#7a4a00" }}
                      >
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color: EMAS }} />
                        <div>
                          <span className="font-extrabold">💡 {tr.penjelasan}</span>
                          {s.penjelasan}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // 2) In-quiz
  const soalan = soalanList[i];
  const betul = pilih !== null && pilih === soalan.jawapan;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      {backLink}
      {headerChips}

      <div className="mt-5 flex items-center justify-between">
        <span className="font-display text-sm font-extrabold text-muted-foreground">
          {tr.soalan} {i + 1} / {soalanList.length} · {topik}
        </span>
        <span
          className="rounded-full px-3 py-1 font-display text-xs font-extrabold text-white"
          style={{ backgroundColor: EMAS }}
        >
          {tr.skor}: {skor}
        </span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((i + (pilih !== null ? 1 : 0)) / soalanList.length) * 100}%`,
            backgroundColor: HIJAU,
          }}
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
              {betul ? tr.betul : tr.salah}
            </div>
          </div>
        )}

        {pilih !== null && !betul && soalan.penjelasan && soalan.penjelasan.trim().length > 0 && (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-display font-extrabold">
                {en ? "Explanation" : "Penjelasan"}
              </p>
              <p className="mt-1 leading-relaxed">{soalan.penjelasan}</p>
            </div>
          </div>
        )}

        <button
          onClick={seterusnya}
          disabled={pilih === null}
          className="mt-6 w-full rounded-2xl px-6 py-4 font-display text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ backgroundColor: HIJAU }}
        >
          {i + 1 >= soalanList.length ? tr.lihatKeputusan : tr.seterusnya}
        </button>
      </div>
    </main>
  );
}
