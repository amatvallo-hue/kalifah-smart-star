import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LogIn, Mail, Lock, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CHILD_EMAIL_DOMAIN, normalizeUsername } from "@/lib/child-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log Masuk — Kalifah.my" },
      { name: "description", content: "Log masuk ke portal pembelajaran Kalifah.my." },
    ],
  }),
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"parent" | "child">("parent");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email =
      mode === "child"
        ? `${normalizeUsername(identifier)}@${CHILD_EMAIL_DOMAIN}`
        : identifier.trim();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(mode === "child" ? "Username atau password salah." : error.message);
      setLoading(false);
      return;
    }
    navigate({ to: "/pilih-darjah" });
  }

  return (
    <AuthShell title="Selamat datang kembali!" subtitle="Log masuk untuk teruskan pembelajaran.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("parent")}
          className={`rounded-full px-4 py-2 font-display text-sm font-extrabold transition ${
            mode === "parent" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"
          }`}
        >
          👨‍👩‍👧 Ibu Bapa
        </button>
        <button
          type="button"
          onClick={() => setMode("child")}
          className={`rounded-full px-4 py-2 font-display text-sm font-extrabold transition ${
            mode === "child" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"
          }`}
        >
          🧒 Anak
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "parent" ? (
          <Field icon={Mail} label="Email" type="email" value={identifier} onChange={setIdentifier} placeholder="contoh@email.com" autoComplete="email" />
        ) : (
          <Field icon={User} label="Username Anak" type="text" value={identifier} onChange={setIdentifier} placeholder="cth: aisyah123" autoComplete="username" />
        )}
        <Field icon={Lock} label="Kata Laluan" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-60"
        >
          <LogIn className="h-5 w-5" />
          {loading ? "Sedang log masuk..." : "Log Masuk"}
        </button>

        {mode === "parent" && (
          <p className="text-center text-xs">
            <Link to="/lupa-password" className="font-bold text-muted-foreground hover:text-primary hover:underline">
              Lupa password?
            </Link>
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Belum ada akaun?{" "}
          <Link to="/daftar" className="font-extrabold text-primary hover:underline">
            Daftar di sini
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <span className="font-display text-2xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Kalifah<span className="text-primary">.my</span>
          </span>
        </Link>

        <div className="w-full rounded-3xl bg-card p-7 shadow-card md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            Assalamualaikum
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-sm font-bold text-foreground">{label}</span>
      <span className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
        />
      </span>
    </label>
  );
}
