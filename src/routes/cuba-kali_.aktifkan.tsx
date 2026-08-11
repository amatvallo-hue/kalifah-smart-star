import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { User, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/cuba-kali_/aktifkan")({
  head: () => ({
    meta: [{ title: "Aktifkan Akaun — Kalifah.my" }],
  }),
  ssr: false,
  component: AktifkanPage,
});

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}

function Kad({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl bg-card p-7 shadow-card md:p-8">{children}</div>;
}

type Phase = "loading" | "invalid" | "form" | "claiming" | "success" | "error" | "semak-emel";

type LaporanPreview = {
  valid: boolean;
  nama?: string;
  darjah?: number;
  already_claimed?: boolean;
  diagnostic_completed?: boolean;
  betul?: number | null;
  jumlah_menguasai?: number | null;
  jumlah_diperkukuh?: number | null;
  bocor_nama?: string | null;
  bocor_gejala?: string | null;
};

function LaporanCard({ laporan }: { laporan: LaporanPreview }) {
  const namaAnak = laporan.nama || "anak anda";
  const adaCounts = laporan.jumlah_menguasai != null || laporan.jumlah_diperkukuh != null;

  return (
    <div className="mb-6 space-y-4 rounded-2xl border border-border bg-muted/40 p-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          🧠 Analisis KALI
        </p>
        <p className="mt-1 text-sm font-extrabold text-foreground">
          KALI dah mula mengenali {namaAnak}
        </p>
        {laporan.betul != null ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {laporan.betul} jawapan pertama {namaAnak} memberi beberapa petunjuk penting.
          </p>
        ) : null}
      </div>

      {adaCounts ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
          {laporan.jumlah_menguasai != null ? (
            <span className="text-primary">🟢 {laporan.jumlah_menguasai} dikuasai</span>
          ) : null}
          {laporan.jumlah_diperkukuh != null ? (
            <span className="text-destructive">🔴 {laporan.jumlah_diperkukuh} perlu diperkukuhkan</span>
          ) : null}
        </div>
      ) : null}

      {laporan.bocor_nama ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            🔍 Antara yang KALI jumpa
          </p>
          <p className="mt-1 text-sm font-extrabold text-foreground">{laporan.bocor_nama}</p>
          {laporan.bocor_gejala ? (
            <p className="mt-1 text-sm text-muted-foreground">{laporan.bocor_gejala}</p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          🔒 KALI menemui beberapa perkara lagi
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Kemahiran lain yang perlu diperkuatkan</li>
          <li>• Apa yang patut {namaAnak} pelajari seterusnya</li>
          <li>• Latihan yang sesuai berdasarkan tahap {namaAnak}</li>
        </ul>
      </div>

      <p className="text-sm font-bold text-foreground">
        Jangan berhenti setakat tahu {namaAnak} lemah di mana. Biarkan KALI bantu {namaAnak} perbaikinya.
      </p>
    </div>
  );
}

function AktifkanPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [ralat, setRalat] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [emel, setEmel] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [menghantar, setMenghantar] = useState(false);
  const [laporan, setLaporan] = useState<LaporanPreview | null>(null);
  const paramsRef = useRef<{ child: string; token: string; darjah: string } | null>(null);
  const dahJalan = useRef(false);

  useEffect(() => {
    if (dahJalan.current) return;
    dahJalan.current = true;

    const sp = new URLSearchParams(window.location.search);
    const child = sp.get("child") ?? "";
    const token = sp.get("token") ?? "";
    const darjah = sp.get("darjah") ?? "";

    if (!child || !token) {
      setPhase("invalid");
      return;
    }
    paramsRef.current = { child, token, darjah };

    void (async () => {
      const [{ data: sessionData }, { data: laporanData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.rpc("kali_preview_laporan_tetamu" as never, {
          p_child_user_id: child,
          p_claim_token: token,
        } as never),
      ]);

      const lap = laporanData as LaporanPreview | null;
      if (lap?.valid) setLaporan(lap);

      if (sessionData.session?.user) {
        await buatClaim();
      } else {
        setPhase("form");
      }
    })();
  }, []);

  async function buatClaim() {
    const p = paramsRef.current;
    if (!p) return;
    setPhase("claiming");
    const { data, error } = await supabase.rpc("kali_claim_anak_tetamu" as never, {
      p_child_user_id: p.child,
      p_claim_token: p.token,
    } as never);
    if (error || data !== true) {
      setRalat("Pautan tidak sah, sudah luput, atau anak ini sudah diaktifkan sebelum ini.");
      setPhase("error");
      return;
    }
    setPhase("success");
    setTimeout(() => {
      window.location.href = `/harga?pakej=satu&darjah=${p.darjah || 1}`;
    }, 1200);
  }

  async function handleDaftar(e: FormEvent) {
    e.preventDefault();
    const p = paramsRef.current;
    if (!p || menghantar) return;
    setMenghantar(true);
    setRalat(null);

    const redirect = `${window.location.origin}/cuba-kali/aktifkan?child=${p.child}&token=${p.token}&darjah=${p.darjah}`;
    const { data, error } = await supabase.auth.signUp({
      email: emel.trim(),
      password: kataLaluan,
      options: {
        data: { name: nama.trim(), full_name: nama.trim() },
        emailRedirectTo: redirect,
      },
    });

    if (error) {
      setRalat(error.message);
      setMenghantar(false);
      return;
    }

    if (data.session) {
      await buatClaim();
      return;
    }

    setMenghantar(false);
    setPhase("semak-emel");
  }

  if (phase === "form") {
    const namaAnak = laporan?.nama || "anak anda";
    const adaLaporan = !!laporan?.diagnostic_completed;
    return (
      <AuthShell
        title={adaLaporan ? `Aktifkan KALI untuk ${namaAnak} — RM49` : "Aktifkan Akaun KALI"}
        subtitle={
          adaLaporan
            ? `Daftar untuk teruskan dan bantu ${namaAnak} perbaiki bahagian yang KALI kesan.`
            : "Daftar untuk lihat analisis penuh anak anda dan teruskan dengan KALI."
        }
      >
        {adaLaporan && laporan ? <LaporanCard laporan={laporan} /> : null}
        <form onSubmit={handleDaftar} className="space-y-4">
          <Field icon={User} label="Nama Ibu/Bapa" type="text" value={nama} onChange={setNama} placeholder="Nama penuh" autoComplete="name" />
          <Field icon={Mail} label="Emel" type="email" value={emel} onChange={setEmel} placeholder="contoh@email.com" autoComplete="email" />
          <Field icon={Lock} label="Kata Laluan" type="password" value={kataLaluan} onChange={setKataLaluan} placeholder="••••••••" autoComplete="new-password" />
          {ralat ? <p className="text-sm font-semibold text-destructive">{ralat}</p> : null}
          <button
            type="submit"
            disabled={menghantar}
            className="w-full rounded-2xl bg-primary px-5 py-3 font-display text-base font-extrabold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60"
          >
            {menghantar ? "Sedang mendaftar…" : adaLaporan ? `Aktifkan KALI untuk ${namaAnak} →` : "Daftar & Aktifkan →"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <PageShell>
      <Kad>
        {phase === "loading" || phase === "claiming" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Sedang menyemak…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sila tunggu sebentar.</p>
          </>
        ) : null}

        {phase === "success" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Berjaya! 🎉</h1>
            <p className="mt-2 text-sm text-muted-foreground">Menghantar anda ke halaman bayaran…</p>
          </>
        ) : null}

        {phase === "invalid" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Pautan tidak sah atau sudah luput</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sila buka semula pautan dari Telegram.</p>
          </>
        ) : null}

        {phase === "error" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Tidak dapat diaktifkan</h1>
            <p className="mt-2 text-sm text-muted-foreground">{ralat}</p>
            <Link
              to="/daftar"
              search={{ ref: undefined }}
              className="mt-5 inline-flex rounded-2xl bg-primary px-5 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-card"
            >
              Daftar akaun biasa →
            </Link>
          </>
        ) : null}

        {phase === "semak-emel" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Akaun dicipta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sila semak emel anda untuk pengesahan, kemudian buka pautan Telegram ini sekali lagi.
            </p>
          </>
        ) : null}
      </Kad>
    </PageShell>
  );
}
