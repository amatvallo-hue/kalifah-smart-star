import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { rekodJawapan } from "@/lib/progress";
import { tambahMata } from "@/lib/tambah-mata";
import { renderSoalanSvg } from "@/lib/render-soalan-svg";

export const Route = createFileRoute("/kali-test/belajar-untuk-saya")({
  head: () => ({
    meta: [
      { title: "Belajar Bersama KALI | Kalifah.my" },
      {
        name: "description",
        content: "KALI membimbing pembelajaran anak dengan memilih soalan yang paling sesuai berdasarkan prestasi semasa.",
      },
    ],
  }),
  ssr: false,
  component: KaliBelajarUntukSayaPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const JUMLAH_SOALAN_SESI = 10;

type Tier = "RED" | "YELLOW" | "GREEN" | "BLUE" | string;

interface KaliCadangan {
  micro_skill_id: string;
  micro_skill_kod: string;
  micro_skill_nama: string;
  tier: Tier;
  sebab: string;
  question_source_table: string;
  question_source_id: string;
}

interface Soalan {
  id: string;
  soalan: string;
  pilihan: string[];
  jawapan: number;
  feedback: (string | null)[];
  gambar?: string | null;
  svg_type?: string | null;
  svg_params?: any;
  rangsangan_teks?: string | null;
  rangsangan_gambar_id?: string | null;
  rangsangan_svg_type?: string | null;
  rangsangan_svg_params?: any;
}


function letterToIdx(l: string): number {
  return ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(l).toUpperCase()] ?? 0;
}

function KaliBelajarUntukSayaPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const mata = usePoints();

  const [cadangan, setCadangan] = useState<KaliCadangan | null>(null);
  const [soalan, setSoalan] = useState<Soalan | null>(null);
  const [fetching, setFetching] = useState(true);
  const [habisCadangan, setHabisCadangan] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [pilih, setPilih] = useState<number | null>(null);
  const [betul, setBetul] = useState(0);
  const [salah, setSalah] = useState(0);
  const [jawab, setJawab] = useState(0);
  const [mataSesi, setMataSesi] = useState(0);
  const [selesai, setSelesai] = useState(false);

  const [sesiId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  );
  const [mulaSoalan, setMulaSoalan] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const prevSkillRef = useRef<{ id: string; nama: string } | null>(null);
  const [skillUpdateMsg, setSkillUpdateMsg] = useState<string | null>(null);
  const [riwayatSkill, setRiwayatSkill] = useState<
    { micro_skill_id: string; micro_skill_nama: string; betul: boolean }[]
  >([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let seen: string | null = null;
    try {
      seen = localStorage.getItem("kali_welcome_seen_" + user.id);
    } catch {
      seen = "1";
    }
    if (!seen) {
      setShowWelcome(true);
      setFetching(false);
    }
    setWelcomeChecked(true);
  }, [user]);


  const muatSoalanSeterusnya = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    setErrMsg(null);
    setPilih(null);
    try {
      const { data, error } = await supabase.rpc("kali_next_best_question", {
        p_student_id: user.id,
      });
      if (error) throw error;

      const row = (Array.isArray(data) ? data[0] : data) as KaliCadangan | undefined;
      if (!row || !row.question_source_id) {
        setCadangan(null);
        setSoalan(null);
        setHabisCadangan(true);
        return;
      }

      const tbl = row.question_source_table;
      let q: any = null;
      let qErr: any = null;

      if (tbl === "soalan_latih_tubi") {
        const res = await supabase
          .from("soalan_latih_tubi")
          .select(
            "id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, feedback_a, feedback_b, feedback_c, feedback_d, gambar, svg_type, svg_params"
          )
          .eq("id", parseInt(row.question_source_id, 10))
          .maybeSingle();
        q = res.data;
        qErr = res.error;
      } else if (tbl === "kuiz_soalan") {
        const res = await supabase
          .from("kuiz_soalan")
          .select(
            "id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan, feedback_a, feedback_b, feedback_c, feedback_d, svg_type, svg_params"
          )
          .eq("id", row.question_source_id)
          .maybeSingle();
        q = res.data ? { ...(res.data as any), jawapan_betul: (res.data as any).jawapan } : null;
        qErr = res.error;
      } else if (tbl === "soalan_bergambar_rajah") {
        const res = await supabase
          .from("soalan_bergambar_rajah")
          .select(
            "id, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan_betul, feedback_a, feedback_b, feedback_c, feedback_d, rangsangan_teks, rangsangan_gambar_id, rangsangan_svg_type, rangsangan_svg_params"
          )
          .eq("id", row.question_source_id)
          .maybeSingle();
        q = res.data;
        qErr = res.error;
      } else {
        setCadangan(null);
        setSoalan(null);
        setHabisCadangan(true);
        setFetching(false);
        return;
      }

      if (qErr) throw qErr;
      if (!q) {
        setCadangan(null);
        setSoalan(null);
        setHabisCadangan(true);
        return;
      }

      setCadangan(row);
      const prevSkill = prevSkillRef.current;
      if (prevSkill && prevSkill.id !== row.micro_skill_id) {
        setSkillUpdateMsg(
          row.tier === "RED"
            ? `Nampaknya ${prevSkill.nama} masih agak mencabar. Mari kita cuba beberapa soalan lagi dengan cara yang berbeza.`
            : `Anda sudah menunjukkan peningkatan dalam ${prevSkill.nama}. Sekarang mari kita fokus kepada ${row.micro_skill_nama}.`
        );
      } else {
        setSkillUpdateMsg(null);
      }
      prevSkillRef.current = { id: row.micro_skill_id, nama: row.micro_skill_nama };

      setSoalan({
        id: String((q as any).id),
        soalan: (q as any).soalan,
        pilihan: [
          (q as any).pilihan_a,
          (q as any).pilihan_b,
          (q as any).pilihan_c,
          (q as any).pilihan_d,
        ],
        jawapan: letterToIdx((q as any).jawapan_betul),
        feedback: [
          (q as any).feedback_a ?? null,
          (q as any).feedback_b ?? null,
          (q as any).feedback_c ?? null,
          (q as any).feedback_d ?? null,
        ],
        gambar: (q as any).gambar ?? null,
        svg_type: (q as any).svg_type ?? null,
        svg_params: (q as any).svg_params ?? null,
        rangsangan_teks: (q as any).rangsangan_teks ?? null,
        rangsangan_gambar_id: (q as any).rangsangan_gambar_id ?? null,
        rangsangan_svg_type: (q as any).rangsangan_svg_type ?? null,
        rangsangan_svg_params: (q as any).rangsangan_svg_params ?? null,
      });
      setHabisCadangan(false);
      setMulaSoalan(Date.now());
    } catch (e: any) {
      console.error("KALI next question gagal:", e);
      setErrMsg(e?.message ?? "Ralat tidak diketahui");
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && welcomeChecked && !showWelcome) void muatSoalanSeterusnya();
  }, [user, welcomeChecked, showWelcome, muatSoalanSeterusnya]);


  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  const handlePilih = (idx: number) => {
    if (pilih !== null || !soalan || !cadangan) return;
    setPilih(idx);
    const isBetul = idx === soalan.jawapan;
    const huruf = ["A", "B", "C", "D"];
    const masaSoalanSaat = Math.max(0, Math.round((Date.now() - mulaSoalan) / 1000));

    rekodJawapan({
      sesiId,
      darjah: 0,
      subjek: cadangan.micro_skill_kod,
      aktiviti: "kali-belajar-untuk-saya",
      topik: cadangan.micro_skill_nama,
      soalanRef: String(soalan.id),
      soalanTeks: soalan.soalan,
      jawapanMurid: huruf[idx],
      jawapanBetul: huruf[soalan.jawapan],
      betul: isBetul,
      masaSoalanSaat,
    });

    setRiwayatSkill((prev) => [
      ...prev,
      {
        micro_skill_id: cadangan.micro_skill_id,
        micro_skill_nama: cadangan.micro_skill_nama,
        betul: isBetul,
      },
    ]);



    if (isBetul) {
      setBetul((b) => b + 1);
      setMataSesi((m) => m + 1);
      void tambahMata({
        userId: user.id,
        mata: 1,
        sumber: "kali-belajar-untuk-saya",
        darjah: "0",
        subjek: cadangan.micro_skill_kod,
      });
    } else {
      setSalah((s) => s + 1);
    }

    const jumlahBaru = jawab + 1;
    setJawab(jumlahBaru);

    timerRef.current = setTimeout(() => {
      if (jumlahBaru >= JUMLAH_SOALAN_SESI) {
        setSelesai(true);
      } else {
        void muatSoalanSeterusnya();
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/pilih-darjah"
          className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Halaman Utama
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-4 py-1.5 font-display text-xs font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            KALI
          </span>
          <span
            className="rounded-full px-4 py-1.5 font-display text-xs font-extrabold shadow-soft"
            style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
          >
            Belajar Bersama KALI
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Biarkan KALI membimbing pembelajaran anda dengan memilih soalan yang paling sesuai berdasarkan prestasi semasa.
        </p>

        {selesai ? (
          <div className="mt-8 rounded-3xl bg-card p-8 text-center shadow-card">
            <h1 className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
              Sesi Selesai! 🎉
            </h1>
            <p className="mt-2 text-muted-foreground">
              Kamu dah jawab {jawab} soalan pilihan KALI.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  Betul
                </p>
                <p className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
                  {betul}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">Salah</p>
                <p className="font-display text-3xl font-extrabold text-destructive">{salah}</p>
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: `${EMAS}25`, border: `2px solid ${EMAS}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7a5300" }}>
                  Mata
                </p>
                <p className="font-display text-3xl font-extrabold" style={{ color: "#7a5300" }}>
                  {mataSesi}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                to="/pilih-darjah"
                className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                style={{ backgroundColor: HIJAU }}
              >
                Kembali ke Halaman Utama
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: HIJAU }}>
                  📚 Soalan
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>
                  {jawab} daripada {JUMLAH_SOALAN_SESI}
                </p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: `${EMAS}25`, border: `2px solid ${EMAS}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#7a5300" }}>
                  Betul
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: "#7a5300" }}>
                  {betul}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">Salah</p>
                <p className="font-display text-2xl font-extrabold text-destructive">{salah}</p>
              </div>
            </div>

            {errMsg ? (
              <div className="mt-6 rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-6 text-center">
                <p className="font-display text-lg font-extrabold text-destructive">Ralat</p>
                <p className="mt-1 text-sm text-muted-foreground">{errMsg}</p>
              </div>
            ) : fetching ? (
              <p className="mt-10 text-center text-muted-foreground">Memuatkan soalan...</p>
            ) : habisCadangan || !soalan || !cadangan ? (
              <div className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
                <p className="font-display text-xl font-extrabold" style={{ color: HIJAU }}>
                  Tiada cadangan buat masa ini — cuba lagi kemudian!
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    to="/pilih-darjah"
                    className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                    style={{ backgroundColor: HIJAU }}
                  >
                    Kembali ke Halaman Utama
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
                {soalan.svg_type && (
                  <div className="mx-auto mb-4 flex justify-center">
                    {renderSoalanSvg(soalan.svg_type, soalan.svg_params)}
                  </div>
                )}
                {soalan.gambar && (
                  <img
                    src={soalan.gambar}
                    alt="Gambar soalan"
                    className="mx-auto mb-4 max-h-64 rounded-2xl object-contain"
                    loading="lazy"
                  />
                )}

                {(soalan.rangsangan_teks ||
                  soalan.rangsangan_gambar_id ||
                  soalan.rangsangan_svg_type) && (
                  <div className="mb-4 rounded-2xl border-2 border-border bg-secondary/40 p-4">
                    {soalan.rangsangan_svg_type && (
                      <div className="mx-auto mb-3 flex justify-center">
                        {renderSoalanSvg(soalan.rangsangan_svg_type, soalan.rangsangan_svg_params)}
                      </div>
                    )}
                    {soalan.rangsangan_gambar_id && (
                      <img
                        src={
                          supabase.storage
                            .from("soalan-gambar-rajah")
                            .getPublicUrl(`${soalan.rangsangan_gambar_id}.png`).data.publicUrl
                        }
                        alt="Rangsangan soalan"
                        className="mx-auto mb-3 max-h-64 rounded-2xl object-contain"
                        loading="lazy"
                      />
                    )}
                    {soalan.rangsangan_teks && (
                      <p className="whitespace-pre-line text-sm font-medium text-foreground">
                        {soalan.rangsangan_teks}
                      </p>
                    )}
                  </div>
                )}


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
                        className="group flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left font-bold transition disabled:cursor-not-allowed"
                        style={{
                          borderColor: showBetul
                            ? HIJAU
                            : showSalah
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--border))",
                          backgroundColor: showBetul
                            ? `${HIJAU}15`
                            : showSalah
                              ? "hsl(var(--destructive) / 0.1)"
                              : "hsl(var(--background))",
                          color: showBetul ? HIJAU : showSalah ? "hsl(var(--destructive))" : undefined,
                        }}
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold text-white"
                          style={{
                            backgroundColor: showBetul
                              ? HIJAU
                              : showSalah
                                ? "hsl(var(--destructive))"
                                : EMAS,
                            color: showBetul || showSalah ? "#fff" : "#1a1a1a",
                          }}
                        >
                          {showBetul ? (
                            <Check className="h-5 w-5" />
                          ) : showSalah ? (
                            <X className="h-5 w-5" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </span>
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>

                {pilih !== null && soalan.feedback[pilih] && (
                  <div
                    className="mt-4 rounded-2xl border-2 p-4 text-sm font-medium"
                    style={
                      pilih === soalan.jawapan
                        ? { borderColor: HIJAU, backgroundColor: `${HIJAU}15`, color: "#0f5a39" }
                        : { borderColor: "#f59e0b", backgroundColor: "#fffbeb", color: "#92400e" }
                    }
                  >
                    {soalan.feedback[pilih]}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
