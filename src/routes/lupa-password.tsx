import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/lupa-password")({
  head: () => ({ meta: [{ title: "Lupa Password — Kalifah.my" }] }),
  ssr: false,
  component: LupaPasswordPage,
});

function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setInfo("Pautan reset telah dihantar ke emel anda. Sila semak inbox & folder spam.");
  }

  return (
    <AuthShell title="Lupa Password?" subtitle="Masukkan emel anda untuk dapatkan pautan reset password.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="contoh@email.com" autoComplete="email" />
        {err && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">{err}</div>}
        {info && <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">{info}</div>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          <Send className="h-5 w-5" />
          {loading ? "Menghantar..." : "Hantar Pautan Reset"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Ingat password? <Link to="/login" className="font-extrabold text-primary hover:underline">Log masuk</Link>
        </p>
      </form>
    </AuthShell>
  );
}
