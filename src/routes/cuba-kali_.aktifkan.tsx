import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { User, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

function sanitizeRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase().slice(0, 64);
  return /^[A-Z0-9_-]+$/.test(cleaned) ? cleaned : null;
}

export const Route = createFileRoute("/cuba-kali_/aktifkan")({
  head: () => ({
    meta: [{ title: "Analisis KALI — Kalifah.my" }],
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

type Phase = "loading" | "invalid" | "analisis" | "form" | "claiming" | "success" | "error" | "semak-emel" | "sudah-ada-akaun";

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

function AnalisisScreen({ laporan, onTeruskan }: { laporan: LaporanPreview; onTeruskan: () => void }) {
  const nama = laporan.nama || "anak anda";
  const adaBocor = !!laporan.bocor_nama;
  const adaCounts = laporan.jumlah_menguasai != null || laporan.jumlah_diperkukuh != null;

  return (
    <PageShell>
      <Kad>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">🧠 Analisis KALI</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground">
          KALI dah mula mengenali {nama}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {adaBocor
            ? `Daripada ${laporan.betul != null ? laporan.betul : "10"} jawapan pertama, KALI dah nampak satu perkara yang patut diberi perhatian.`
            : `Daripada ${laporan.betul != null ? laporan.betul : "10"} jawapan pertama, KALI dah mula nampak corak jawapan ${nama}.`}
        </p>

        {adaCounts ? (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
            {laporan.jumlah_menguasai != null ? (
              <span className="text-primary">🟢 {laporan.jumlah_menguasai} kemahiran dikuasai</span>
            ) : null}
            {laporan.jumlah_diperkukuh != null ? (
              <span className="text-destructive">🔴 {laporan.jumlah_diperkukuh} perlu diperkukuhkan</span>
            ) : null}
          </div>
        ) : null}

        {adaBocor ? (
          <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              🔍 KALI perasan {nama} masih belum konsisten dalam
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-foreground">{laporan.bocor_nama}</p>
            {laporan.bocor_gejala ? (
              <p className="mt-2 text-sm text-muted-foreground">{laporan.bocor_gejala}</p>
            ) : null}
          </div>
        ) : null}

        {adaBocor ? (
          <div className="mt-5">
            <p className="text-sm font-bold text-foreground">
              🌱 Kelemahan kecil lebih mudah diperbaiki bila kita tahu di mana ia bermula.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sebab itu KALI tidak hanya melihat berapa banyak {nama} betul atau salah. KALI cuba mengenal pasti
              bahagian yang patut diberi perhatian sekarang, sebelum bergerak kepada kemahiran seterusnya.
            </p>
          </div>
        ) : null}

        <div className="mt-5">
          <p className="text-sm font-bold text-foreground">❤️ Di sinilah KALI akan bantu {nama}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            KALI akan terus melihat jawapan {nama}, mengenal pasti kemahiran yang belum stabil, dan memilih
            latihan seterusnya berdasarkan apa yang {nama} perlukan — bukan sekadar bagi soalan secara rawak.
          </p>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {laporan.betul != null ? laporan.betul : "10"} soalan pertama ini baru permulaan. Semakin {nama} belajar
          bersama KALI, semakin jelas gambaran tentang apa yang {nama} dah kuasai, apa yang masih menghalangnya,
          dan apa yang patut dipelajari seterusnya.
        </p>

        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
          <p className="font-display text-base font-extrabold text-foreground">
            Teruskan perjalanan {nama} bersama KALI
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            RM49 / tahun{laporan.darjah ? ` · Darjah ${laporan.darjah}` : ""}
          </p>
          <button
            type="button"
            onClick={onTeruskan}
            className="mt-4 w-full rounded-2xl bg-primary px-5 py-3 font-display text-base font-extrabold text-primary-foreground shadow-card transition hover:opacity-90"
          >
            Aktifkan KALI untuk {nama} →
          </button>
        </div>
      </Kad>
    </PageShell>
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
  const [adaSesi, setAdaSesi] = useState(false);
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

    // Simpan ref affiliate (kalau ada, dari link claim yang dijana
    // kali-notify-laporan-siap) ke saluran localStorage sedia ada supaya
    // /harga (redirect selepas claim) dapat kredit affiliate dgn betul,
    // walaupun parent buka pautan Telegram ni pada device/browser lain
    // dari landing asal. Rujuk memory kali_flow_b_cuba_kali_guest_arch.
    const refFromLink = sanitizeRef(sp.get("ref"));
    if (refFromLink && typeof window !== "undefined") {
      window.localStorage.setItem("kalifah_ref", refFromLink);
    }

    void (async () => {
      const [{ data: sessionData }, { data: laporanData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.rpc("kali_preview_laporan_tetamu" as never, {
          p_child_user_id: child,
          p_claim_token: token,
        } as never),
      ]);

      const lap = laporanData as LaporanPreview | null;
      const punyaSesi = !!sessionData.session?.user;
      setAdaSesi(punyaSesi);

      if (lap?.valid && lap.diagnostic_completed) {
        // Sentiasa tunjuk analisis dulu -- claim/redirect harga HANYA lepas
        // parent tekan CTA sendiri, tak kira ada sesi aktif atau tidak.
        setLaporan(lap);
        setPhase("analisis");
      } else if (punyaSesi) {
        // Tiada laporan untuk ditunjuk (edge case) -- fallback ke claim terus.
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

  function handleTeruskan() {
    if (adaSesi) {
      void buatClaim();
    } else {
      setPhase("form");
    }
  }

  async function handleDaftar(e: FormEvent) {
    e.preventDefault();
    const p = paramsRef.current;
    if (!p || menghantar) return;
    setMenghantar(true);
    setRalat(null);

    // Sama pattern dgn daftar.tsx: lookup affiliate drpd ref tersimpan,
    // tanam affiliate_id/ref_code ke user_metadata (saluran sandaran,
    // kekal merentas device selagi guna akaun sama -- localStorage ialah
    // saluran utama, dah ditetapkan di useEffect atas).
    const storedRef =
      typeof window !== "undefined" ? sanitizeRef(window.localStorage.getItem("kalifah_ref")) : null;
    let affiliateId: string | null = null;
    let resolvedRefCode: string | null = null;
    if (storedRef) {
      const { data: aff } = await supabase
        .from("affiliates")
        .select("id, ref_code, custom_ref_code")
        .or(`ref_code.ilike.${storedRef},custom_ref_code.ilike.${storedRef}`)
        .maybeSingle();
      if (aff) {
        affiliateId = (aff as { id: string }).id;
        resolvedRefCode =
          (aff as { ref_code: string; custom_ref_code: string | null }).custom_ref_code ??
          (aff as { ref_code: string }).ref_code;
      }
    }

    const redirect =
      `${window.location.origin}/cuba-kali/aktifkan?child=${p.child}&token=${p.token}&darjah=${p.darjah}` +
      (storedRef ? `&ref=${storedRef}` : "");
    const { data, error } = await supabase.auth.signUp({
      email: emel.trim(),
      password: kataLaluan,
      options: {
        data: {
          name: nama.trim(),
          full_name: nama.trim(),
          ...(affiliateId ? { affiliate_id: affiliateId, ref_code: resolvedRefCode } : {}),
        },
        emailRedirectTo: redirect,
      },
    });

    if (error) {
      const sudahWujud = /already registered|already exists/i.test(error.message);
      if (sudahWujud) {
        setMenghantar(false);
        setPhase("sudah-ada-akaun");
        return;
      }
      setRalat(error.message);
      setMenghantar(false);
      return;
    }

    if (data.session) {
      await buatClaim();
      return;
    }

    const isNewAccount = !!data.user?.identities && data.user.identities.length > 0;
    if (!isNewAccount) {
      setMenghantar(false);
      setPhase("sudah-ada-akaun");
      return;
    }

    setMenghantar(false);
    setPhase("semak-emel");
  }

  function pergiLogMasuk() {
    const p = paramsRef.current;
    if (p && typeof window !== "undefined") {
      const balik = `/cuba-kali/aktifkan?child=${p.child}&token=${p.token}&darjah=${p.darjah}`;
      window.sessionStorage.setItem("kalifah_redirect_selepas_login", balik);
    }
    window.location.href = `/login?email=${encodeURIComponent(emel.trim())}`;
  }

  if (phase === "analisis" && laporan) {
    return <AnalisisScreen laporan={laporan} onTeruskan={handleTeruskan} />;
  }

  if (phase === "form") {
    const namaAnak = laporan?.nama || "anak anda";
    return (
      <AuthShell
        title={laporan ? `Daftar untuk teruskan ${namaAnak}` : "Aktifkan Akaun KALI"}
        subtitle={
          laporan
            ? `Langkah terakhir sebelum ${namaAnak} teruskan bersama KALI.`
            : "Daftar untuk lihat analisis penuh anak anda dan teruskan dengan KALI."
        }
      >
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
            {menghantar ? "Sedang mendaftar…" : "Daftar & Teruskan →"}
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

        {phase === "sudah-ada-akaun" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Anda dah ada akaun</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Emel ini dah didaftarkan di Kalifah.my. Log masuk dulu untuk teruskan aktifkan KALI untuk {laporan?.nama || "anak anda"}.
            </p>
            <button
              type="button"
              onClick={pergiLogMasuk}
              className="mt-5 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 font-display text-base font-extrabold text-primary-foreground shadow-card transition hover:opacity-90"
            >
              Log Masuk →
            </button>
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
