import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mail } from "lucide-react";
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
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
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

type Phase =
  | "loading"
  | "invalid"
  | "analisis"
  | "form"
  | "claiming"
  | "success"
  | "error"
  | "gagal-preview"
  | "sudah-ada-akaun";

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

const KALI_BLUE = "#3654C9";
const KALI_BLUE_BORDER = "#D8DEF6";
const TIER_AMBER = "#C98A2E";
const TIER_AMBER_BG = "#F3E7CE";
const TIER_GREEN = "#2F7A50";
const FONT_SERIF = "'Source Serif 4', Georgia, serif";
const FONT_SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

function AnalisisScreen({ laporan, onTeruskan }: { laporan: LaporanPreview; onTeruskan: () => void }) {
  const nama = laporan.nama || "anak anda";
  const adaBocor = !!laporan.bocor_nama;
  const menguasai = laporan.jumlah_menguasai ?? null;
  const diperkukuh = laporan.jumlah_diperkukuh ?? null;
  const adaCounts = menguasai != null || diperkukuh != null;
  const jumlahDinilai = (menguasai ?? 0) + (diperkukuh ?? 0);

  return (
    <PageShell>
      <Kad>
        <p
          className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
          style={{ fontFamily: FONT_SANS }}
        >
          🧠 Analisis KALI
        </p>

        {/* 1. Apa yang berlaku — context sahaja, bukan hero */}
        <h1
          className="mt-1 text-2xl font-extrabold leading-snug text-foreground md:text-[1.75rem]"
          style={{ fontFamily: FONT_SERIF }}
        >
          KALI dah mula mengenali {nama}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: FONT_SANS }}>
          {laporan.betul != null
            ? `${laporan.betul} daripada 10 soalan pertama dijawab betul.`
            : "10 soalan pertama sudah dijawab."}
        </p>

        {/* 2. Apa yang KALI nampak — discrete chips, bukan bar berkadar */}
        {adaCounts && (
          <div className="mt-5" style={{ fontFamily: FONT_SANS }}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Apa yang KALI nampak
            </p>
            {jumlahDinilai > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {Array.from({ length: menguasai ?? 0 }).map((_, i) => (
                  <span
                    key={`m-${i}`}
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: TIER_GREEN }}
                  />
                ))}
                {Array.from({ length: diperkukuh ?? 0 }).map((_, i) => (
                  <span
                    key={`d-${i}`}
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: TIER_AMBER }}
                  />
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
              {menguasai != null && <span style={{ color: TIER_GREEN }}>🟢 {menguasai} sudah dikuasai</span>}
              {diperkukuh != null && (
                <span style={{ color: TIER_AMBER }}>🟠 {diperkukuh} perlu diperkukuhkan</span>
              )}
            </div>
          </div>
        )}

        {adaBocor && (
          <div
            className="mt-4 rounded-2xl border border-border bg-card p-5"
            style={{ borderLeftWidth: "3px", borderLeftColor: KALI_BLUE }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: KALI_BLUE, boxShadow: `0 0 0 3px ${KALI_BLUE_BORDER}` }}
              />
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: KALI_BLUE }}>
                Dikesan oleh KALI
              </p>
            </div>
            <span
              className="mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ backgroundColor: TIER_AMBER_BG, color: TIER_AMBER }}
            >
              Perlu Diperkukuhkan
            </span>
            <p
              className="mt-1.5 text-lg font-extrabold text-foreground"
              style={{ fontFamily: FONT_SANS }}
            >
              {laporan.bocor_nama}
            </p>
            {laporan.bocor_gejala ? (
              <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: FONT_SANS }}>
                {laporan.bocor_gejala}
              </p>
            ) : null}
          </div>
        )}

        {/* 3. Apa maksudnya — 1 blok ringkas */}
        <div className="mt-5" style={{ fontFamily: FONT_SANS }}>
          <p className="text-sm font-bold text-foreground">
            {adaBocor
              ? "🌱 Kelemahan kecil lebih mudah dibaiki apabila kita tahu di mana ia bermula."
              : `KALI mula nampak corak pembelajaran ${nama} — makin banyak sesi, makin jelas gambarannya.`}
          </p>
        </div>

        {/* 4. Apa patut dibuat selepas ini — 1 blok ringkas */}
        <div className="mt-5" style={{ fontFamily: FONT_SANS }}>
          <p className="text-sm text-muted-foreground">
            {adaBocor ? (
              <>
                ❤️ Latihan seterusnya akan bermula dengan{" "}
                <strong className="font-bold text-foreground">{laporan.bocor_nama}</strong> — berdasarkan apa
                yang {nama} perlukan, bukan soalan rawak.
              </>
            ) : (
              `❤️ KALI akan pilih latihan seterusnya berdasarkan apa yang ${nama} perlukan — bukan soalan rawak.`
            )}
          </p>
        </div>

        {/* 5. CTA — kekal sama destinasi & teks */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
          <p className="text-base font-extrabold text-foreground" style={{ fontFamily: FONT_SANS }}>
            Teruskan perjalanan {nama} bersama KALI
          </p>
          <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: FONT_SANS }}>
            RM49 / tahun{laporan.darjah ? ` · Darjah ${laporan.darjah}` : ""}
          </p>
          <button
            type="button"
            onClick={onTeruskan}
            className="mt-4 w-full rounded-2xl bg-primary px-5 py-3 text-base font-extrabold text-primary-foreground shadow-card transition hover:opacity-90"
            style={{ fontFamily: FONT_SANS }}
          >
            Aktifkan KALI untuk {nama} →
          </button>
        </div>
      </Kad>
    </PageShell>
  );
}

