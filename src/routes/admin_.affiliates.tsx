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
  total_komisyen_sen: number;
  total_dibayar_sen: number;
}

function rm(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`;
}

function AdminAffiliatesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<AffRow[]>([]);
  const [marking, setMarking] = useState<string | null>(null);

  async function loadRows() {
    const { data } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });
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
      const { error } = await supabase.rpc("affiliate_tanda_dibayar", {
        _affiliate_id: affId,
      });
      if (error) {
        console.error("affiliate_tanda_dibayar error:", error);
        toast.error(`Gagal: ${error.message}`);
      } else {
        toast.success("Komisyen berjaya ditandakan sebagai dibayar");
        await loadRows();
      }
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
                  const baki = r.total_komisyen_sen - r.total_dibayar_sen;
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
                      <TableCell className="text-right">{rm(r.total_komisyen_sen)}</TableCell>
                      <TableCell className="text-right">{rm(r.total_dibayar_sen)}</TableCell>
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
