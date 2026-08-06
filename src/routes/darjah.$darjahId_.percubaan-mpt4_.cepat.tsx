import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Target, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { getDarjah } from "@/lib/curriculum";
import { laluanCheckout, shouldSkipChildGuard } from "@/lib/child-auth";
import { rekodJawapan } from "@/lib/progress";

export const Route = createFileRoute("/darjah/$darjahId_/percubaan-mpt4_/cepat")({
  head: () => ({
    meta: [
      { title: "5 Soalan Cepat — Percubaan MPT4 — Kalifah.my" },
      {
        name: "description",
        content:
          "Anggaran pantas tahap kesediaan MPT4 dalam 2 minit — 5 soalan merentas Bahasa Melayu, Bahasa Inggeris, Matematik dan Sains.",
      },
      { property: "og:title", content: "5 Soalan Cepat — Percubaan MPT4 — Kalifah.my" },
      {
        property: "og:description",
        content: "Anggaran pantas tahap kesediaan MPT4 anak anda dalam 2 minit sahaja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: AssessmentCepatPage,
});

const AKTIVITI = "assessment_cepat";

const SUBJEK_LABEL: Record<string, string> = {
  BM: "Bahasa Melayu",
  "Bahasa Inggeris": "Bahasa Inggeris",
  MT: "Matematik",
  SC: "Sains",
};

const SUBJEK_URUTAN = ["BM", "Bahasa Inggeris", "MT", "SC"] as const;

interface SoalanCepat {
  id: string;
  subjek: string;
  topik: string | null;
  soalan: string;
  pilihan: { huruf: string; teks: string }[];
  jawapan: string;
}

interface JawapanCepat {
  soalan: SoalanCepat;
  pilihanMurid: string;
  betul: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function jejakEvent(nama: string, userId: string | null, metadata: Record<string, unknown>) {
  try {
    void supabase
      .from("analytics_events")
      .insert({ event_name: nama, user_id: userId, metadata })
      .then(
        () => {},
        () => {},
      );
  } catch {
    /* analytics tidak boleh ganggu flow */
  }
}

function AssessmentCepatPage() {
  const navigate = useNavigate();
  const { darjahId } = useParams({ from: "/darjah/$darjahId_/percubaan-mpt4_/cepat" });
  const { user, loading } = useAuth();
  const mata = usePoints();
  const darjah = getDarjah(darjahId);
  const studentName = user?.user_metadata?.name as string | undefined;

  const [soalanList, setSoalanList] = useState<SoalanCepat[] | null>(null);
  const [ralat, setRalat] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [pilih, setPilih] = useState<string | null>(null);
  const [jawapanSemua, setJawapanSemua] = useState<JawapanCepat[]>([]);
  const [selesai, setSelesai] = useState(false);

  const sesiIdRef = useRef<string>("");
  if (!sesiIdRef.current && typeof crypto !== "undefined") {
    sesiIdRef.current = crypto.randomUUID();
  }
  const masaSoalanRef = useRef<number>(Date.now());
  const mulaDijejakRef = useRef(false);
  const tamatDijejakRef = useRef(false);

  useEffect(() => {
    if (shouldSkipChildGuard()) return;
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Tarik 5 soalan: 1 BM, 1 BI, 1 SC, 2 MT — semua tanpa gambar/svg
  // 4 query berasingan (parallel) supaya tiada subjek hilang akibat row-limit PostgREST
  useEffect(() => {
    let cancelled = false;
    (async () => {
      type Row = {
        id: string | number;
        subjek: string;
        topik: string | null;
        soalan: string;
        pilihan_a: string | null;
        pilihan_b: string | null;
        pilihan_c: string | null;
        pilihan_d: string | null;
        jawapan: string | null;
      };

      const kuota: Record<string, number> = { BM: 1, "Bahasa Inggeris": 1, MT: 2, SC: 1 };

      const hasil = await Promise.all(
        SUBJEK_URUTAN.map(async (subjek) => {
          const mula = Math.floor(Math.random() * 200);
          const { data, error } = await supabase
            .from("kuiz_soalan")
            .select("id, subjek, topik, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan")
            .eq("darjah", 4)
            .eq("subjek", subjek)
            .is("gambar", null)
            .is("svg_type", null)
            .range(mula, mula + 39);
          if (error || !data || data.length === 0) {
            // fallback: mungkin offset melebihi jumlah baris subjek ini
            const { data: data2 } = await supabase
              .from("kuiz_soalan")
              .select("id, subjek, topik, soalan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, jawapan")
              .eq("darjah", 4)
              .eq("subjek", subjek)
              .is("gambar", null)
              .is("svg_type", null)
              .limit(40);
            return (data2 ?? []) as unknown as Row[];
          }
          return data as unknown as Row[];
        }),
      );
      if (cancelled) return;

      const dipilih: SoalanCepat[] = [];
      hasil.forEach((rows, i) => {
        const subjek = SUBJEK_URUTAN[i];
        const bersih: SoalanCepat[] = rows
          .filter((r) => r.soalan && r.pilihan_a && r.pilihan_b && r.pilihan_c && r.pilihan_d && r.jawapan)
          .map((r) => ({
            id: String(r.id),
            subjek: r.subjek,
            topik: r.topik ?? null,
            soalan: r.soalan,
            pilihan: [
              { huruf: "A", teks: r.pilihan_a as string },
              { huruf: "B", teks: r.pilihan_b as string },
              { huruf: "C", teks: r.pilihan_c as string },
              { huruf: "D", teks: r.pilihan_d as string },
            ],
            jawapan: String(r.jawapan).trim().toUpperCase().slice(0, 1),
          }));
        dipilih.push(...shuffle(bersih).slice(0, kuota[subjek] ?? 1));
      });

      if (dipilih.length === 0) {
        setRalat("Tiada soalan sesuai buat masa ini. Sila cuba lagi nanti.");
        return;
      }
      setSoalanList(shuffle(dipilih));
      masaSoalanRef.current = Date.now();
    })();
    return () => {
      cancelled = true;
    };
  }, []);


  // Event: mula
  useEffect(() => {
    if (mulaDijejakRef.current) return;
    if (!soalanList || soalanList.length === 0 || !user) return;
    mulaDijejakRef.current = true;
    jejakEvent("assessment_cepat_mula", user.id, {
      darjah: 4,
      sesi_id: sesiIdRef.current,
      bil_soalan: soalanList.length,
    });
  }, [soalanList, user]);

  const handleJawab = useCallback(
    (huruf: string) => {
      if (!soalanList || pilih !== null) return;
      const s = soalanList[idx];
      const betul = huruf === s.jawapan;
      const masa = (Date.now() - masaSoalanRef.current) / 1000;
      setPilih(huruf);

      rekodJawapan({
        sesiId: sesiIdRef.current,
        darjah: 4,
        subjek: s.subjek,
        aktiviti: AKTIVITI,
        topik: s.topik ?? undefined,
        soalanRef: s.id,
        soalanTeks: s.soalan,
        jawapanMurid: huruf,
        jawapanBetul: s.jawapan,
        betul,
        masaSoalanSaat: masa,
        percubaanKe: 1,
      });

      setJawapanSemua((prev) => [...prev, { soalan: s, pilihanMurid: huruf, betul }]);

      window.setTimeout(() => {
        if (idx + 1 >= soalanList.length) {
          setSelesai(true);
        } else {
          setIdx(idx + 1);
          setPilih(null);
          masaSoalanRef.current = Date.now();
        }
      }, 700);
    },
    [soalanList, idx, pilih],
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  // Event: tamat
  useEffect(() => {
    if (!selesai || tamatDijejakRef.current || !user) return;
    tamatDijejakRef.current = true;
    jejakEvent("assessment_cepat_tamat", user.id, {
      darjah: 4,
      sesi_id: sesiIdRef.current,
      skor: jawapanSemua.filter((j) => j.betul).length,
      jumlah: jawapanSemua.length,
    });
  }, [selesai, user, jawapanSemua]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/percubaan-mpt4"
          params={{ darjahId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        {ralat && (
          <div className="mt-6 rounded-3xl border border-border/60 bg-card p-6 text-center shadow-card">
            <p className="font-bold text-destructive">{ralat}</p>
          </div>
        )}

        {!ralat && !soalanList && (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Menyediakan soalan...
          </div>
        )}

        {!ralat && soalanList && !selesai && (
          <SkrinSoalan
            soalan={soalanList[idx]}
            idx={idx}
            jumlah={soalanList.length}
            pilih={pilih}
            onJawab={handleJawab}
          />
        )}

        {!ralat && soalanList && selesai && (
          <SkrinKeputusan
            darjahId={darjahId}
            darjahLabel={darjah?.label ?? `Darjah ${darjahId}`}
            jawapanSemua={jawapanSemua}
            userId={user.id}
            sesiId={sesiIdRef.current}
          />
        )}
      </main>
    </div>
  );
}

function SkrinSoalan({
  soalan,
  idx,
  jumlah,
  pilih,
  onJawab,
}: {
  soalan: SoalanCepat;
  idx: number;
  jumlah: number;
  pilih: string | null;
  onJawab: (huruf: string) => void;
}) {
  const peratus = Math.round(((idx + (pilih ? 1 : 0)) / jumlah) * 100);
  return (
    <section className="mt-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-xs font-extrabold text-primary">
          {SUBJEK_LABEL[soalan.subjek] ?? soalan.subjek}
        </span>
        <span className="font-display text-xs font-extrabold text-muted-foreground">
          Soalan {idx + 1} / {jumlah}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${peratus}%` }} />
      </div>

      <div className="mt-5 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
        <p className="whitespace-pre-line font-display text-lg font-extrabold text-foreground">{soalan.soalan}</p>
        <div className="mt-5 flex flex-col gap-3">
          {soalan.pilihan.map((p) => {
            const dipilih = pilih === p.huruf;
            const betulPilihan = pilih !== null && p.huruf === soalan.jawapan;
            const salahPilihan = dipilih && p.huruf !== soalan.jawapan;
            return (
              <button
                key={p.huruf}
                type="button"
                disabled={pilih !== null}
                onClick={() => onJawab(p.huruf)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left font-bold transition ${
                  betulPilihan
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                    : salahPilihan
                      ? "border-destructive bg-destructive/10 text-foreground"
                      : "border-border/60 bg-background text-foreground hover:border-primary hover:bg-primary/5"
                }`}
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xs font-extrabold">
                  {p.huruf}
                </span>
                <span className="text-sm">{p.teks}</span>
                {betulPilihan && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                {salahPilihan && <X className="ml-auto h-4 w-4 text-destructive" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkrinKeputusan({
  darjahId,
  darjahLabel,
  jawapanSemua,
  userId,
  sesiId,
}: {
  darjahId: string;
  darjahLabel: string;
  jawapanSemua: JawapanCepat[];
  userId: string;
  sesiId: string;
}) {
  const skor = jawapanSemua.filter((j) => j.betul).length;
  const jumlah = jawapanSemua.length;

  const perSubjek = SUBJEK_URUTAN.map((subjek) => {
    const items = jawapanSemua.filter((j) => j.soalan.subjek === subjek);
    const betul = items.filter((j) => j.betul).length;
    return { subjek, label: SUBJEK_LABEL[subjek] ?? subjek, betul, jumlah: items.length };
  }).filter((s) => s.jumlah > 0);

  const terlemah = [...perSubjek].sort(
    (a, b) => a.betul / a.jumlah - b.betul / b.jumlah || b.jumlah - a.jumlah,
  )[0];
  const semuaBetul = skor === jumlah;

  const fokus = semuaBetul ? "Kekalkan momentum" : (terlemah?.label ?? "Ulang kaji menyeluruh");
  const kenapa = semuaBetul
    ? `Semua ${jumlah} soalan dijawab betul dalam anggaran pantas ini. Namun 5 soalan belum cukup untuk mengesahkan tahap sebenar.`
    : `${terlemah?.betul ?? 0}/${terlemah?.jumlah ?? 0} betul bagi ${terlemah?.label ?? "subjek ini"} — paling rendah antara subjek yang diuji.`;
  const tindakan = semuaBetul
    ? "Cuba MPT4 penuh (50 soalan) untuk ukuran yang lebih tepat dan pelan belajar yang lebih fokus."
    : `Mulakan dengan Latih Tubi & Nota Ringkas ${terlemah?.label ?? ""} sebelum mencuba MPT4 penuh.`;

  return (
    <section className="mt-4 flex flex-col gap-6">
      <div className="rounded-3xl border border-border/60 bg-gradient-hero p-6 text-center shadow-card">
        <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground shadow-soft">
          Anggaran, {jumlah} soalan
        </span>
        <p className="mt-3 font-display text-5xl font-extrabold text-foreground">
          {skor}/{jumlah}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Anggaran pantas kesediaan MPT4 — {darjahLabel}</p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-extrabold text-foreground">Ikut Subjek</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {perSubjek.map((s) => {
            const lulus = s.betul === s.jumlah;
            return (
              <li
                key={s.subjek}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-2.5"
              >
                <span className="font-bold text-foreground">{s.label}</span>
                <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  {s.betul}/{s.jumlah}
                  {lulus ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Kad insight — gaya sama seperti KALI Insight (Fokus / Kenapa / Tindakan) */}
      <div className="rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-extrabold text-foreground">Cadangan KALI</h2>
          <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 font-display text-[10px] font-extrabold text-muted-foreground">
            Keyakinan rendah
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="rounded-2xl bg-primary/5 px-4 py-3">
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-primary">Fokus</p>
            <p className="mt-1 font-bold text-foreground">{fokus}</p>
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3">
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Kenapa</p>
            <p className="mt-1 text-muted-foreground">{kenapa}</p>
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3">
            <p className="font-display text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              Tindakan
            </p>
            <p className="mt-1 text-muted-foreground">{tindakan}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border-2 border-primary/40 bg-gradient-hero p-6 text-center shadow-card">
        <h3 className="font-display text-xl font-extrabold text-foreground">Buka Pelan Pintar KALI™ 14 Hari</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Pelan belajar harian ikut kelemahan anak + semua set Percubaan MPT4, Latih Tubi, Nota, Kuiz &amp; Game untuk{" "}
          {darjahLabel} — hanya <span className="font-extrabold text-foreground">RM49/tahun</span>.
        </p>
        <button
          type="button"
          onClick={() => void handleLanggan(darjahId, userId, sesiId, terlemah?.subjek ?? null)}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition hover:translate-y-[-1px]"
        >
          🔓 Buka {darjahLabel} Sekarang — RM49/tahun
        </button>
      </div>

      <div className="text-center">
        <Link
          to="/darjah/$darjahId/percubaan-mpt4"
          params={{ darjahId }}
          className="text-sm font-bold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Atau buat MPT4 penuh (50 soalan) untuk keputusan lebih tepat
        </Link>
      </div>

      <div className="text-center">
        <Link
          to="/darjah/$darjahId"
          params={{ darjahId }}
          className="text-sm font-bold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Kembali ke senarai subjek
        </Link>
      </div>
    </section>
  );
}

async function handleLanggan(
  darjahId: string,
  userId: string | null,
  sesiId: string,
  subjek: string | null,
) {
  jejakEvent("plan_unlock_clicked", userId, { sumber: AKTIVITI, sesi_id: sesiId, subjek });
  const url = await laluanCheckout(darjahId);
  window.location.href = url;
}
