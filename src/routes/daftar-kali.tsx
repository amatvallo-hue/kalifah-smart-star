import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  Clock,
  BarChart2,
  Check,
  Copy,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SambungTelegram } from "@/components/SambungTelegram";
import { ciptaAkaunAnak, PARENT_SESSION_BACKUP_KEY } from "@/lib/child-auth";
import { AuthShell, Field } from "./login";

const DARJAH_OPTIONS = [
  { num: 1, color: "#F4C542" },
  { num: 2, color: "#F28C28" },
  { num: 3, color: "#2E9F5B" },
  { num: 4, color: "#3B82F6" },
  { num: 5, color: "#8B5CF6" },
  { num: 6, color: "#EF4444" },
] as const;


const STEPS = [
  { num: 1, label: "Daftar Akaun" },
  { num: 2, label: "Demo KALI" },
  { num: 3, label: "Sambung Telegram" },
  { num: 4, label: "Sesi Diagnostic KALI" },
  { num: 5, label: "Cadangan KALI Hari Ini" },
];

type DemoSoalan = {
  soalan_id: string;
  subjek: string | null;
  soalan: string;
  pilihan_a: string | null;
  pilihan_b: string | null;
  pilihan_c: string | null;
  pilihan_d: string | null;
  micro_skill_nama: string | null;
  micro_skill_id: string | null;
};

type DemoResult = {
  betul_count: number;
  total_count: number;
  skill_salah: string[];
};


