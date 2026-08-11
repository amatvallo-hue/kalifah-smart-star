import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { rekodJawapan } from "@/lib/progress";
import { awardKaliStar, awardKaliSesiBonus } from "@/lib/tambah-mata";
import { renderSoalanSvg } from "@/lib/render-soalan-svg";
import { shouldSkipChildGuard, switchBackToParent } from "@/lib/child-auth";

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
  validateSearch: (search: Record<string, unknown>) => {
    const src = typeof search.src === "string" ? search.src : undefined;
    return src ? { src } : {};
  },
  component: KaliBelajarUntukSayaPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const JUMLAH_SOALAN_SESI = 10;

type Tier = "RED" | "YELLOW" | "GREEN" | "BLUE" | string;

interface NotaBantuan {
  nota_topik: string | null;
  nota_bahasa: string | null;
  konsep: string[];
  istilah: { term: string; def: string }[];
  formula: string[];
  tips: string[];
  gambar_url: string[];
  micro_skill_nama: string;
}


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

interface DiagnosticHasil {
  betul: number;
  jumlahMenguasai: number;
  jumlahDiperkukuh: number;
  bocorNama: string | null;
  bocorGejala: string | null;
}

function letterToIdx(l: string): number {
  return ({ A: 0, B: 1, C: 2, D: 3 } as Record<string, number>)[String(l).toUpperCase()] ?? 0;
}

function KaliCelebrationScreen({
  mataSesi,
  bolehTunjuk,
  onTunjuk,
}: {
  mataSesi: number;
  bolehTunjuk: boolean;
  onTunjuk: () => void;
}) {
  return (
    <div className="mt-8 rounded-3xl bg-card p-8 text-center shadow-card">
      <h1 className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
        🎉 Selesai!
      </h1>
      <p className="mt-3 font-display text-lg font-extrabold text-foreground">
        KALI dah kenal anda dengan lebih baik.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        KALI dah jumpa apa yang anda dah kuasai dan apa yang boleh diperkuatkan seterusnya.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Laporan sudah dihantar kepada ibu/bapa.
      </p>

      {mataSesi > 0 && (
        <p className="mt-6 font-display text-2xl font-extrabold" style={{ color: EMAS }}>
          ⭐ +{mataSesi} mata
        </p>
      )}

      {bolehTunjuk && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onTunjuk}
            className="rounded-full border-2 px-6 py-3 font-display text-sm font-extrabold transition hover:opacity-80"
            style={{ borderColor: HIJAU, color: HIJAU }}
          >
            Tunjukkan kepada Ibu/Ayah →
          </button>
        </div>
      )}
    </div>
  );
}


function KaliBelajarUntukSayaPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
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
  const sesiBonusAwardedRef = useRef(false);
  const diagStartedTrackedRef = useRef(false);
  const sourceRef = useRef<"telegram" | "whatsapp" | "same_device">(
    (search.src === "telegram" || search.src === "whatsapp") ? search.src : "same_device"
  );


  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const prevSkillRef = useRef<{ id: string; nama: string } | null>(null);
  const [skillUpdateMsg, setSkillUpdateMsg] = useState<string | null>(null);
  const [riwayatSkill, setRiwayatSkill] = useState<
    { micro_skill_id: string; micro_skill_nama: string; betul: boolean; sebab: string }[]
  >([]);

  // Popup nota bantuan bila KALI detect skill mencabar (tier RED)
  const notaDitawarRef = useRef<Set<string>>(new Set());
  const [notaOpen, setNotaOpen] = useState(false);
  const [notaMod, setNotaMod] = useState<"tawar" | "baca">("tawar");
  const [nota, setNota] = useState<NotaBantuan | null>(null);

  // KALI Diagnostic V1 — mod percuma (belum bayar darjah) dihadkan kepada
  // 1 sesi 10 soalan sahaja, tease terkunci selepas itu. Lihat memory
  // "keputusan_tease_kali_diagnostic_v1" untuk rasional penuh.
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [childProfileId, setChildProfileId] = useState<number | null>(null);
  const [childDarjah, setChildDarjah] = useState<string>("1");
  const [diagStatusChecked, setDiagStatusChecked] = useState(false);
  const [diagAlreadyDone, setDiagAlreadyDone] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticHasil | null>(null);

  useEffect(() => {
    if (shouldSkipChildGuard()) return;
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Funnel: link diagnostic diklik dari Telegram/WhatsApp
  useEffect(() => {
    const src = search.src;
    if (!user) return;
    if (src !== "telegram" && src !== "whatsapp") return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("kali_link_clicked_tracked") === "1") return;
    window.sessionStorage.setItem("kali_link_clicked_tracked", "1");
    void supabase
      .from("analytics_events")
      .insert({
        event_name: "diagnostic_link_clicked",
        user_id: null,
        metadata: {
          landing_page: "daftar-kali",
          auth_user_id: null,
          child_user_id: user.id,
          source: src,
        },
      })
      .then(() => {}, () => {});
  }, [user, search.src]);


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

  // Semak status bayaran (darjah_akses) + sama ada sesi diagnostic percuma
  // dah pernah dibuat untuk anak ni. Guna profiles.darjah_akses ANAK sendiri
  // (bukan parent) — ia dah mirror akses sebenar sejak ciptaAkaunAnak().
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: cp }] = await Promise.all([
        supabase.from("profiles").select("darjah_akses").eq("id", user.id).maybeSingle(),
        supabase
          .from("child_profiles")
          .select(
            "id, darjah, kali_diagnostic_completed_at, kali_diagnostic_betul, kali_diagnostic_jumlah_menguasai, kali_diagnostic_jumlah_diperkukuh, kali_diagnostic_bocor_nama, kali_diagnostic_bocor_gejala"
          )
          .eq("child_user_id", user.id)
          .maybeSingle(),
      ]);
      const akses = (prof as { darjah_akses: unknown } | null)?.darjah_akses;
      const paid = Array.isArray(akses) && akses.length > 0;
      setDiagnosticMode(!paid);
      if (cp) {
        const cpRow = cp as {
          id: number;
          darjah: string | number;
          kali_diagnostic_completed_at: string | null;
          kali_diagnostic_betul: number | null;
          kali_diagnostic_jumlah_menguasai: number | null;
          kali_diagnostic_jumlah_diperkukuh: number | null;
          kali_diagnostic_bocor_nama: string | null;
          kali_diagnostic_bocor_gejala: string | null;
        };
        setChildProfileId(cpRow.id ?? null);
        setChildDarjah(String(cpRow.darjah ?? "1"));
        if (!paid && cpRow.kali_diagnostic_completed_at) {
          setDiagAlreadyDone(true);
          setDiagResult({
            betul: cpRow.kali_diagnostic_betul ?? 0,
            jumlahMenguasai: cpRow.kali_diagnostic_jumlah_menguasai ?? 0,
            jumlahDiperkukuh: cpRow.kali_diagnostic_jumlah_diperkukuh ?? 0,
            bocorNama: cpRow.kali_diagnostic_bocor_nama ?? null,
            bocorGejala: cpRow.kali_diagnostic_bocor_gejala ?? null,
          });
        }
      }
      setDiagStatusChecked(true);
    })();
  }, [user]);

  const muatSoalanSeterusnya = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    setErrMsg(null);
    setPilih(null);
    try {
      const { data, error } = await supabase.rpc("kali_next_best_question", {
        p_student_id: user.id,
        p_darjah: Number(childDarjah),
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
      if (!diagnosticMode && prevSkill && prevSkill.id !== row.micro_skill_id) {
        setSkillUpdateMsg(
          row.tier === "RED"
            ? `Nampaknya ${prevSkill.nama} masih agak mencabar. Mari kita cuba beberapa soalan lagi dengan cara yang berbeza.`
            : `Anda sudah menunjukkan peningkatan dalam ${prevSkill.nama}. Sekarang mari kita fokus kepada ${row.micro_skill_nama}.`
        );
      } else {
        setSkillUpdateMsg(null);
      }
      prevSkillRef.current = { id: row.micro_skill_id, nama: row.micro_skill_nama };

      // Tawar nota bantuan bila skill mencabar (sekali sahaja per skill per sesi)
      // TIADA dalam mod diagnostic percuma — remediation content ni sebahagian
      // daripada nilai berbayar, jangan bocor sebelum parent langgan.
      if (!diagnosticMode && row.tier === "RED" && !notaDitawarRef.current.has(row.micro_skill_id)) {
        notaDitawarRef.current.add(row.micro_skill_id);
        try {
          const { data: nData } = await supabase.rpc("kali_cari_nota_untuk_skill", {
            p_micro_skill_id: row.micro_skill_id,
            p_student_id: user.id,
          } as any);
          const nRow: any = Array.isArray(nData) ? nData[0] : nData;
          if (nRow?.nota_ditemui === true) {
            const asArr = (v: any): any[] => (Array.isArray(v) ? v : []);
            setNota({
              nota_topik: nRow.nota_topik ?? null,
              nota_bahasa: nRow.nota_bahasa ?? null,
              konsep: asArr(nRow.konsep).map((x) => String(x)),
              istilah: asArr(nRow.istilah).map((x) => ({
                term: String(x?.term ?? ""),
                def: String(x?.def ?? ""),
              })),
              formula: asArr(nRow.formula).map((x) => String(x)),
              tips: asArr(nRow.tips).map((x) => String(x)),
              gambar_url: asArr(nRow.gambar_url).map((x) => String(x)),
              micro_skill_nama: row.micro_skill_nama,
            });
            setNotaMod("tawar");
            setNotaOpen(true);
          }
        } catch (e) {
          console.error("KALI nota bantuan gagal:", e);
        }
      }



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
      if (diagnosticMode && !diagStartedTrackedRef.current && user) {
        diagStartedTrackedRef.current = true;
        void supabase
          .from("analytics_events")
          .insert({
            event_name: "diagnostic_started",
            user_id: null,
            metadata: {
              landing_page: "daftar-kali",
              auth_user_id: null,
              child_user_id: user.id,
              source: sourceRef.current,
            },
          })
          .then(() => {}, () => {});
      }
    } catch (e: any) {
      console.error("KALI next question gagal:", e);
      setErrMsg(e?.message ?? "Ralat tidak diketahui");
    } finally {
      setFetching(false);
    }
  }, [user, diagnosticMode, childDarjah]);

  useEffect(() => {
    if (user && welcomeChecked && !showWelcome && diagStatusChecked && !diagAlreadyDone) {
      void muatSoalanSeterusnya();
    }
  }, [user, welcomeChecked, showWelcome, diagStatusChecked, diagAlreadyDone, muatSoalanSeterusnya]);


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

    const riwayatBaru = [
      ...riwayatSkill,
      {
        micro_skill_id: cadangan.micro_skill_id,
        micro_skill_nama: cadangan.micro_skill_nama,
        betul: isBetul,
        sebab: cadangan.sebab,
      },
    ];
    setRiwayatSkill(riwayatBaru);

    const betulBaru = isBetul ? betul + 1 : betul;
    if (isBetul) {
      setBetul((b) => b + 1);
      setMataSesi((m) => m + 1);
      void awardKaliStar({
        soalanRef: String(soalan.id),
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
        if (!sesiBonusAwardedRef.current) {
          sesiBonusAwardedRef.current = true;
          void awardKaliSesiBonus();
        }
        if (diagnosticMode && childProfileId) {
          const skillMapBaru = new Map<string, { id: string; nama: string; semuaBetul: boolean }>();
          for (const r of riwayatBaru) {
            const sedia = skillMapBaru.get(r.micro_skill_id);
            if (sedia) sedia.semuaBetul = sedia.semuaBetul && r.betul;
            else skillMapBaru.set(r.micro_skill_id, { id: r.micro_skill_id, nama: r.micro_skill_nama, semuaBetul: r.betul });
          }
          const semuaSkill = [...skillMapBaru.values()];
          const menguasaiBaru = semuaSkill.filter((s) => s.semuaBetul);
          const diperkukuhBaru = semuaSkill.filter((s) => !s.semuaBetul);
          const bocor = diperkukuhBaru[0] ?? null;
          const hasil: DiagnosticHasil = {
            betul: betulBaru,
            jumlahMenguasai: menguasaiBaru.length,
            jumlahDiperkukuh: diperkukuhBaru.length,
            bocorNama: bocor?.nama ?? null,
            bocorGejala: bocor ? "Anak masih tersilap dalam beberapa soalan berkaitan kemahiran ini." : null,
          };
          setDiagResult(hasil);
          void supabase
            .rpc("simpan_kali_diagnostic_hasil", {
              p_betul: hasil.betul,
              p_jumlah_menguasai: hasil.jumlahMenguasai,
              p_jumlah_diperkukuh: hasil.jumlahDiperkukuh,
              p_bocor_skill_id: bocor?.id ?? null,
              p_bocor_nama: hasil.bocorNama,
              p_bocor_gejala: hasil.bocorGejala,
              p_source: sourceRef.current,
            } as any)
            .then(({ data, error }: any) => {
              if (error || data !== true) {
                console.error("simpan_kali_diagnostic_hasil gagal:", error);
              }
            });
        }
      } else {
        void muatSoalanSeterusnya();
      }
    }, 1500);
  };

  const handleBukaAnalisis = async () => {
    const url = await laluanCheckout(childDarjah);
    if (typeof window !== "undefined") window.location.href = url;
  };

  const skillMap = new Map<string, { nama: string; semuaBetul: boolean }>();
  for (const r of riwayatSkill) {
    const sedia = skillMap.get(r.micro_skill_id);
    if (sedia) sedia.semuaBetul = sedia.semuaBetul && r.betul;
    else skillMap.set(r.micro_skill_id, { nama: r.micro_skill_nama, semuaBetul: r.betul });
  }
  const menguasai = [...skillMap.values()].filter((s) => s.semuaBetul).map((s) => s.nama);
  const diperkukuh = [...skillMap.values()].filter((s) => !s.semuaBetul).map((s) => s.nama);

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

        {diagAlreadyDone && diagResult ? (
          <KaliTeaseScreen hasil={diagResult} onBukaAnalisis={handleBukaAnalisis} />
        ) : selesai ? (
          diagnosticMode && diagResult ? (
            <KaliTeaseScreen hasil={diagResult} onBukaAnalisis={handleBukaAnalisis} />
          ) : (
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

            {(menguasai.length > 0 || diperkukuh.length > 0) && (
              <div className="mt-6 space-y-4 text-center">
                {menguasai.length > 0 && (
                  <div>
                    <p className="font-display text-sm font-extrabold" style={{ color: HIJAU }}>
                      ✅ Menguasai
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{menguasai.join(", ")}</p>
                  </div>
                )}
                {diperkukuh.length > 0 && (
                  <div>
                    <p className="font-display text-sm font-extrabold" style={{ color: EMAS }}>
                      🎯 Sedang Diperkukuh
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{diperkukuh.join(", ")}</p>
                  </div>
                )}
                <div>
                  <p className="font-display text-sm font-extrabold text-foreground">➡️ Cadangan KALI</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {diperkukuh.length > 0
                      ? `Teruskan satu lagi sesi esok untuk meningkatkan penguasaan ${diperkukuh[0]}.`
                      : "Hebat! Teruskan sesi esok untuk kekalkan penguasaan anda."}
                  </p>
                </div>
              </div>
            )}

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
          )
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

            {showWelcome ? (
              <div className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
                <h1 className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>
                  👋 Selamat datang ke Belajar Bersama KALI.
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Di sini, KALI akan menjadi pembimbing pembelajaran anda. KALI akan melihat kemahiran
                  yang telah anda kuasai, mengenal pasti bahagian yang masih perlu dipertingkatkan, dan
                  memilih soalan yang paling sesuai untuk membantu anda belajar dengan lebih berkesan.
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Anda hanya perlu fokus menjawab. Biar KALI merancang perjalanan pembelajaran anda.
                </p>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem("kali_welcome_seen_" + user.id, "1");
                      } catch {
                        /* abaikan */
                      }
                      setShowWelcome(false);
                    }}
                    className="rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
                    style={{ backgroundColor: HIJAU }}
                  >
                    Mula Belajar
                  </button>
                </div>
              </div>
            ) : errMsg ? (
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
              <>
              {skillUpdateMsg && (
                <div
                  className="mt-6 rounded-2xl p-4"
                  style={{ backgroundColor: `${EMAS}15`, border: `2px solid ${EMAS}` }}
                >
                  <p className="font-display text-sm font-extrabold" style={{ color: EMAS }}>
                    🧠 KALI Update
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{skillUpdateMsg}</p>
                </div>
              )}
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
              </>

            )}
          </>
        )}
      </main>

      <Dialog open={notaOpen} onOpenChange={setNotaOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {notaMod === "tawar" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-extrabold" style={{ color: HIJAU }}>
                  KALI perasan ni agak mencabar 🤔
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Nampaknya <strong>{nota?.micro_skill_nama}</strong> ni agak sukar buat masa ini. Nak
                  baca nota ringkas dulu sebelum sambung, atau nak terus cuba soalan lagi?
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => setNotaMod("baca")}
                  className="flex-1 rounded-full px-5 py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: HIJAU }}
                >
                  📖 Baca Nota Dulu
                </button>
                <button
                  onClick={() => setNotaOpen(false)}
                  className="flex-1 rounded-full px-5 py-3 text-sm font-bold"
                  style={{ backgroundColor: `${EMAS}25`, border: `2px solid ${EMAS}`, color: "#7a5200" }}
                >
                  ✏️ Teruskan Jawab Soalan
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-extrabold" style={{ color: HIJAU }}>
                  📖 {nota?.nota_topik ?? "Nota Ringkas"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Nota ringkas untuk {nota?.micro_skill_nama}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {nota?.gambar_url && nota.gambar_url.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {nota.gambar_url.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Gambar nota ${i + 1}`}
                        className="max-h-64 rounded-2xl object-contain"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {nota?.konsep && nota.konsep.length > 0 && (
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase tracking-wide" style={{ color: HIJAU }}>
                      Konsep
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                      {nota.konsep.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {nota?.istilah && nota.istilah.length > 0 && (
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase tracking-wide" style={{ color: HIJAU }}>
                      Istilah
                    </p>
                    <ul className="mt-1 space-y-1 pl-1 text-muted-foreground">
                      {nota.istilah.map((t, i) => (
                        <li key={i}>
                          <strong className="text-foreground">{t.term}</strong>: {t.def}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {nota?.formula && nota.formula.length > 0 && (
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase tracking-wide" style={{ color: HIJAU }}>
                      Formula
                    </p>
                    <ul className="mt-1 space-y-1">
                      {nota.formula.map((f, i) => (
                        <li
                          key={i}
                          className="rounded-xl px-3 py-2 font-medium"
                          style={{ backgroundColor: `${HIJAU}12` }}
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {nota?.tips && nota.tips.length > 0 && (
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase tracking-wide" style={{ color: EMAS }}>
                      Tips
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                      {nota.tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setNotaOpen(false)}
                className="mt-4 w-full rounded-full px-5 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: HIJAU }}
              >
                Faham, saya nak cuba soalan
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>

  );
}
