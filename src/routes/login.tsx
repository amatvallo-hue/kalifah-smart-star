import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { LogIn, Mail, Lock, Sparkles } from "lucide-react";
import { loginUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log Masuk — Kalifah.my" },
      { name: "description", content: "Log masuk ke portal pembelajaran Kalifah.my." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const login = useServerFn(loginUser);
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ data: { email, password } });
      await router.invalidate();
      // Hard navigate so the new session cookie is picked up by the loader
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal log masuk");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Selamat datang kembali!" subtitle="Log masuk untuk teruskan pembelajaran kamu.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="contoh@email.com" autoComplete="email" />
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
