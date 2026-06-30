import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin_/affiliates")({
  head: () => ({ meta: [{ title: "Admin Affiliates — Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliates,
});

type AffRow = {
  id: string;
  nama: string;
  email: string;
  ref_code: string;
  custom_ref_code?: string;
  nama_bank: string;
  no_akaun_bank: string;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
  platform_promosi?: string[] | null;
};

function rm(ringgit: number) {
  return `RM ${(ringgit ?? 0).toFixed(2)}`;
}

function AdminAffiliates() {
  const [rows, setRows] = useState<AffRow[]>([]);
  const [jualanCounts, setJualanCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: affData } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      const affiliates = (affData ?? []) as AffRow[];
      setRows(affiliates);

      if (affiliates.length > 0) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const ids = affiliates.map((a) => a.id);
        const { data: jualanData } = await supabase
          .from("affiliate_jualan")
          .select("affiliate_id")
          .in("affiliate_id", ids)
          .gte("created_at", firstDay);

        const counts: Record<string, number> = {};
        for (const j of (jualanData ?? []) as { affiliate_id: string }[]) {
          counts[j.affiliate_id] = (counts[j.affiliate_id] || 0) + 1;
        }
        setJualanCounts(counts);
      }

      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const totalAffiliates = rows.length;
    const totalKomisyen = rows.reduce((sum, r) => sum + (r.total_komisyen ?? 0), 0);
    const totalDibayar = rows.reduce((sum, r) => sum + (r.total_dibayar ?? 0), 0);
    const belumDibayar = totalKomisyen - totalDibayar;
    return { totalAffiliates, totalKomisyen, totalDibayar, belumDibayar };
  }, [rows]);

  const markPaid = async (row: AffRow) => {
    console.log("markPaid called", row.id);
    await supabase
      .from("affiliates")
      .update({
        total_dibayar: row.total_dibayar + row.total_komisyen,
        total_komisyen: 0,
      })
      .eq("id", row.id);
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              total_dibayar: Number(r.total_dibayar || 0) + Number(r.total_komisyen || 0),
              total_komisyen: 0,
            }
          : r,
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Memuat…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-extrabold">Admin — Affiliates</h1>
      <p className="mt-1 text-muted-foreground">Senarai semua affiliate dan komisyen mereka.</p>

      {/* Quick nav */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/admin/challenge"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          🏆 Urus Challenge Bulanan
        </Link>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-muted"
        >
          ← Kembali ke Admin
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Affiliate" value={String(totals.totalAffiliates)} />
        <StatCard label="Total Komisyen Terkumpul" value={rm(totals.totalKomisyen)} />
        <StatCard label="Total Dibayar" value={rm(totals.totalDibayar)} />
        <StatCard label="Belum Dibayar" value={rm(totals.belumDibayar)} highlight />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Platform Promosi</TableHead>
              <TableHead className="text-right">Jualan Bulan Ini</TableHead>
              <TableHead className="text-right">Komisyen</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                  Tiada affiliate berdaftar lagi.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-bold">{r.nama}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell className="font-mono">{r.custom_ref_code ?? r.ref_code}</TableCell>
                  <TableCell>
                    {r.nama_bank} {r.no_akaun_bank}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(r.platform_promosi ?? []).map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                      {(!r.platform_promosi || r.platform_promosi.length === 0) && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{jualanCounts[r.id] ?? 0}</TableCell>
                  <TableCell className="text-right">
                    RM {Number(r.total_komisyen).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    RM {Number(r.total_dibayar).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => markPaid(r)}
                      className="rounded bg-amber-600 px-3 py-1 text-sm font-bold text-white hover:bg-amber-700"
                    >
                      Tandakan Dibayar
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
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
