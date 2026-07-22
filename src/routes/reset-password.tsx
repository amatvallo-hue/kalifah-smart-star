import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Kalifah.my" }] }),
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles hash → session; wait for it
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // also check current
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr("Password mesti sekurang-kurangnya 6 aksara.");
      return;
    }
    if (password !== confirm) {
      setErr("Password tidak sepadan.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setOk(true);
    setTimeout(() => navigate({ to: "/dashboard/ibu-bapa" }), 1500);
  }

  if (ok) {
    return (
      <AuthShell title="Berjaya!" subtitle="Password anda telah dikemaskini.">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Anda akan dilencongkan...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set Password Baru" subtitle="Masukkan password baru anda di bawah.">
      {!ready ? (
        <p className="text-center text-sm text-muted-foreground">Memuatkan sesi reset...</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field icon={Lock} label="Password Baru" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 aksara" autoComplete="new-password" />
          <Field icon={Lock} label="Sahkan Password" type="password" value={confirm} onChange={setConfirm} placeholder="Ulang password" autoComplete="new-password" />
          {err && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            <Lock className="h-5 w-5" />
            {loading ? "Menyimpan..." : "Kemaskini Password"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-extrabold text-primary hover:underline">Kembali ke log masuk</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
