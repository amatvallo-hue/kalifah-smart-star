import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin_/affiliates")({
  head: () => ({ meta: [{ title: "Admin Affiliates — Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliatesPage,
});

interface AffRow {
  id: string;
  nama: string;
  email: string;
  no_telefon: string;
  nama_bank: string;
  no_akaun_bank: string;
  ref_code: string;
  total_klik: number;
  total_jualan: number;
  total_komisyen_sen?: number | string | null;
  total_dibayar_sen?: number | string | null;
  total_komisyen?: number | string | null;
  total_dibayar?: number | string | null;
}

const toRinggit = (val: any) => `RM ${parseFloat(val || 0).toFixed(2)}`;

function rm(val: number) {
  return toRinggit(val);
}

function AdminAffiliatesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<AffRow[]>([]);
  const [marking, setMarking] = useState<string | null>(null);

  async function loadRows() {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("[admin/affiliates] raw data:", data, "error:", error);
    setRows((data as AffRow[]) ?? []);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if ((data as { role?: string } | null)?.role !== "admin") {
        navigate({ to: "/" });
        return;
      }
      setIsAdmin(true);
      await loadRows();
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  async function tandaDibayar(affId: string) {
    setMarking(affId);
    try {
      const row = rows.find((r) => r.id === affId);
      if (!row) {
        toast.error("Baris tidak ditemui");
        return;
      }
      const komisyen = parseFloat(String(row.total_komisyen ?? 0)) || 0;
      const dibayar = parseFloat(String(row.total_dibayar ?? 0)) || 0;

      const { error: updErr } = await supabase
        .from("affiliates")
        .update({
          total_dibayar: dibayar + komisyen,
          total_komisyen: 0,
        })
        .eq("id", affId);
      if (updErr) {
        console.error("affiliates update error:", updErr);
        toast.error(`Gagal: ${updErr.message}`);
        return;
      }

      const { error: jualanErr } = await supabase
        .from("affiliate_jualan")
        .update({ status_bayar: "dibayar" })
        .eq("affiliate_id", affId)
        .eq("status_bayar", "pending");
      if (jualanErr) {
        console.error("affiliate_jualan update error:", jualanErr);
        toast.error(`Gagal: ${jualanErr.message}`);
        return;
      }

      toast.success("Komisyen berjaya ditandakan dibayar!");
      setRows((prev) =>
        prev.map((r) =>
          r.id !== affId
            ? r
            : { ...r, total_komisyen: 0, total_dibayar: dibayar + komisyen },
        ),
      );
    } catch (e) {
      console.error(e);
      toast.error(`Gagal: ${(e as Error).message}`);
    } finally {
      setMarking(null);
    }
  }

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Admin — Affiliates</h1>
        <p className="mt-1 text-muted-foreground">
          Senarai semua affiliate dan komisyen mereka.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead className="text-right">Klik</TableHead>
                <TableHead className="text-right">Jualan</TableHead>
                <TableHead className="text-right">Komisyen</TableHead>
                <TableHead className="text-right">Dibayar</TableHead>
                <TableHead className="text-right">Baki</TableHead>
                <TableHead>Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Tiada affiliate berdaftar lagi.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const komisyen = parseFloat(String(r.total_komisyen ?? 0)) || 0;
                  const dibayar = parseFloat(String(r.total_dibayar ?? 0)) || 0;
                  const baki = komisyen - dibayar;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">{r.nama}</TableCell>
                      <TableCell className="text-sm">{r.email}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ref_code}</TableCell>
                      <TableCell className="text-xs">
                        <div>{r.nama_bank}</div>
                        <div className="text-muted-foreground">{r.no_akaun_bank}</div>
                      </TableCell>
                      <TableCell className="text-right">{r.total_klik}</TableCell>
                      <TableCell className="text-right">{r.total_jualan}</TableCell>
                      <TableCell className="text-right">{rm(komisyen)}</TableCell>
                      <TableCell className="text-right">{rm(dibayar)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {rm(baki)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          disabled={baki <= 0 || marking === r.id}
                          onClick={() => tandaDibayar(r.id)}
                        >
                          {marking === r.id ? "Memproses..." : "Tandakan Dibayar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
