import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const BOT_USERNAME = "kalifahassistantbot";
const LANJUT_LINK = `https://t.me/${BOT_USERNAME}?start=cuba_kali_lanjut`;

export const Route = createFileRoute("/cuba-kali_/demo")({
  head: () => ({
    meta: [{ title: "Demo KALI — Kalifah.my" }],
  }),
  ssr: false,
  component: CubaKaliDemoPage,
});

type DemoSoalan = {
  soalan_id: number;
  subjek: string | null;
  soalan: string;
  pilihan_a: string | null;
  pilihan_b: string | null;
  pilihan_c: string | null;
  pilihan_d: string | null;
  micro_skill_nama: string | null;
  micro_skill_id: string | null;
};

type DemoSkill = {
  micro_skill_id: string;
  micro_skill_nama: string;
  betul: number;
  total: number;
  ratio: number;
  tier: "HIJAU" | "KUNING" | "MERAH";
};

type DemoResult = {
  betul_count: number;
  total_count: number;
  skills: DemoSkill[];
  insight_text: string | null;
  next_text: string;
};

type Phase = "loading" | "invalid" | "question" | "scoring" | "result";

function KumpulanSkill({
  tajuk,
  senarai,
  warna,
}: {
  tajuk: string;
  senarai: DemoSkill[];
  warna: string;
}) {
  if (senarai.length === 0) return null;
  return (
    <div className="mt-5">
      <p className={`text-sm font-extrabold ${warna}`}>{tajuk}</p>
      <ul className="mt-2 space-y-2">
        {senarai.map((s) => (
          <li key={s.micro_skill_id} className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{s.micro_skill_nama}</p>
            <p className="text-xs text-muted-foreground">
              {s.tier === "HIJAU" ? "✓ " : ""}
              {s.betul}/{s.total} {s.tier === "HIJAU" ? "jawapan tepat" : "tepat"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto max-w-xl px-4 py-10">{children}</div>
    </div>
  );
}

function CubaKaliDemoPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const tg = searchParams.get("tg") ?? undefined;
  const sesi = searchParams.get("sesi") ?? undefined;

  const [phase, setPhase] = useState<Phase>("loading");
  const [darjah, setDarjah] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [demoSoalan, setDemoSoalan] = useState<DemoSoalan[]>([]);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoJawapanTerkumpul, setDemoJawapanTerkumpul] = useState<
    { soalan_id: number; jawapan: string }[]
  >([]);
  const [demoPilih, setDemoPilih] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [showBranchBNote, setShowBranchBNote] = useState(false);

  const startedTrackedRef = useRef(false);
  const chatIdNum = tg ? Number(tg) : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!chatIdNum || !sesi || !Number.isFinite(chatIdNum)) {
        setPhase("invalid");
        return;
      }
      // PENTING: darjah TIDAK PERNAH dipercayai daripada query string. Token
      // (sesi) disahkan di server (RPC SECURITY DEFINER) terhadap kali_bot_sesi
      // -- darjah yang dipulangkan oleh RPC itulah source of truth.
      const { data, error } = await supabase.rpc("kali_validate_demo_sesi", {
        p_chat_id: chatIdNum,
        p_token: sesi,
      });
      if (cancelled) return;
      const row = data as
        | { valid?: boolean; darjah?: number; demo_completed?: boolean; demo_result_summary?: DemoResult | null }
        | null;
      if (error || !row?.valid || !row.darjah) {
        setPhase("invalid");
        return;
      }
      setDarjah(row.darjah);

      if (row.demo_completed && row.demo_result_summary) {
        setDemoResult(row.demo_result_summary);
        setPhase("result");
        return;
      }

      const { data: soalanData, error: soalanError } = await supabase.rpc("kali_get_demo_soalan_v2", {
        p_darjah: row.darjah,
      });
      if (cancelled) return;
      const soalanList = (Array.isArray(soalanData) ? soalanData : []) as DemoSoalan[];
      if (soalanError || soalanList.length === 0) {
        setErrorMsg("Maaf, demo untuk darjah ini belum tersedia buat masa ini.");
        setPhase("invalid");
        return;
      }
      setDemoSoalan(soalanList);
      setPhase("question");
      if (!startedTrackedRef.current) {
        startedTrackedRef.current = true;
        void supabase
          .from("analytics_events")
          .insert({
            event_name: "parent_demo_started",
            user_id: null,
            metadata: { telegram_chat_id: chatIdNum, darjah: row.darjah },
          })
          .then(
            () => {},
            () => {},
          );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pilihJawapan(huruf: string, soalanId: number) {
    if (demoPilih) return;
    setDemoPilih(huruf);
    const terkumpul = [...demoJawapanTerkumpul, { soalan_id: soalanId, jawapan: huruf }];
    setDemoJawapanTerkumpul(terkumpul);
    setTimeout(() => {
      setDemoPilih(null);
      if (demoIndex + 1 < demoSoalan.length) {
        setDemoIndex((i) => i + 1);
      } else {
        setPhase("scoring");
        void hantarDemo(terkumpul);
      }
    }, 1200);
  }

  async function hantarDemo(terkumpul: { soalan_id: number; jawapan: string }[]) {
    const mula = Date.now();
    const { data, error } = await supabase.rpc("kali_score_demo_soalan_v2", { p_jawapan: terkumpul });
    const row = data as DemoResult | null;
    const baki = Math.max(0, 1400 - (Date.now() - mula));
    await new Promise((r) => setTimeout(r, baki));

    if (error || !row) {
      setErrorMsg("Maaf, berlaku masalah teknikal menyediakan result demo. Sila cuba lagi dari Telegram.");
      setPhase("invalid");
      return;
    }

    const hasil: DemoResult = {
      betul_count: Number(row.betul_count ?? 0),
      total_count: Number(row.total_count ?? terkumpul.length),
      skills: Array.isArray(row.skills) ? row.skills : [],
      insight_text: row.insight_text ?? null,
      next_text: row.next_text ?? "",
    };
    setDemoResult(hasil);
    setPhase("result");

    if (chatIdNum && sesi) {
      void supabase
        .rpc("kali_simpan_demo_selesai", { p_chat_id: chatIdNum, p_token: sesi, p_result: hasil })
        .then(({ error: saveErr }) => {
          if (saveErr) console.error("kali_simpan_demo_selesai gagal:", saveErr);
        });
      void supabase
        .from("analytics_events")
        .insert({
          event_name: "parent_demo_completed",
          user_id: null,
          metadata: {
            telegram_chat_id: chatIdNum,
            darjah,
            betul_count: hasil.betul_count,
            total_count: hasil.total_count,
          },
        })
        .then(
          () => {},
          () => {},
        );
    }
  }

  if (phase === "loading") {
    return (
      <PageShell>
        <div className="rounded-3xl bg-card p-10 text-center shadow-card">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary/20" />
          <p className="mt-5 font-display text-base font-extrabold text-foreground">
            Menyediakan demo KALI...
          </p>
        </div>
      </PageShell>
    );
  }

  if (phase === "invalid") {
    return (
      <PageShell>
        <div className="rounded-3xl bg-card p-8 text-center shadow-card">
          <p className="font-display text-lg font-extrabold text-foreground">
            Pautan tidak sah atau sudah luput
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMsg ?? "Sila kembali ke Telegram dan mula semula dari pautan KALI."}
          </p>
        </div>
      </PageShell>
    );
  }

  if (phase === "scoring") {
    return (
      <PageShell>
        <div className="rounded-3xl bg-card p-10 text-center shadow-card">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary/20" />
          <p className="mt-5 font-display text-lg font-extrabold text-foreground">
            🧠 KALI sedang membaca corak jawapan anda...
          </p>
        </div>
      </PageShell>
    );
  }

  if (phase === "result" && demoResult) {
    const skills = demoResult.skills ?? [];
    const hijau = skills.filter((s) => s.tier === "HIJAU");
    const kuning = skills.filter((s) => s.tier === "KUNING");
    const merah = skills.filter((s) => s.tier === "MERAH");
    const peratus =
      demoResult.total_count > 0
        ? Math.round((demoResult.betul_count / demoResult.total_count) * 100)
        : 0;

    return (
      <PageShell>
        <div className="rounded-3xl bg-card p-6 shadow-card md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Analisis KALI
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground">Skor Demo</h1>
          <p className="mt-1 font-display text-4xl font-extrabold text-primary">
            {demoResult.betul_count} / {demoResult.total_count} betul · {peratus}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            KALI nampak sesuatu daripada jawapan anda.
          </p>

          <KumpulanSkill tajuk="🟢 Dikuasai dalam demo ini" senarai={hijau} warna="text-primary" />
          <KumpulanSkill tajuk="🟠 Perlu perhatian" senarai={kuning} warna="text-amber-600" />
          <KumpulanSkill tajuk="🔴 Perlu diperkukuhkan" senarai={merah} warna="text-destructive" />

          <div className="mt-6 rounded-2xl border border-border bg-primary/5 p-4">
            <p className="text-sm font-extrabold text-foreground">🔍 Apa yang KALI perasan?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {demoResult.insight_text ??
                "Jawapan anda menunjukkan penguasaan yang baik merentasi kemahiran yang diuji dalam demo ini."}
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-extrabold text-foreground">🎯 Kalau ini anak anda...</p>
            <p className="mt-1 text-sm text-muted-foreground">{demoResult.next_text}</p>
          </div>

          <a
            href={LANJUT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
          >
            Cuba KALI Dengan Anak Saya →
          </a>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowBranchBNote(true)}
              className="text-sm font-bold text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Dah yakin dengan KALI? Aktifkan untuk anak saya →
            </button>
            {showBranchBNote ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Ciri ini akan tersedia tak lama lagi. Buat masa ini, cuba KALI dengan anak anda dahulu 😊
              </p>
            ) : null}
          </div>
        </div>
      </PageShell>
    );
  }

  // phase === "question"
  const soalan = demoSoalan[Math.min(demoIndex, demoSoalan.length - 1)];
  if (!soalan) {
    return (
      <PageShell>
        <div className="rounded-3xl bg-card p-8 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Maaf, berlaku masalah memuatkan soalan.</p>
        </div>
      </PageShell>
    );
  }
  const pilihan = [
    { huruf: "A", teks: soalan.pilihan_a },
    { huruf: "B", teks: soalan.pilihan_b },
    { huruf: "C", teks: soalan.pilihan_c },
    { huruf: "D", teks: soalan.pilihan_d },
  ].filter((p) => p.teks != null && String(p.teks).trim() !== "");

  return (
    <PageShell>
      {darjah ? (
        <p className="mb-3 text-center text-xs font-bold text-muted-foreground">Demo KALI · Darjah {darjah}</p>
      ) : null}
      <div className="rounded-3xl bg-card p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Soalan {demoIndex + 1} daripada {demoSoalan.length}
          {soalan.subjek ? ` · ${soalan.subjek}` : ""}
        </p>
        <h1 className="mt-3 whitespace-pre-line font-display text-lg font-extrabold text-foreground">
          {soalan.soalan}
        </h1>
        <div className="mt-5 space-y-2">
          {pilihan.map((p) => {
            const dipilih = demoPilih === p.huruf;
            return (
              <button
                key={p.huruf}
                type="button"
                disabled={!!demoPilih}
                onClick={() => pilihJawapan(p.huruf, soalan.soalan_id)}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition disabled:opacity-70 ${
                  dipilih
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                <span className="font-display">{p.huruf}.</span>
                <span className="whitespace-pre-line font-medium">{p.teks}</span>
              </button>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
