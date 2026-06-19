import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Sparkles, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/affiliate/daftar")({
  head: () => ({
    meta: [
      { title: "Daftar Affiliate — Kalifah.my" },
      {
        name: "description",
        content:
          "Sertai program affiliate Kalifah.my dan dapatkan komisyen 10% untuk setiap jualan.",
      },
    ],
  }),
  ssr: false,
  component: DaftarAffiliatePage,
});

async function getNextCikguCode(): Promise<string> {
  const { data } = await supabase
    .from("affiliates")
    .select("custom_ref_code")
    .like("custom_ref_code", "cikgu%")
    .order("custom_ref_code", { ascending: false })
    .limit(1);

  const last = data?.[0]?.custom_ref_code;
  const lastNum = last ? parseInt(last.replace("cikgu", ""), 10) : 0;
  const nextNum = (isNaN(lastNum) ? 0 : lastNum) + 1;
  return `cikgu${String(nextNum).padStart(2, "0")}`;
}

function DaftarAffiliatePage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [noTelefon, setNoTelefon] = useState("");
  const [noAkaunBank, setNoAkaunBank] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ refCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const refLink = useMemo(() => {
    if (!success) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kalifah.my";
    return `${origin}/daftar?ref=${success.refCode}`;
  }, [success]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Cuba sign up dahulu (kalau email belum wujud)
      let userId: string | null = null;
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: nama, full_name: nama } },
      });
      if (signUpErr && !/already|registered|exists/i.test(signUpErr.message)) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }
      userId = signUpData?.user?.id ?? null;

      // Kalau email sudah wujud, cuba sign in
      if (!userId) {
        const { data: signInData, error: signInErr } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setError(
            "Email sudah berdaftar. Sila masukkan password yang betul untuk sambung pendaftaran.",
          );
          setLoading(false);
          return;
        }
        userId = signInData.user?.id ?? null;
      }

      const refCode = await getNextCikguCode();
      const { error: insErr } = await supabase.from("affiliates").insert({
        user_id: userId,
        nama,
        email,
        no_telefon: noTelefon,
        no_akaun_bank: noAkaunBank,
        nama_bank: namaBank,
        ref_code: refCode,
        custom_ref_code: refCode,
      });
      if (insErr) {
        if (/email/.test(insErr.message)) {
          setError("Email ini sudah didaftarkan sebagai affiliate.");
        } else {
          setError(insErr.message ?? "Gagal mendaftar affiliate.");
        }
        setLoading(false);
        return;
      }

      setSuccess({ refCode });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ralat tidak diketahui");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-3xl border border-primary/20 bg-card p-8 shadow-soft">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <h1 className="font-display text-2xl font-extrabold">
                Tahniah! Pendaftaran berjaya
              </h1>
            </div>
            <p className="mt-4 text-muted-foreground">
              Anda kini adalah affiliate Kalifah.my. Kongsikan pautan unik anda di
              media sosial atau WhatsApp dan dapatkan komisyen{" "}
              <strong>10%</strong> bagi setiap jualan.
            </p>

            <div className="mt-6 rounded-2xl bg-muted/40 p-4">
              <div className="text-xs font-bold uppercase text-muted-foreground">
                Kod Affiliate Anda
              </div>
              <div className="mt-1 font-display text-3xl font-extrabold text-primary">
                {success.refCode}
              </div>

              <div className="mt-4 text-xs font-bold uppercase text-muted-foreground">
                Pautan Unik
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  readOnly
                  value={refLink}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Disalin" : "Salin"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/affiliate/dashboard"
                className="rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
              >
                Ke Dashboard Affiliate
              </Link>
              <Link
                to="/"
                className="rounded-full border border-input px-6 py-3 font-display font-bold"
              >
                Kembali ke Laman Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            Program Affiliate Kalifah.my
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Daftar sebagai Affiliate
          </h1>
          <p className="mt-2 text-muted-foreground">
            Dapatkan komisyen <strong>10%</strong> untuk setiap jualan melalui
            pautan unik anda.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft"
        >
          <Field label="Nama Penuh" value={nama} onChange={setNama} required />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            label="Kata Laluan (untuk log masuk dashboard)"
            type="password"
            value={password}
            onChange={setPassword}
            required
            placeholder="Minimum 6 aksara"
          />
          <Field
            label="No. Telefon"
            value={noTelefon}
            onChange={setNoTelefon}
            required
            placeholder="01X-XXXXXXX"
          />
          <Field
            label="Nama Bank"
            value={namaBank}
            onChange={setNamaBank}
            required
            placeholder="cth: Maybank"
          />
          <Field
            label="No. Akaun Bank"
            value={noAkaunBank}
            onChange={setNoAkaunBank}
            required
          />

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Sedang mendaftar..." : "Daftar Sekarang"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Sudah ada akaun affiliate?{" "}
            <Link to="/affiliate/dashboard" className="font-bold text-primary hover:underline">
              Log masuk ke dashboard
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}
