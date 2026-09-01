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
  | "semak-emel"
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

  // Cuba dapatkan preview laporan tetamu. Backend RPC ini kadangkala gagal/timeout
  // (bukan sekali insiden -- projek ni ada isu kestabilan PostgREST berterusan).
  // PRINSIP: backend gagal ≠ laporan tidak wujud. Kalau RPC gagal (error, bukan
  // sekadar respons "tiada laporan"), retry sekali; kalau dua-dua percubaan gagal,
  // JANGAN terus anggap tiada laporan dan JANGAN terus bawa pengguna ke signup
  // form -- kekalkan pengguna di sini dengan state gagal yang selamat + retry manual.
  async function muatLaporan(child: string, token: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const punyaSesiSemasa = !!sessionData.session?.user;
    setAdaSesi(punyaSesiSemasa);

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
    } else if (punyaSesiSemasa) {
      // RPC berjaya balas, tapi memang tiada laporan untuk ditunjuk (edge
      // case) -- fallback ke claim terus.
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
