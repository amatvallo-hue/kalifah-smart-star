import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin_/funnel-kali")({
  head: () => ({
    meta: [
      { title: "Funnel Cuba KALI — Admin Kalifah.my" },
      {
        name: "description",
        content: "Dashboard funnel akuisisi Cuba KALI: landing, Telegram, bot dan diagnostic anak.",
      },
    ],
  }),
  ssr: false,
  component: AdminFunnelKaliPage,
});

interface Langkah {
  label: string;
  jumlah: number;
}
interface SumberLanding {
  campaign: string;
  jumlah: number;
}
interface SumberBot {
  source: string;
  jumlah: number;
}
interface FunnelData {
  tempoh_hari: number;
  langkah: Langkah[];
  status_tetamu: Langkah[];
  sumber_landing: SumberLanding[];
  sumber_bot: SumberBot[];
}

interface HarianRow {
  tarikh: string;
  landing: number;
  klik_telegram: number;
  bot_mula: number;
  darjah_dipilih: number;
  demo_selesai: number;
  anak_dicipta: number;
  diagnostic_selesai: number;
}

interface FunnelHarianData {
  tempoh_hari: number;
  harian: HarianRow[];
}

const TEMPOH: number[] = [7, 14, 30];

function formatTarikh(tarikh: string) {
  const d = new Date(tarikh);
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "long" }).format(d);
}

function AdminFunnelKaliPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tempohHari, setTempohHari] = useState(7);
  const [modePaparan, setModePaparan] = useState<"ringkasan" | "harian">("ringkasan");
  const [data, setData] = useState<FunnelData | null>(null);
  const [dataHarian, setDataHarian] = useState<FunnelHarianData | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data: profil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if ((profil as { role?: string } | null)?.role === "admin") {
        setIsAdmin(true);
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const muatFunnel = useCallback(async () => {
    setMemuat(true);
    setRalat(null);
    const { data: hasil, error } = await supabase.rpc(
      "kali_admin_funnel_cuba_kali" as never,
      { p_hari: tempohHari } as never,
    );
    if (error) {
      setRalat(error.message);
    } else {
      setData(hasil as unknown as FunnelData);
    }
    setMemuat(false);
  }, [tempohHari]);

  const muatHarian = useCallback(async () => {
    setMemuat(true);
    setRalat(null);
    const { data: hasil, error } = await supabase.rpc(
      "kali_admin_funnel_cuba_kali_harian" as never,
      { p_hari: tempohHari } as never,
    );
    if (error) {
      setRalat(error.message);
    } else {
      setDataHarian(hasil as unknown as FunnelHarianData);
    }
    setMemuat(false);
  }, [tempohHari]);

  useEffect(() => {
    if (!isAdmin) return;
    if (modePaparan === "harian") {
      void muatHarian();
    } else {
      void muatFunnel();
    }
  }, [isAdmin, modePaparan, tempohHari, muatFunnel, muatHarian]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="mt-3 text-muted-foreground">Akses ditolak.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link to="/admin" className="text-sm font-bold text-primary hover:underline">
          ← Admin Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Funnel Cuba KALI</h1>
            <p className="text-sm text-muted-foreground">
              Landing → Telegram → Bot → Diagnostic Anak
            </p>
          </div>
          <button
            type="button"
            onClick={() => void (modePaparan === "harian" ? muatHarian() : muatFunnel())}
            disabled={memuat}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {TEMPOH.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setTempohHari(h)}
              className={
                h === tempohHari
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-muted"
              }
            >
              {h} hari
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-border sm:inline-block" />
          <button
            type="button"
            onClick={() => setModePaparan("ringkasan")}
            className={
              modePaparan === "ringkasan"
                ? "rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                : "rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-muted"
            }
          >
            Ringkasan
          </button>
          <button
            type="button"
            onClick={() => setModePaparan("harian")}
            className={
              modePaparan === "harian"
                ? "rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                : "rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-muted"
            }
          >
            Harian
          </button>
        </div>

        {ralat && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {ralat}
          </p>
        )}

        {modePaparan === "harian" ? (
          <>
            <h2 className="mt-8 font-display text-lg font-bold">Langkah Funnel — Harian</h2>
            <div className="mt-2 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="border-b border-border px-3 py-2 font-bold">Tarikh</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Landing</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Klik Telegram</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Bot Mula</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Darjah Dipilih</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Demo Selesai</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Anak Dicipta</th>
                    <th className="border-b border-border px-3 py-2 font-bold">Diagnostic Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {(dataHarian?.harian ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-3 text-center italic text-muted-foreground">
                        Tiada data.
                      </td>
                    </tr>
                  ) : (
                    [...(dataHarian?.harian ?? [])]
                      .reverse()
                      .map((row, i) => (
                        <tr key={row.tarikh + i} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                          <td className="border-b border-border px-3 py-2 font-semibold">
                            {memuat ? "—" : formatTarikh(row.tarikh)}
                          </td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.landing}</td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.klik_telegram}</td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.bot_mula}</td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.darjah_dipilih}</td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.demo_selesai}</td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.anak_dicipta}</td>
                          <td className="border-b border-border px-3 py-2">{memuat ? "—" : row.diagnostic_selesai}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-8 font-display text-lg font-bold">Langkah Funnel</h2>
            <div className="mt-2 divide-y divide-border rounded-md border border-border">
              {(data?.langkah ?? []).map((l) => (
                <div key={l.label} className="flex items-baseline justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{l.label}</span>
                  <span className="font-display text-3xl font-bold text-foreground">
                    {memuat ? "—" : l.jumlah}
                  </span>
                </div>
              ))}
              {!memuat && (data?.langkah ?? []).length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">Tiada data.</p>
              )}
            </div>
          </>
        )}

        <h2 className="mt-8 font-display text-lg font-bold">Status Anak Tetamu (Sepanjang Masa)</h2>
        <p className="text-xs text-muted-foreground">
          sepanjang masa, bukan ikut tempoh dipilih
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(data?.status_tetamu ?? []).map((s) => (
            <div key={s.label} className="rounded-md border border-border bg-card px-3 py-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">
                {memuat ? "—" : s.jumlah}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-8 font-display text-lg font-bold">Sumber Trafik Landing</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(data?.sumber_landing ?? []).map((s) => {
            const adaTag = s.campaign !== "(tiada tag)" && s.campaign.trim() !== "";
            return (
              <span
                key={s.campaign}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  adaTag ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.campaign}: {s.jumlah}
              </span>
            );
          })}
          {!memuat && (data?.sumber_landing ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Tiada data.</p>
          )}
        </div>

        <h2 className="mt-8 font-display text-lg font-bold">Sumber Bot Telegram</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(data?.sumber_bot ?? []).map((s) => {
            const affiliate = s.source.includes("_ref_");
            return (
              <span
                key={s.source}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  affiliate ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}
              >
                {s.source}: {s.jumlah}
              </span>
            );
          })}
          {!memuat && (data?.sumber_bot ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Tiada data.</p>
          )}
        </div>
      </main>
    </div>
  );
}
