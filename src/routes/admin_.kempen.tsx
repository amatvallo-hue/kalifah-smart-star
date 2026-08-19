import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminAffiliateNav } from "@/components/AdminAffiliateNav";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin_/kempen")({
  head: () => ({ meta: [{ title: "Kempen Belanja 10 Akaun — Admin Kalifah.my" }] }),
  ssr: false,
  component: AdminKempenPage,
});

type KempenInfo = {
  id: string;
  nama: string;
  slug: string;
  status: string;
  tarikh_mula: string | null;
  created_at: string | null;
};

type AffRow = {
  affiliate_id: string;
  nama: string;
  ref_code: string;
  slot_kuota: number;
  slot_digunakan: number;
  slot_kosong: number;
  telah_mula: number;
  aktif: number;
  at_risk: number;
  boleh_diganti: number;
};

type FamilyStatus = "claimed" | "active" | "at_risk" | "inactive_released" | "graduated";

type FamilyRow = {
  klaim_id: string;
  nama_anak: string;
  affiliate_id: string;
  darjah: number;
  status: FamilyStatus;
  boleh_diganti: boolean;
  claimed_at: string;
  released_at: string | null;
  akses_tamat_at: string | null;
  hari_aktif: number;
  sesi: number;
  kali_sesi: number;
};

type DashboardPayload = {
  ok: boolean;
  kempen: KempenInfo | null;
  affiliates: AffRow[];
  families: FamilyRow[];
};

function fmtDateTimeMY(ts: string | null | undefined): string {
  if (!ts) return "Tiada";
  const d = new Date(ts);
  const months = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

const STATUS_STYLE: Record<FamilyStatus, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  at_risk: { label: "At Risk", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  claimed: { label: "Diclaim", cls: "bg-sky-100 text-sky-800 border-sky-200" },
  graduated: { label: "Graduated", cls: "bg-violet-100 text-violet-800 border-violet-200" },
  inactive_released: { label: "Dilepaskan", cls: "bg-muted text-muted-foreground border-border" },
};

function AdminKempenPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if ((data as { role?: string } | null)?.role === "admin") {
        setIsAdmin(true);
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("kempen_admin_dashboard");
      if (error) {
        console.warn("[admin/kempen] kempen_admin_dashboard error:", error);
        setPayload(null);
      } else {
        setPayload((data ?? null) as DashboardPayload | null);
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  const affiliates = payload?.affiliates ?? [];
  const families = payload?.families ?? [];

  const totals = useMemo(() => {
    const sum = (pick: (a: AffRow) => number) => affiliates.reduce((acc, a) => acc + (pick(a) ?? 0), 0);
    return {
      slot: sum((a) => a.slot_kuota),
      diclaim: sum((a) => a.slot_digunakan),
      mula: sum((a) => a.telah_mula),
      aktif: sum((a) => a.aktif),
      atRisk: sum((a) => a.at_risk),
      kosong: sum((a) => a.slot_kosong),
      bolehDiganti: sum((a) => a.boleh_diganti),
    };
  }, [affiliates]);

  const refByAffiliate = useMemo(() => {
    const m = new Map<string, string>();
    affiliates.forEach((a) => m.set(a.affiliate_id, a.ref_code));
    return m;
  }, [affiliates]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="mt-3 text-muted-foreground">Akses ditolak.</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Memuat…</div>
      </div>
    );
  }

  const kempen = payload?.kempen ?? null;

  if (!kempen) {
    return (
      <div className="min-h-screen bg-background p-6">
        <AdminAffiliateNav />
        <h1 className="text-3xl font-extrabold">Kempen</h1>
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground shadow-soft">
          Tiada kempen aktif sekarang.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <AdminAffiliateNav />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{kempen.nama}</h1>
        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase text-emerald-800">
          {kempen.status}
        </span>
      </div>
      <p className="mt-1 text-muted-foreground">Tarikh mula: {fmtDateTimeMY(kempen.tarikh_mula)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="🎟️ Jumlah Slot" value={String(totals.slot)} />
        <StatCard label="✍️ Telah Diclaim" value={String(totals.diclaim)} />
        <StatCard label="🚀 Telah Mula Belajar" value={String(totals.mula)} />
        <StatCard label="✅ Aktif" value={String(totals.aktif)} />
        <StatCard label="⚠️ At Risk" value={String(totals.atRisk)} />
        <StatCard label="🕳️ Slot Kosong" value={String(totals.kosong)} />
        <StatCard label="🔁 Boleh Diganti" value={String(totals.bolehDiganti)} highlight />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-extrabold">Pecahan Per-Affiliate</h2>
        {affiliates.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground shadow-soft">
            Tiada affiliate dalam kempen ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {affiliates.map((a) => (
              <div key={a.affiliate_id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-extrabold text-foreground">
                    {a.ref_code}
                  </span>
                  <span className="font-display text-base font-extrabold">— {a.nama}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                  <Chip>{a.slot_kuota} slot</Chip>
                  <Dot />
                  <Chip>{a.slot_digunakan} diclaim</Chip>
                  <Dot />
                  <Chip>{a.telah_mula} mula belajar</Chip>
                  <Dot />
                  <Chip tone="emerald">{a.aktif} Aktif ✅</Chip>
                  <Dot />
                  <Chip tone="amber">{a.at_risk} At Risk ⚠️</Chip>
                  <Dot />
                  <Chip tone="muted">{a.slot_kosong} slot kosong</Chip>
                  <Dot />
                  <Chip tone="amber">{a.boleh_diganti} boleh diganti</Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-extrabold">Senarai Per-Family</h2>
        {families.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground shadow-soft">
            Tiada slot diclaim lagi.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 font-extrabold">Nama Anak</th>
                  <th className="px-4 py-3 font-extrabold">Affiliate</th>
                  <th className="px-4 py-3 font-extrabold">Darjah</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                  <th className="px-4 py-3 font-extrabold">Progress</th>
                  <th className="px-4 py-3 font-extrabold">Boleh Diganti</th>
                  <th className="px-4 py-3 font-extrabold">Tarikh Claim</th>
                </tr>
              </thead>
              <tbody>
                {families.map((f) => {
                  const st = STATUS_STYLE[f.status] ?? STATUS_STYLE.claimed;
                  return (
                    <tr key={f.klaim_id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-bold">{f.nama_anak}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-bold">
                          {refByAffiliate.get(f.affiliate_id) ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{f.darjah}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="min-w-[190px] px-4 py-3">
                        <MiniBar label="Hari aktif" value={f.hari_aktif} max={5} />
                        <MiniBar label="Sesi" value={f.sesi} max={10} />
                        <MiniBar label="KALI" value={f.kali_sesi} max={3} />
                      </td>
                      <td className="px-4 py-3">
                        {f.boleh_diganti ? (
                          <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                            Ya
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {fmtDateTimeMY(f.claimed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const v = Math.max(0, Math.min(value ?? 0, max));
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="text-[11px] font-bold text-muted-foreground">
        {label}: {value ?? 0}/{max}
      </div>
      <Progress value={(v / max) * 100} className="mt-0.5 h-1.5" />
    </div>
  );
}

function Dot() {
  return <span className="text-muted-foreground">·</span>;
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "emerald" | "amber" | "muted" }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-100 text-emerald-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-100 text-amber-800"
        : tone === "muted"
          ? "border-border bg-muted text-muted-foreground"
          : "border-border bg-card text-foreground";
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${cls}`}>{children}</span>;
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}
