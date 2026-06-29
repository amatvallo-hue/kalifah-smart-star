import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, MousePointerClick, ShoppingBag, Wallet, Coins, Share2, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/affiliate/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Affiliate — Kalifah.my" }] }),
  ssr: false,
  component: AffiliateDashboardPage,
});

interface Affiliate {
  id: string;
  nama: string;
  email: string;
  ref_code: string;
  custom_ref_code?: string;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
}

interface Jualan {
  id: string;
  jumlah_bayar: number;
  komisyen: number;
  status_bayar: string;
  created_at: string;
}

function rm(ringgit: number) {
  return `RM ${(ringgit ?? 0).toFixed(2)}`;
}

function AffiliateDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [aff, setAff] = useState<Affiliate | null>(null);
  const [jualan, setJualan] = useState<Jualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data: a } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!a) {
        setLoading(false);
        return;
      }
      setAff(a as Affiliate);
      const { data: j } = await supabase
        .from("affiliate_jualan")
        .select("id, jumlah_bayar, komisyen, status_bayar, created_at")
        .eq("affiliate_id", (a as Affiliate).id)
        .order("created_at", { ascending: false })
        .limit(50);
      setJualan((j as Jualan[]) ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const refLink = useMemo(() => {
    if (!aff) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kalifah.my";
    return `${origin}/daftar?ref=${aff.custom_ref_code ?? aff.ref_code}`;
  }, [aff]);

  const baki = aff ? (aff.total_komisyen ?? 0) - (aff.total_dibayar ?? 0) : 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!aff) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="font-display text-2xl font-extrabold">
            Anda belum berdaftar sebagai affiliate
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sertai program affiliate Kalifah.my dan dapatkan komisyen 10% bagi
            setiap jualan.
          </p>
          <Link
            to="/affiliate/daftar"
            className="mt-6 inline-block rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">
          Selamat datang, {aff.nama}
        </h1>
        <p className="mt-1 text-muted-foreground">Dashboard Affiliate Kalifah.my</p>

        {/* Ref link */}
        <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-5 shadow-soft">
          <div className="text-xs font-bold uppercase text-muted-foreground">
            Pautan Affiliate Anda
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={refLink}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Disalin" : "Salin Pautan"}
            </button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Pilih caption WhatsApp:</div>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Assalamualaikum! 👋 Risau anak tak belajar bila kita tak tengok? Di Kalifah.my, anak buat latih tubi sendiri & ibu bapa boleh pantau progress bila-bila masa 📊 Tenang hati, anak pun seronok belajar! Darjah 1-6 | 32,000+ soalan. Cuba percuma: ${refLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <Share2 className="h-4 w-4" />
              📱 Caption A
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Assalamualaikum! 👋 "Anak dah belajar ke belum?" — soalan yang ibu bapa selalu tertanya-tanya. Kini dengan Kalifah.my, anak buat latih tubi sendiri & ibu bapa boleh pantau terus dari phone! 📱 Darjah 1-6 | 32,000+ soalan. Cuba percuma: ${refLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <Share2 className="h-4 w-4" />
              📱 Caption B
            </a>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Kod: <span className="font-bold text-primary">{aff.custom_ref_code ?? aff.ref_code}</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard
            icon={<MousePointerClick className="h-5 w-5" />}
            label="Total Klik"
            value={String(aff.total_klik)}
          />
          <StatCard
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Total Jualan"
            value={String(aff.total_jualan)}
          />
          <StatCard
            icon={<Coins className="h-5 w-5" />}
            label="Komisyen"
            value={rm(aff.total_komisyen)}
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Baki Belum Dibayar"
            value={rm(baki)}
            highlight
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Conversion"
            value={aff.total_klik > 0 ? ((aff.total_jualan / aff.total_klik) * 100).toFixed(1) + '%' : '0%'}
          />
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          Sudah dibayar: <strong>{rm(aff.total_dibayar)}</strong>
        </div>

        {/* Jualan terkini */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-extrabold">Jualan Terkini</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarikh</TableHead>
                  <TableHead>Jumlah Bayar</TableHead>
                  <TableHead>Komisyen</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jualan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada jualan lagi. Kongsikan pautan anda!
                    </TableCell>
                  </TableRow>
                ) : (
                  jualan.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell>
                        {new Date(j.created_at).toLocaleDateString("ms-MY")}
                      </TableCell>
                      <TableCell>{rm(j.jumlah_bayar)}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {rm(j.komisyen)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            j.status_bayar === "dibayar"
                              ? "rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-700"
                              : "rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-bold text-yellow-700"
                          }
                        >
                          {j.status_bayar === "dibayar" ? "Dibayar" : "Belum Dibayar"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}
