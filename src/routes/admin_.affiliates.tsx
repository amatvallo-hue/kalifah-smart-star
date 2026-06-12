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
  nama: string | null;
  email: string | null;
  ref_code: string | null;
  total_komisyen_sen: number | string | null;
  total_dibayar_sen: number | string | null;
}

const toNum = (v: unknown) => {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};
const rm = (v: number) => `RM ${v.toFixed(2)}`;

function AdminAffiliatesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<AffRow[]>([]);
  const [marking, setMarking] = useState<string | null>(null);

  async function loadRows() {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast.error("Sesi tamat. Sila log masuk semula.");
        return;
      }
      const res = await fetch(
        "https://pgpkqbdyxoejwvubluqq.supabase.co/functions/v1/get-affiliates",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );
      const json = (await res.json()) as { ok: boolean; data?: AffRow[]; error?: string };
      if (!res.ok || !json.ok) {
        console.error("[admin/affiliates] load error:", json.error);
        toast.error(`Gagal muat: ${json.error ?? res.statusText}`);
        return;
      }
      console.log("[admin/affiliates] raw data:", json.data);
      setRows(json.data ?? []);
    } catch (e) {
      console.error("[admin/affiliates] load exception:", e);
      toast.error(`Gagal muat: ${e instanceof Error ? e.message : String(e)}`);
    }
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

  async function handleMark(id: string) {
    setMarking(id);
    try {
      const row = rows.find((r) => r.id === id);
      if (!row) {
        toast.error("Baris tidak ditemui");
        return;
      }
      const komisyen = toNum(row.total_komisyen);
      const dibayar = toNum(row.total_dibayar);

      const { error } = await supabase
        .from("affiliates")
        .update({ total_dibayar: dibayar + komisyen, total_komisyen: 0 })
        .eq("id", id);
      if (error) {
        toast.error(`Gagal: ${error.message}`);
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, total_komisyen: 0, total_dibayar: dibayar + komisyen } : r,
        ),
      );
      toast.success("Komisyen ditandakan dibayar!");
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
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">Admin — Affiliates</h1>
        <p className="mt-1 text-muted-foreground">Senarai affiliate dan komisyen.</p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead className="text-right">Komisyen</TableHead>
                <TableHead className="text-right">Dibayar</TableHead>
                <TableHead>Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Tiada affiliate berdaftar lagi.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const komisyen = toNum(r.total_komisyen);
                  const dibayar = toNum(r.total_dibayar);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">{r.nama}</TableCell>
                      <TableCell className="text-sm">{r.email}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ref_code}</TableCell>
                      <TableCell className="text-right">{rm(komisyen)}</TableCell>
                      <TableCell className="text-right">{rm(dibayar)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          disabled={komisyen <= 0 || marking === r.id}
                          onClick={() => handleMark(r.id)}
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
