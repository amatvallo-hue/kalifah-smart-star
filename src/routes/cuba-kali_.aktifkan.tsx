import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { User, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/cuba-kali_/aktifkan")({
  head: () => ({
    meta: [{ title: "Aktifkan Akaun — Kalifah.my" }],
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

type Phase = "loading" | "invalid" | "form" | "claiming" | "success" | "error" | "semak-emel";

function AktifkanPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [ralat, setRalat] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [emel, setEmel] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [menghantar, setMenghantar] = useState(false);
  const paramsRef = useRef<{ child: string; token: string; darjah: string } | null>(null);
  const dahJalan = useRef(false);

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

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await buatClaim();
      } else {
        setPhase("form");
      }
    })();
  }, []);

  async function buatClaim() {
    const p = paramsRef.current;
    if (!p) return;
    setPhase("claiming");
    const { data, error } = await supabase.rpc("kali_claim_anak_tetamu", {
      p_child_user_id: p.child,
      p_claim_token: p.token,
    });
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

  async function handleDaftar(e: FormEvent) {
    e.preventDefault();
    const p = paramsRef.current;
    if (!p || menghantar) return;
    setMenghantar(true);
    setRalat(null);

    const redirect = `${window.location.origin}/cuba-kali/aktifkan?child=${p.child}&token=${p.token}&darjah=${p.darjah}`;
    const { data, error } = await supabase.auth.signUp({
      email: emel.trim(),
      password: kataLaluan,
      options: {
        data: { name: nama.trim(), full_name: nama.trim() },
        emailRedirectTo: redirect,
      },
    });

    if (error) {
      setRalat(error.message);
      setMenghantar(false);
      return;
    }

    if (data.session) {
      await buatClaim();
      return;
    }

    setMenghantar(false);
    setPhase("semak-emel");
  }

  if (phase === "form") {
    return (
      <AuthShell
        title="Aktifkan Akaun KALI"
        subtitle="Daftar untuk lihat analisis penuh anak anda dan teruskan dengan KALI."
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
            {menghantar ? "Sedang mendaftar…" : "Daftar & Aktifkan →"}
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
