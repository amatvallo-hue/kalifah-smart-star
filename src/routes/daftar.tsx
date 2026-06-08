import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { UserPlus, User, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Daftar Akaun — Kalifah.my" },
      { name: "description", content: "Daftar akaun baru untuk Kalifah.my." },
    ],
  }),
  ssr: false,
  component: DaftarPage,
});

function DaftarPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/pilih-darjah` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name, display_name: name }, emailRedirectTo: redirectTo },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      navigate({ to: "/pilih-darjah" });
    } else {
      setInfo("Akaun dicipta. Sila semak emel anda untuk pengesahan, kemudian log masuk.");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Daftar Akaun Ibu Bapa" subtitle="Cipta akaun untuk memantau prestasi dan kemajuan anak anda.">
      <form onSubmit={onSubmit} className="space-y-4">
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
