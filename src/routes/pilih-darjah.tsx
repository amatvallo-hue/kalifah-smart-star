import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Sparkles, Star, LogOut, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { DARJAH_LIST, PAKEJ_LIST, HARGA_ASAL, type Darjah } from "@/lib/curriculum";

export const Route = createFileRoute("/pilih-darjah")({
  head: () => ({
    meta: [
      { title: "Pilih Darjah — Kalifah.my" },
      { name: "description", content: "Pilih tahap darjah anak untuk mula belajar di Kalifah.my." },
    ],
  }),
  ssr: false,
  component: DarjahDashboard,
});

function DarjahDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [upgradeFor, setUpgradeFor] = useState<Darjah | null>(null);
  const mata = usePoints();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const darjahAkses = profile?.darjah_akses ?? [];

  const metaName =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined);
  const emailLocal = user.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : "";
  const prettyEmail = emailLocal
    ? emailLocal.split(" ").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "";
  const displayName = (metaName && metaName.trim()) || prettyEmail || "Pelajar";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={firstName} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Assalamualaikum!
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              Selamat datang,
              <br />
              <span className="text-primary">{firstName}!</span> 🌟
            </h1>
            <p className="mt-3 max-w-lg text-base text-muted-foreground">
              Pilih darjah anda di bawah untuk mula belajar. Darjah berkunci memerlukan langganan.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/harga"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold/80 px-5 py-2.5 font-display text-sm font-extrabold text-gold-foreground shadow-soft"
              >
                <Star className="h-4 w-4 fill-gold-foreground" />
                Lihat Pakej Langganan
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-card/70 px-5 py-2.5 font-display text-sm font-extrabold text-muted-foreground shadow-soft transition hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Log Keluar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
                Pilih Darjah Anda
              </h2>
              <p className="text-sm text-muted-foreground">Darjah yang berkunci memerlukan langganan.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DARJAH_LIST.map((d, i) => {
              const hasAccess = darjahAkses.includes(Number(d.id));
              return (
                <DarjahCard
                  key={d.id}
                  darjah={d}
                  index={i}
                  hasAccess={hasAccess}
                  onLockedClick={() => setUpgradeFor(d)}
                />
              );
            })}
          </div>
        </section>

        <footer className="mt-12 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kalifah.my — Belajar dengan ceria & berkat.
        </footer>
      </main>

      {upgradeFor && <UpgradeModal darjah={upgradeFor} onClose={() => setUpgradeFor(null)} />}
    </div>
  );
}

function DarjahCard({
  darjah,
  index,
  hasAccess,
  onLockedClick,
}: {
  darjah: Darjah;
  index: number;
  hasAccess: boolean;
  onLockedClick: () => void;
}) {
  const palettes = [
    "from-primary to-primary-glow text-primary-foreground",
    "from-gold to-gold/80 text-gold-foreground",
    "from-sky-400 to-sky-300 text-sky-900",
    "from-rose-400 to-rose-300 text-rose-900",
    "from-violet-400 to-violet-300 text-violet-900",
    "from-teal-400 to-teal-300 text-teal-900",
  ];
  const tone = palettes[index % palettes.length];

  const inner = (
    <div
      className={`relative flex h-full flex-col justify-between gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition group-hover:-translate-y-1 group-hover:shadow-soft ${
        !hasAccess ? "opacity-80" : ""
      }`}
    >
      {!hasAccess && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 font-display text-[10px] font-extrabold uppercase tracking-wide text-gold-foreground shadow-soft">
          <Lock className="h-3 w-3" />
          Naik Taraf
        </div>
      )}
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${tone} shadow-soft transition group-hover:scale-110 ${
          !hasAccess ? "grayscale" : ""
        }`}
      >
        <span className="font-display text-4xl font-extrabold">{darjah.id}</span>
      </div>
      <div>
        <h3 className="font-display text-2xl font-extrabold text-foreground">
          {darjah.label} {!hasAccess && <span className="ml-1">🔒</span>}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{darjah.tagline}</p>
      </div>
      <div className="flex items-center justify-between">
        {!hasAccess ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Belum dilanggan
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1 font-display text-xs font-extrabold text-gold-foreground">
            <Star className="h-3.5 w-3.5 fill-gold-foreground" />
            Aktif
          </span>
        )}
      </div>
    </div>
  );

  if (!hasAccess) {
    return (
      <button type="button" onClick={onLockedClick} className="group cursor-pointer text-left">
        {inner}
      </button>
    );
  }
  return (
    <Link to="/darjah/$darjahId" params={{ darjahId: darjah.id }} className="group">
      {inner}
    </Link>
  );
}

function UpgradeModal({ darjah, onClose }: { darjah: Darjah; onClose: () => void }) {
  const satu = PAKEJ_LIST.find((p) => p.id === "satu")!;
  const bundle = PAKEJ_LIST.find((p) => p.id === "bundle")!;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-card p-8 shadow-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-glow shadow-soft">
          <Lock className="h-10 w-10 text-primary-foreground" />
        </div>
        <h3 className="mt-5 text-center font-display text-2xl font-extrabold text-foreground">
          {darjah.label} memerlukan langganan
        </h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Naik taraf untuk akses penuh nota, latih tubi, game, kuiz dan latihan.
        </p>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-foreground">{satu.nama}</span>
              <span className="text-xs text-muted-foreground line-through">RM{HARGA_ASAL}</span>
            </div>
            <p className="mt-1 font-display text-3xl font-extrabold text-primary">RM{satu.jumlahBayar}<span className="text-sm font-bold text-muted-foreground">/tahun</span></p>
          </div>
          <div className="rounded-2xl border-2 border-gold bg-gold/10 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-foreground">{bundle.nama} ⭐ Popular</span>
              <span className="text-xs text-muted-foreground line-through">RM{HARGA_ASAL * 6}</span>
            </div>
            <p className="mt-1 font-display text-3xl font-extrabold" style={{ color: "#7a5300" }}>
              RM{bundle.jumlahBayar}<span className="text-sm font-bold text-muted-foreground">/tahun</span>
            </p>
            <p className="text-xs font-bold text-gold-foreground/80">Jimat RM{bundle.jimat}!</p>
          </div>
        </div>

        <Link
          to="/harga"
          className="mt-6 block w-full rounded-full bg-gradient-to-r from-gold to-gold/80 px-6 py-3.5 text-center font-display text-base font-extrabold text-gold-foreground shadow-soft transition hover:opacity-90"
        >
          Lihat Semua Pakej
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-full px-6 py-2.5 font-display text-sm font-bold text-muted-foreground transition hover:text-foreground"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
