import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import {
  listAffiliates,
  markAffiliatePaid,
  type AdminAffiliateRow,
} from "@/lib/admin-affiliates.functions";

export const Route = createFileRoute("/admin_/affiliates")({
  head: () => ({ meta: [{ title: "Admin Affiliates — Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliatesPage,
});

const rm = (v: number) => `RM ${v.toFixed(2)}`;

function AdminAffiliatesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchList = useServerFn(listAffiliates);
  const markPaid = useServerFn(markAffiliatePaid);

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<AdminAffiliateRow[]>([]);
  const [marking, setMarking] = useState<string | null>(null);

  async function getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
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
      try {
        const accessToken = await getToken();
        const list = await fetchList({ data: { accessToken } });
        setRows(list);
      } catch (e) {
        toast.error(`Gagal muat: ${(e as Error).message}`);
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate, fetchList]);

  async function handleMark(id: string) {
    setMarking(id);
    try {
      const accessToken = await getToken();
      const res = await markPaid({ data: { accessToken, id } });
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, total_komisyen: res.total_komisyen, total_dibayar: res.total_dibayar }
            : r,
        ),
      );
      toast.success("Komisyen ditandakan dibayar!");
    } catch (e) {
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
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{r.nama}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="font-mono text-sm">{r.ref_code}</TableCell>
                    <TableCell className="text-right">{rm(r.total_komisyen)}</TableCell>
                    <TableCell className="text-right">{rm(r.total_dibayar)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={r.total_komisyen <= 0 || marking === r.id}
                        onClick={() => handleMark(r.id)}
                      >
                        {marking === r.id ? "Memproses..." : "Tandakan Dibayar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
