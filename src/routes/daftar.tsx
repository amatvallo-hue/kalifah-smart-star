import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { UserPlus, User, Mail, Lock } from "lucide-react";
import { registerUser } from "@/lib/auth.functions";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Daftar Akaun — Kalifah.my" },
      { name: "description", content: "Daftar akaun baru untuk Kalifah.my." },
    ],
  }),
  component: DaftarPage,
});

function DaftarPage() {
  const register = useServerFn(registerUser);
  const navigate = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ data: { name, email, password } });
      await router.invalidate();
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Mari mulakan!" subtitle="Daftar akaun pelajar baharu untuk mengumpul bintang.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={User} label="Nama Pelajar" type="text" value={name} onChange={setName} placeholder="Ahmad bin Ali" autoComplete="name" />
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="contoh@email.com" autoComplete="email" />
        <Field icon={Lock} label="Kata Laluan" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 aksara" autoComplete="new-password" />

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
          <UserPlus className="h-5 w-5" />
          {loading ? "Sedang mendaftar..." : "Daftar Akaun"}
        </button>

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