// Fasa "Claim-Before-Pay, Anonymous" — pengumpul EMEL SAHAJA sebelum bayaran.
// Reuse pattern EmailGateModal drpd /harga (harga.tsx): emel sahaja, tiada
// Nama/Kata Laluan di sini. Nama+Kata Laluan dikumpul SELEPAS bayaran via
// laluan lengkapkan-akaun sedia ada (bayaran.selesai.tsx -> LengkapkanAkaunCard
// -> edge function lengkapkan-akaun), TIDAK DIUBAH langsung dalam kerja ini.
function EmailGateKali({
  namaAnak,
  darjah,
  checking,
  err,
  onSubmit,
}: {
  namaAnak: string;
  darjah?: string;
  checking: boolean;
  err: string | null;
  onSubmit: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  return (
    <AuthShell
      title={`Aktifkan KALI untuk ${namaAnak}`}
      subtitle={`RM49 / 1 tahun${darjah ? ` · Darjah ${darjah}` : ""}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email);
        }}
        className="space-y-4"
      >
        <Field
          icon={Mail}
          label="Email Ibu/Ayah"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="contoh@email.com"
          autoComplete="email"
        />
        {err ? <p className="text-sm font-semibold text-destructive">{err}</p> : null}
        <button
          type="submit"
          disabled={checking}
          className="w-full rounded-2xl bg-primary px-5 py-3 font-display text-base font-extrabold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60"
        >
          {checking ? "Memproses…" : "Teruskan Pembayaran RM49 →"}
        </button>
        <p className="text-xs leading-snug text-muted-foreground">
          Email ini digunakan untuk resit dan akses akaun Kalifah selepas pembayaran.
        </p>
      </form>
    </AuthShell>
  );
}

function AktifkanPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [ralat, setRalat] = useState<string | null>(null);
  const [emel, setEmel] = useState("");
  const [menghantar, setMenghantar] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [laporan, setLaporan] = useState<LaporanPreview | null>(null);
  const [adaSesi, setAdaSesi] = useState(false);
  const paramsRef = useRef<{ child: string; token: string; darjah: string } | null>(null);
  const dahJalan = useRef(false);

  // Cuba dapatkan preview laporan tetamu. Backend RPC ini kadangkala gagal/timeout
  // (bukan sekali insiden -- projek ni ada isu kestabilan PostgREST berterusan).
  // PRINSIP: backend gagal ≠ laporan tidak wujud. Kalau RPC gagal (error, bukan
  // sekadar respons "tiada laporan"), retry sekali; kalau dua-dua percubaan gagal,
  // JANGAN terus anggap tiada laporan dan JANGAN terus bawa pengguna ke signup
  // form -- kekalkan pengguna di sini dengan state gagal yang selamat + retry manual.
  async function muatLaporan(child: string, token: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const sesiUser = sessionData.session?.user ?? null;
    // PENTING (susulan flow "Claim-Before-Pay, Anonymous"): sesi ANONYMOUS
    // (dicipta oleh EmailGateKali di bawah) TIDAK dikira sesi "log masuk
    // penuh" di sini. Kalau parent kembali dgn sesi anonymous lapuk (cth.
    // tab ditutup separuh jalan sebelum bayar selesai), kita nak papar
    // gate emel semula (bukan skip terus claim macam sesi penuh), supaya
    // emel utk resit/checkout tetap dikumpul semula. Sesi bukan-anonymous
    // (akaun sedia ada yang log masuk) kekal terus ke claim macam sebelum ini.
    const punyaSesiSahAsli = !!sesiUser && sesiUser.is_anonymous !== true;
    setAdaSesi(punyaSesiSahAsli);

    const cubaPreview = () =>
      supabase.rpc("kali_preview_laporan_tetamu" as never, {
        p_child_user_id: child,
        p_claim_token: token,
      } as never);

    let { data: laporanData, error: laporanError } = await cubaPreview();

    if (laporanError) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      ({ data: laporanData, error: laporanError } = await cubaPreview());
    }

    if (laporanError) {
      // Dua-dua percubaan gagal (network/backend) -- bukan tanda laporan tak
      // wujud. Kekal di sini, jangan dedahkan technical error.
      setPhase("gagal-preview");
      return;
    }

    const lap = laporanData as LaporanPreview | null;

    if (lap?.valid && lap.diagnostic_completed) {
      // Sentiasa tunjuk analisis dulu -- claim/redirect harga HANYA lepas
      // parent tekan CTA sendiri, tak kira ada sesi aktif atau tidak.
      setLaporan(lap);
      setPhase("analisis");
    } else if (punyaSesiSahAsli) {
      // RPC berjaya balas, tapi memang tiada laporan untuk ditunjuk (edge
      // case) -- fallback ke claim terus (HANYA utk sesi PENUH sedia ada).
      await buatClaim();
    } else {
      setPhase("form");
    }
  }

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

    void muatLaporan(child, token);
  }, []);

  function cubaLagiPreview() {
    const p = paramsRef.current;
    if (!p) return;
    setPhase("loading");
    void muatLaporan(p.child, p.token);
  }

  // buatClaim: panggil RPC kali_claim_anak_tetamu -- TIDAK DIUBAH langsung
  // (sama pemanggilan RPC macam sebelum ini). `onSuccess` pilihan
  // membolehkan caller tentukan apa berlaku SELEPAS claim berjaya:
  //  - default (tiada onSuccess): laluan LAMA -- parent yang dah log masuk
  //    dgn akaun PENUH sedia ada -> redirect ke /harga (TIDAK DIUBAH).
  //  - dgn onSuccess: laluan BAHARU (email-sahaja/anonymous) -> terus ke
  //    checkout tanpa singgah /harga, supaya EmailGateModal /harga tak
  //    tanya emel sekali lagi (emel dah dikumpul kat sini).
  async function buatClaim(onSuccess?: () => void) {
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
    if (onSuccess) {
      onSuccess();
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

  // mulaCheckoutAnon: panggil /api/checkout SEDIA ADA (route TIDAK DIUBAH)
  // terus drpd sini -- elak singgah skrin /harga supaya emel yg dah
  // dikumpul di EmailGateKali tak ditanya sekali lagi oleh EmailGateModal
  // /harga. Sertakan ref_code (dari localStorage "kalifah_ref", saluran
  // sedia ada) supaya komisyen affiliate (apply_payment_unlock, TIDAK
  // DIUBAH) tetap berfungsi -- trigger tu baca pesanan.ref_code terus,
  // bukan profiles.affiliate_id, jadi tiada signUp/user_metadata diperlukan.
  async function mulaCheckoutAnon(email: string, darjahRaw: string) {
    const darjahNum = Number(darjahRaw) || 1;
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      setMenghantar(false);
      setRalat("Sesi tidak sah. Sila cuba lagi.");
      setPhase("error");
      return;
    }
    const refCode =
      typeof window !== "undefined" ? sanitizeRef(window.localStorage.getItem("kalifah_ref")) : null;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pakej: "satu",
          darjah: [darjahNum],
          customer_email: email,
          ref_code: refCode,
        }),
      });
      const data = (await res.json()) as { url?: string; payment_url?: string; error?: string };
      const paymentUrl = data.url ?? data.payment_url;
      if (!res.ok || !paymentUrl) {
        setMenghantar(false);
        setRalat(data.error ?? "Gagal mula pembayaran. Sila cuba lagi.");
        setPhase("error");
        return;
      }
      window.location.assign(paymentUrl);
    } catch (e) {
      console.error("[cuba-kali/aktifkan] checkout anonymous gagal", e);
      setMenghantar(false);
      setRalat("Ralat rangkaian. Sila cuba lagi.");
      setPhase("error");
    }
  }

  // handleEmailGateSubmit: laluan baharu "Claim-Before-Pay, Anonymous".
  // 1) semak emel wujud via checkout_semak_emel_wujud (RPC SEDIA ADA, TIDAK
  //    DIUBAH) -- kalau emel dah ada akaun SEBENAR, JANGAN cipta anonymous
  //    account, arah parent log masuk (requirement #4).
  // 2) kalau emel belum wujud: signInAnonymously() (SEDIA ADA, TIDAK DIUBAH)
  //    -- guna sesi anonymous SEDIA ADA dulu kalau dah wujud drpd percubaan
  //    lepas (elak cipta berbilang akaun anonymous utk 1 percubaan claim).
  // 3) claim (kali_claim_anak_tetamu, TIDAK DIUBAH) guna auth.uid() anonymous
  //    yang baru terbentuk -- RPC ni cuma perlukan auth.uid() bukan-null,
  //    tiada semakan is_anonymous, jadi berfungsi tanpa perubahan (disahkan).
  // 4) terus checkout (/api/checkout, TIDAK DIUBAH) -- redirect ToyyibPay.
  async function handleEmailGateSubmit(emailRaw: string) {
    const p = paramsRef.current;
    if (!p) return;
    const trimmed = emailRaw.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailErr("Sila masukkan emel yang sah.");
      return;
    }
    setEmailErr(null);
    setMenghantar(true);

    const { data: wujud, error: semakErr } = await supabase.rpc("checkout_semak_emel_wujud", {
      p_email: trimmed,
    });
    if (semakErr) {
      setMenghantar(false);
      setEmailErr("Ralat menyemak emel. Sila cuba lagi.");
      return;
    }

    setEmel(trimmed);

    if (wujud === true) {
      setMenghantar(false);
      setPhase("sudah-ada-akaun");
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      const { error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) {
        setMenghantar(false);
        setEmailErr("Gagal mula sesi. Sila cuba lagi.");
        return;
      }
    }

    await buatClaim(() => {
      void mulaCheckoutAnon(trimmed, p.darjah);
    });
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
    const darjahParam = laporan?.darjah ? String(laporan.darjah) : paramsRef.current?.darjah;
    return (
      <EmailGateKali
        namaAnak={namaAnak}
        darjah={darjahParam}
        checking={menghantar}
        err={emailErr}
        onSubmit={handleEmailGateSubmit}
      />
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

        {phase === "gagal-preview" ? (
          <>
            <h1 className="font-display text-2xl font-extrabold text-foreground">Analisis KALI belum dapat dimuatkan</h1>
            <p className="mt-2 text-sm text-muted-foreground">Cuba semula.</p>
            <button
              type="button"
              onClick={cubaLagiPreview}
              className="mt-5 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 font-display text-base font-extrabold text-primary-foreground shadow-card transition hover:opacity-90"
            >
              Cuba Lagi →
            </button>
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
      </Kad>
    </PageShell>
  );
}