function StepProgress({ active }: { active: number }) {
  return (
    <div className="w-full px-2 py-6">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-0 top-[1.125rem] h-0.5 w-full bg-gray-200" />
        <div
          className="absolute left-0 top-[1.125rem] h-0.5 bg-green-500 transition-all"
          style={{ width: `${((active - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const isActive = s.num === active;
          const isPast = s.num < active;
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-extrabold transition ${
                  isActive
                    ? "border-green-500 bg-green-500 text-white"
                    : isPast
                      ? "border-green-500 bg-white text-green-500"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {s.num}
              </div>
              <span
                className={`text-center text-[11px] font-bold leading-tight ${
                  isActive ? "text-green-600" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs font-medium text-muted-foreground">
        Selepas daftar, anak terus mula Sesi Diagnostic KALI PERCUMA — tiada bayaran.
      </p>
    </div>
  );
}

const SELEPAS_DAFTAR = "/kali-test/belajar-untuk-saya";

export const Route = createFileRoute("/daftar-kali")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Kenali Cara Anak Anda Belajar — Percuma dengan KALI — Kalifah.my" },
      {
        name: "description",
        content:
          "KALI menjalankan sesi diagnostic adaptif percuma untuk anak anda — kenal pasti kemahiran dikuasai & yang perlu diperkukuh dalam 10 soalan.",
      },
      {
        property: "og:title",
        content: "Kenali Cara Anak Anda Belajar — Percuma dengan KALI — Kalifah.my",
      },
      {
        property: "og:description",
        content:
          "KALI menjalankan sesi diagnostic adaptif percuma untuk anak anda — kenal pasti kemahiran dikuasai & yang perlu diperkukuh dalam 10 soalan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: DaftarKaliPage,
});

function sanitizeRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase().slice(0, 64);
  return /^[A-Z0-9_-]+$/.test(cleaned) ? cleaned : null;
}

function DaftarKaliPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [namaAnak, setNamaAnak] = useState("");
  const [darjah, setDarjah] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [sedangCiptaAnak, setSedangCiptaAnak] = useState(false);
  const [ralatAnak, setRalatAnak] = useState<string | null>(null);
  const [kredensialAnak, setKredensialAnak] = useState<
    { username: string; password: string; session: { access_token: string; refresh_token: string } | null } | null
  >(null);
  const [demoSoalan, setDemoSoalan] = useState<DemoSoalan[]>([]);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoJawapanTerkumpul, setDemoJawapanTerkumpul] = useState<
    { soalan_id: string; jawapan: string }[]
  >([]);
  const [demoPilih, setDemoPilih] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [showDemoResult, setShowDemoResult] = useState(false);
  const [demoMula, setDemoMula] = useState(false);

  function pilihDemo(huruf: string, soalanId: string) {
    if (demoPilih) return;
    setDemoPilih(huruf);
    const terkumpul = [...demoJawapanTerkumpul, { soalan_id: soalanId, jawapan: huruf }];
    setDemoJawapanTerkumpul(terkumpul);
    setTimeout(() => {
      setDemoPilih(null);
      if (demoIndex + 1 < demoSoalan.length) {
        setDemoIndex((i) => i + 1);
      } else {
        void hantarDemo(terkumpul);
      }
    }, 1200);
  }

  async function hantarDemo(terkumpul: { soalan_id: string; jawapan: string }[]) {
    const { data, error: rpcError } = await supabase.rpc("kali_score_demo_soalan", {
      p_jawapan: terkumpul,
    });
    const row = (Array.isArray(data) ? data[0] : data) as DemoResult | null;
    if (rpcError || !row) {
      setShowDemo(false);
      setShowTelegram(true);
      return;
    }
    const hasil: DemoResult = {
      betul_count: Number(row.betul_count ?? 0),
      total_count: Number(row.total_count ?? terkumpul.length),
      skill_salah: Array.isArray(row.skill_salah) ? row.skill_salah : [],
    };
    setDemoResult(hasil);
    setShowDemoResult(true);
    void supabase
      .from("analytics_events")
      .insert({
        event_name: "parent_demo_completed",
        user_id: null,
        metadata: {
          landing_page: "daftar-kali",
          auth_user_id: parentId,
          betul_count: hasil.betul_count,
          total_count: hasil.total_count,
        },
      })
      .then(() => {}, () => {});
  }


  // Selepas Telegram disambung (masih dalam sesi PARENT): cipta akaun anak
  // dan paparkan kredensial. Parent mesti klik "Teruskan" untuk tukar sesi.
  async function selepasTelegram() {
    if (sedangCiptaAnak) return;
    setRalatAnak(null);
    setSedangCiptaAnak(true);
    try {
      const result = await ciptaAkaunAnak(namaAnak, String(darjah ?? 1));
      if (!result.ok) {
        console.error("ciptaAkaunAnak gagal:", result.mesej);
        setRalatAnak(result.mesej ?? "Gagal cipta akaun anak.");
        return;
      }
      setKredensialAnak({
        username: result.username ?? "",
        password: result.generatedPassword ?? "",
        session: result.session
          ? {
              access_token: result.session.access_token,
              refresh_token: result.session.refresh_token,
            }
          : null,
      });
    } catch (e) {
      console.error("selepasTelegram gagal:", e);
      setRalatAnak("Ralat rangkaian semasa cipta akaun anak.");
    } finally {
      setSedangCiptaAnak(false);
    }
  }

  // Parent sahkan kredensial dah disimpan, kemudian tukar ke sesi anak.
  async function teruskanKeKali() {
    if (!kredensialAnak?.session) return;
    const { data: parentSess } = await supabase.auth.getSession();
    if (parentSess.session && typeof window !== "undefined") {
      window.sessionStorage.setItem(
        PARENT_SESSION_BACKUP_KEY,
        JSON.stringify({
          access_token: parentSess.session.access_token,
          refresh_token: parentSess.session.refresh_token,
        }),
      );
    }
    await supabase.auth.setSession({
      access_token: kredensialAnak.session.access_token,
      refresh_token: kredensialAnak.session.refresh_token,
    });
    navigate({ to: "/kali-test/belajar-untuk-saya" });
  }


  // Persist ?ref= so it survives email-confirmation round trips
  useEffect(() => {
    const clean = sanitizeRef(ref);
    if (!clean || typeof window === "undefined") return;
    window.localStorage.setItem("kalifah_ref", clean);

    const sessionKey = `klik_tracked_${clean}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    (async () => {
      await supabase.rpc("increment_affiliate_klik_by_ref", { p_ref: clean });
    })();
  }, [ref]);

  // Capture campaign attribution into localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
    ] as const;
    for (const key of keys) {
      const value = params.get(key);
      if (value && value.trim().length > 0) {
        window.localStorage.setItem(`kalifah_${key}`, value.trim());
      }
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!namaAnak.trim()) {
      setError("Sila isi nama anak.");
      return;
    }
    if (!darjah) {
      setError("Sila pilih darjah anak.");
      return;
    }
    setLoading(true);


    const storedRef =
      typeof window !== "undefined"
        ? sanitizeRef(window.localStorage.getItem("kalifah_ref"))
        : null;
    const affiliateRef = sanitizeRef(ref) ?? storedRef;

    let affiliateId: string | null = null;
    let resolvedRefCode: string | null = null;
    if (affiliateRef) {
      const { data: aff } = await supabase
        .from("affiliates")
        .select("id, ref_code, custom_ref_code")
        .or(`ref_code.ilike.${affiliateRef},custom_ref_code.ilike.${affiliateRef}`)
        .maybeSingle();
      if (aff) {
        affiliateId = (aff as { id: string }).id;
        resolvedRefCode =
          (aff as { ref_code: string; custom_ref_code: string | null }).custom_ref_code ??
          (aff as { ref_code: string }).ref_code;
      }
    }

    const attributionKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
    ] as const;
    const attribution: Record<string, string> = {};
    if (typeof window !== "undefined") {
      for (const key of attributionKeys) {
        const value = window.localStorage.getItem(`kalifah_${key}`);
        if (value && value.trim().length > 0) attribution[key] = value.trim();
      }
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}${SELEPAS_DAFTAR}` : undefined;
    const cleanPhone = phone.replace(/\D/g, "");
    const normalizedEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          display_name: name,
          ...(cleanPhone ? { no_telefon: cleanPhone, phone: cleanPhone } : {}),
          ...(affiliateId ? { affiliate_id: affiliateId, ref_code: resolvedRefCode } : {}),
          ...attribution,
        },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session && data.user && cleanPhone) {
      void supabase
        .from("profiles")
        .upsert({ id: data.user.id, no_telefon: cleanPhone }, { onConflict: "id" })
        .then(() => {}, () => {});
    }


    const isNewAccount = !!data.user?.identities && data.user.identities.length > 0;
    const signupTrackedKey = `signup_tracked_${normalizedEmail}`;
    const alreadyTracked =
      typeof window !== "undefined" && window.localStorage.getItem(signupTrackedKey) === "1";

    if (isNewAccount && !alreadyTracked && typeof window !== "undefined") {
      window.localStorage.setItem(signupTrackedKey, "1");
      if (typeof (window as any).gtag === "function") {
        (window as any).gtag("event", "sign_up", { method: "email" });
      }
      if (typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "CompleteRegistration");
      }
      void supabase
        .from("analytics_events")
        .insert({
          event_name: "signup",
          user_id: null,
          metadata: {
            method: "email",
            landing_page: "daftar-kali",
            auth_user_id: data.user?.id ?? null,
          },
        })
        .then(() => {}, () => {});
    }

    if (data.session && data.user) {
      setParentId(data.user.id);
      setShowTelegram(true);
      setLoading(false);
    } else {
      setInfo("Akaun dicipta. Sila semak emel anda untuk pengesahan, kemudian log masuk.");
      setLoading(false);
    }
  }

  if (kredensialAnak) {
    return (
      <main className="container mx-auto max-w-xl px-4 py-10">
        <section className="rounded-[2rem] border border-border bg-background p-6 shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Akaun anak dah siap
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Simpan maklumat log masuk ini — anak akan perlukan untuk log masuk semula di peranti
            atau hari lain.
          </p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Username", value: kredensialAnak.username },
              { label: "Password", value: kredensialAnak.password },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="font-display text-lg font-extrabold text-foreground">{row.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(row.value)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" /> Salin
                </button>
              </div>
            ))}
          </div>
          {kredensialAnak.session ? (
            <button
              type="button"
              onClick={() => void teruskanKeKali()}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft"
            >
              Teruskan ke Sesi Diagnostic KALI →
            </button>
          ) : (
            <Link
              to="/login"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft"
            >
              Pergi ke Log Masuk
            </Link>
          )}
        </section>
      </main>
    );
  }

  if (showTelegram && parentId) {
    return (
      <div>
        <SambungTelegram parentId={parentId} onLinked={() => void selepasTelegram()} />
        {sedangCiptaAnak ? (
          <p className="mt-4 animate-pulse text-center font-display text-sm font-bold text-primary">
            Menyediakan akaun anak...
          </p>
        ) : null}
        {ralatAnak ? (
          <div className="container mx-auto mt-4 max-w-xl px-4">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {ralatAnak} — Sila cuba lagi.
            </div>
            <button
              type="button"
              onClick={() => void selepasTelegram()}
              className="mt-3 w-full rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft"
            >
              Cuba cipta akaun anak semula
            </button>
          </div>
        ) : null}
      </div>
    );
  }


  return (
    <AuthShell
      title="Kenali Cara Anak Anda Belajar"
      subtitle="Daftar dalam 1 minit. KALI akan menjalankan sesi diagnostic adaptif dan terus kenal pasti kemahiran yang dikuasai serta yang perlu diperkukuh — kerana setiap anak belajar dengan cara yang berbeza."
    >
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> ~10 minit
        </span>
        <span className="inline-flex items-center gap-1">
          <BarChart2 className="h-3.5 w-3.5" /> Analisis terus
        </span>
      </div>

      <StepProgress active={1} />

      <div className="mb-5 rounded-2xl border border-border bg-muted/50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Contoh Cadangan KALI
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-sm font-bold text-foreground">Sesi Diagnostic</span>
          <span className="font-display text-3xl font-extrabold text-green-600">7/10 betul</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          <li className="flex items-center gap-2 text-sm font-medium text-foreground">
            🟢 3 kemahiran dikuasai dengan baik
          </li>
          <li className="flex items-center gap-2 text-sm font-medium text-foreground">
            🔴 2 kemahiran perlu perhatian
          </li>
        </ul>
        <div className="my-3 h-px w-full bg-border" />
        <p className="text-xs font-bold text-foreground">
          ➡️ Cadangan KALI: teruskan latihan esok
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-border bg-background p-4">
        <p className="font-display text-sm font-extrabold text-foreground">
          Apa yang anda akan dapat
        </p>
        <ul className="mt-2 space-y-1.5">
          {[
            "Sesi Diagnostic KALI (10 soalan adaptif)",
            "Analisis kemahiran automatik",
            "Cadangan KALI Hari Ini",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Check className="h-4 w-4 shrink-0 text-green-600" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-green-50 px-4 py-2.5 text-xs font-bold text-green-700">
          <span className="inline-flex items-center gap-1">✓ Sesi Diagnostic percuma</span>
          <span className="text-green-400">·</span>
          <span className="inline-flex items-center gap-1">✓ Analisis KALI</span>
          <span className="text-green-400">·</span>
          <span className="inline-flex items-center gap-1">✓ Tiada bayaran diperlukan</span>
        </div>
        <Field icon={User} label="Nama Penuh Ibu/Bapa" type="text" value={name} onChange={setName} placeholder="Ali bin Abu" autoComplete="name" />
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="contoh@email.com" autoComplete="email" />
        <Field icon={Phone} label="No. WhatsApp (pilihan)" type="tel" value={phone} onChange={setPhone} placeholder="cth: 0123456789" autoComplete="tel" />
        <Field icon={Lock} label="Kata Laluan" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 aksara" autoComplete="new-password" />
        <Field icon={GraduationCap} label="Nama Anak" type="text" value={namaAnak} onChange={setNamaAnak} placeholder="cth: Aisyah" autoComplete="off" />

        <div>
          <p className="mb-2 font-display text-sm font-extrabold text-foreground">Darjah Anak</p>
          <div className="grid grid-cols-3 gap-2">
            {DARJAH_OPTIONS.map((d) => {
              const selected = darjah === d.num;
              return (
                <button
                  type="button"
                  key={d.num}
                  onClick={() => setDarjah(d.num)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 font-display text-sm font-extrabold transition ${
                    selected
                      ? "text-white shadow-soft -translate-y-0.5"
                      : "border-border bg-background text-foreground hover:-translate-y-0.5"
                  }`}
                  style={selected ? { backgroundColor: d.color, borderColor: d.color } : undefined}
                >
                  <span className="text-lg">D{d.num}</span>
                  <span
                    className={`text-[10px] font-bold ${selected ? "text-white/90" : "text-muted-foreground"}`}
                  >
                    Darjah {d.num}
                  </span>
                </button>
              );
            })}
          </div>
        </div>


        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-60"
        >
          <UserPlus className="h-5 w-5" />
          {loading ? "Sedang mendaftar..." : "Mula Sesi Diagnostic KALI Percuma"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Percuma sepenuhnya untuk percubaan pertama. Tiada caj tersembunyi.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Sudah ada akaun?{" "}
          <Link to="/login" className="font-extrabold text-primary hover:underline">
            Log masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
