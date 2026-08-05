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
  AlertTriangle,
  Check,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

const STEPS = [
  { num: 1, label: "Daftar Akaun" },
  { num: 2, label: "Nama Anak" },
  { num: 3, label: "Jawab MPT4" },
  { num: 4, label: "Pelan Pintar KALI™" },
];

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
        Selepas daftar, anak terus boleh duduk Percubaan MPT4 PERCUMA — tiada bayaran.
      </p>
    </div>
  );
}

const SELEPAS_DAFTAR = "/darjah/4/percubaan-mpt4";

export const Route = createFileRoute("/daftar-mpt4")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cuba PERCUMA Percubaan MPT4 — Kalifah.my" },
      {
        name: "description",
        content:
          "Daftar percuma dan biar anak anda duduk Percubaan MPT4 Darjah 4 — lengkap dengan laporan kelemahan KALI sebelum anda melanggan.",
      },
      { property: "og:title", content: "Cuba PERCUMA Percubaan MPT4 — Kalifah.my" },
      {
        property: "og:description",
        content:
          "Peperiksaan percubaan MPT4 percuma + laporan kelemahan KALI untuk anak anda. Daftar dalam 1 minit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: DaftarMpt4Page,
});

function sanitizeRef(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase().slice(0, 64);
  return /^[A-Z0-9_-]+$/.test(cleaned) ? cleaned : null;
}

function DaftarMpt4Page() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          display_name: name,
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

    const isNewAccount = !!data.user?.identities && data.user.identities.length > 0;
    const normalizedEmail = email.toLowerCase().trim();
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
          user_id: data.user?.id ?? null,
          metadata: { method: "email", landing_page: "daftar-mpt4" },
        })
        .then(() => {}, () => {});
    }

    if (data.session) {
      navigate({ to: "/darjah/$darjahId/percubaan-mpt4", params: { darjahId: "4" } });
    } else {
      setInfo("Akaun dicipta. Sila semak emel anda untuk pengesahan, kemudian log masuk.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Cuba PERCUMA Percubaan MPT4 Sekarang"
      subtitle="Daftar 1 minit — anak anda terus dapat peperiksaan percubaan MPT4 percuma serta laporan kelemahan KALI sebelum anda putuskan untuk melanggan."
    >
      <StepProgress active={1} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-green-50 px-4 py-2.5 text-xs font-bold text-green-700">
          <span className="inline-flex items-center gap-1">✓ Percubaan MPT4 percuma</span>
          <span className="text-green-400">·</span>
          <span className="inline-flex items-center gap-1">✓ Laporan kelemahan KALI</span>
          <span className="text-green-400">·</span>
          <span className="inline-flex items-center gap-1">✓ Tiada kad kredit</span>
        </div>
        <Field icon={User} label="Nama Penuh Ibu/Bapa" type="text" value={name} onChange={setName} placeholder="Ali bin Abu" autoComplete="name" />
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="contoh@email.com" autoComplete="email" />
        <Field icon={Lock} label="Kata Laluan" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 aksara" autoComplete="new-password" />

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
          {loading ? "Sedang mendaftar..." : "Mula Percubaan MPT4 Percuma"}
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
