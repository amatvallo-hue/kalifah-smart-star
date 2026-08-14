import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Gift, Download } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/hadiah")({
  head: () => ({ meta: [{ title: "Kedai Hadiah — Admin Kalifah.my" }] }),
  ssr: false,
  component: AdminHadiahPage,
});

interface HadiahKatalog {
  id: string;
  nama: string;
  penerangan: string | null;
  kos_star: number;
  stok: number;
  imej_url: string | null;
  status: string;
}

interface Tebusan {
  id: string;
  child_user_id: string;
  parent_id: string | null;
  nama_hadiah_snapshot: string;
  kos_star: number;
  status: string;
  alamat_penghantaran: string | null;
  catatan_admin: string | null;
  no_tracking: string | null;
  created_at: string;
  profiles?: { no_telefon: string | null } | null;
}

interface ChildInfo {
  child_user_id: string;
  nama: string | null;
  darjah: number | null;
}

const STATUS_OPTS = ["menunggu", "diluluskan", "dihantar", "selesai", "ditolak"];

function AdminHadiahPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      if ((data as { role?: string } | null)?.role === "admin") {
        setIsAdmin(true);
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

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
      <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Link to="/admin" className="text-sm font-bold text-muted-foreground hover:text-primary">
          ← Kembali ke Admin Dashboard
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">🎁 Kedai Hadiah</h1>

        <Tabs defaultValue="tebusan" className="mt-6">
          <TabsList>
            <TabsTrigger value="tebusan">Tebusan Masuk</TabsTrigger>
            <TabsTrigger value="katalog">Katalog Hadiah</TabsTrigger>
          </TabsList>
          <TabsContent value="tebusan" className="mt-6">
            <TebusanTab />
          </TabsContent>
          <TabsContent value="katalog" className="mt-6">
            <KatalogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------- Tab: Tebusan Masuk ----------------
function TebusanTab() {
  const [rows, setRows] = useState<Tebusan[]>([]);
  const [children, setChildren] = useState<Record<string, ChildInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("menunggu");
  const [rejectFor, setRejectFor] = useState<Tebusan | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shipFor, setShipFor] = useState<Tebusan | null>(null);
  const [tracking, setTracking] = useState("");

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hadiah_tebusan")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal muat tebusan: " + error.message);
      setLoading(false);
      return;
    }
    const list = (data as Tebusan[] | null) ?? [];

    // parent_id FK points to auth.users(id), not public.profiles(id),
    // so PostgREST cannot auto-embed profiles. Fetch phone numbers separately.
    const parentIds = Array.from(new Set(list.map((r) => r.parent_id).filter(Boolean)));
    if (parentIds.length > 0) {
      const { data: parents } = await supabase
        .from("profiles")
        .select("id, no_telefon")
        .in("id", parentIds);
      const phoneMap = new Map<string, string | null>();
      for (const p of (parents as { id: string; no_telefon: string | null }[] | null) ?? []) {
        phoneMap.set(p.id, p.no_telefon);
      }
      for (const r of list) {
        if (r.parent_id) {
          r.profiles = { no_telefon: phoneMap.get(r.parent_id) ?? null };
        }
      }
    }

    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.child_user_id)));
    if (ids.length > 0) {
      const { data: kids } = await supabase
        .from("child_profiles")
        .select("child_user_id, nama, darjah")
        .in("child_user_id", ids);
      const map: Record<string, ChildInfo> = {};
      for (const c of (kids as ChildInfo[] | null) ?? []) map[c.child_user_id] = c;
      setChildren(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const filteredRows = useMemo(
    () => (filter === "semua" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    const { error } = await supabase.from("hadiah_tebusan").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("Gagal kemaskini: " + error.message);
      return;
    }
    toast.success("Status dikemaskini");
    reload();
  }

  async function sahkanDihantar() {
    if (!shipFor) return;
    setBusyId(shipFor.id);
    const { error } = await supabase
      .from("hadiah_tebusan")
      .update({ status: "dihantar", no_tracking: tracking.trim() || null })
      .eq("id", shipFor.id);
    setBusyId(null);
    if (error) {
      toast.error("Gagal kemaskini: " + error.message);
      return;
    }
    toast.success("Ditandakan dihantar");
    setShipFor(null);
    setTracking("");
    reload();
  }



  async function tolak() {
    if (!rejectFor) return;
    setBusyId(rejectFor.id);
    const { error } = await supabase.rpc("tolak_tebusan_hadiah", {
      p_tebusan_id: rejectFor.id,
      p_catatan: reason.trim() || null,
    });
    setBusyId(null);
    if (error) {
      toast.error("Gagal tolak: " + error.message);
      return;
    }
    toast.success("Tebusan ditolak & star dikembalikan");
    setRejectFor(null);
    setReason("");
    reload();
  }

  function escapeCsvCell(value: string | number | null | undefined): string {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportCsv() {
    const rowsToExport =
      filter === "semua"
        ? rows.filter((r) => r.status === "menunggu" || r.status === "diluluskan")
        : filteredRows;

    if (rowsToExport.length === 0) {
      toast.error("Tiada data untuk dieksport");
      return;
    }

    const headers = ["Nama Anak", "Darjah", "Hadiah", "Kos Star", "Alamat", "No Telefon", "Status", "Tarikh Sahkan", "No Tracking"];
    const lines = [headers.join(",")];

    for (const r of rowsToExport) {
      const c = children[r.child_user_id];
      const namaAnak = c?.nama || r.child_user_id.slice(0, 8);
      const darjah = c?.darjah ? `D${c.darjah}` : "";
      const tarikhSahkan = new Date(r.created_at).toLocaleDateString("ms-MY");
      const line = [
        escapeCsvCell(namaAnak),
        escapeCsvCell(darjah),
        escapeCsvCell(r.nama_hadiah_snapshot),
        escapeCsvCell(r.kos_star),
        escapeCsvCell(r.alamat_penghantaran),
        escapeCsvCell(r.profiles?.no_telefon),
        escapeCsvCell(r.status),
        escapeCsvCell(tarikhSahkan),
        escapeCsvCell(r.no_tracking),
      ].join(",");
      lines.push(line);
    }

    const csv = lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `kalifah-hadiah-tebusan-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`CSV dieksport (${rowsToExport.length} baris)`);
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["semua", ...STATUS_OPTS].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
              className="capitalize"
            >
              {s} {s !== "semua" ? `(${rows.filter((r) => r.status === s).length})` : `(${rows.length})`}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anak</TableHead>
              <TableHead>Hadiah</TableHead>
              <TableHead>Star</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Tarikh</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  Tiada rekod.
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((r) => {
              const c = children[r.child_user_id];
              return (
                <TableRow key={r.id}>
                  <TableCell>{c?.nama || r.child_user_id.slice(0, 8)} {c?.darjah ? `(D${c.darjah})` : ""}</TableCell>
                  <TableCell>{r.nama_hadiah_snapshot}</TableCell>
                  <TableCell>⭐ {r.kos_star}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={r.alamat_penghantaran ?? ""}>
                    <div>{r.alamat_penghantaran || "-"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      📞 {r.profiles?.no_telefon || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell className="text-xs">{r.no_tracking || "-"}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString("ms-MY")}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {r.status === "menunggu" && (
                      <Button size="sm" disabled={busyId === r.id} onClick={() => updateStatus(r.id, "diluluskan")}>
                        Luluskan
                      </Button>
                    )}
                    {r.status === "diluluskan" && (
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => {
                          setShipFor(r);
                          setTracking(r.no_tracking ?? "");
                        }}
                      >
                        Tandakan Dihantar
                      </Button>
                    )}
                    {r.status === "dihantar" && (
                      <Button size="sm" disabled={busyId === r.id} onClick={() => updateStatus(r.id, "selesai")}>
                        Tandakan Selesai
                      </Button>
                    )}
                    {r.status !== "ditolak" && r.status !== "selesai" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === r.id}
                        onClick={() => {
                          setRejectFor(r);
                          setReason("");
                        }}
                      >
                        Tolak
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Tebusan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Star ({rejectFor?.kos_star}) dan stok akan dikembalikan secara automatik.
          </p>
          <Textarea
            placeholder="Sebab penolakan (pilihan)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={tolak} disabled={busyId === rejectFor?.id}>
              Tolak & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shipFor} onOpenChange={(o) => !o && setShipFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tandakan Dihantar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hadiah: <span className="font-bold">{shipFor?.nama_hadiah_snapshot}</span>
          </p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Alamat:</span>{" "}
              <span className="font-medium">{shipFor?.alamat_penghantaran || "-"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">No. Telefon:</span>{" "}
              <span className="font-medium">{shipFor?.profiles?.no_telefon || "-"}</span>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>No. Tracking Pos (pilihan)</Label>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="cth: ERXXXXXXXXXMY"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipFor(null)}>
              Batal
            </Button>
            <Button onClick={sahkanDihantar} disabled={busyId === shipFor?.id}>
              Sahkan Dihantar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Tab: Katalog Hadiah ----------------
function KatalogTab() {
  const [rows, setRows] = useState<HadiahKatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HadiahKatalog | "new" | null>(null);
  const [nama, setNama] = useState("");
  const [penerangan, setPenerangan] = useState("");
  const [kosStar, setKosStar] = useState("");
  const [stok, setStok] = useState("");
  const [imejUrl, setImejUrl] = useState("");
  const [status, setStatus] = useState("aktif");
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hadiah_katalog")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Gagal muat katalog: " + error.message);
    setRows((data as HadiahKatalog[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  function openNew() {
    setEditing("new");
    setNama("");
    setPenerangan("");
    setKosStar("");
    setStok("");
    setImejUrl("");
    setStatus("aktif");
  }

  function openEdit(h: HadiahKatalog) {
    setEditing(h);
    setNama(h.nama);
    setPenerangan(h.penerangan ?? "");
    setKosStar(String(h.kos_star));
    setStok(String(h.stok));
    setImejUrl(h.imej_url ?? "");
    setStatus(h.status);
  }

  async function save() {
    if (!nama.trim()) {
      toast.error("Nama hadiah diperlukan");
      return;
    }
    const kos = Number(kosStar);
    const stokNum = Number(stok);
    if (!Number.isFinite(kos) || kos <= 0) {
      toast.error("Kos star mesti lebih daripada 0");
      return;
    }
    if (!Number.isFinite(stokNum) || stokNum < 0) {
      toast.error("Stok tidak sah");
      return;
    }
    setSaving(true);
    const payload = {
      nama: nama.trim(),
      penerangan: penerangan.trim() || null,
      kos_star: kos,
      stok: stokNum,
      imej_url: imejUrl.trim() || null,
      status,
    };
    const { error } =
      editing === "new"
        ? await supabase.from("hadiah_katalog").insert(payload)
        : await supabase.from("hadiah_katalog").update(payload).eq("id", (editing as HadiahKatalog).id);
    setSaving(false);
    if (error) {
      toast.error("Gagal simpan: " + error.message);
      return;
    }
    toast.success("Hadiah disimpan");
    setEditing(null);
    reload();
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>+ Tambah Hadiah</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Gambar</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kos Star</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  Tiada hadiah lagi. Tambah satu untuk mula.
                </TableCell>
              </TableRow>
            )}
            {rows.map((h) => (
              <TableRow key={h.id}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => h.imej_url && setPreviewUrl(h.imej_url)}
                    className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border ${h.imej_url ? "cursor-pointer hover:opacity-90" : "cursor-default bg-muted"}`}
                    disabled={!h.imej_url}
                    title={h.imej_url ? "Klik untuk besarkan" : "Tiada gambar"}
                  >
                    {h.imej_url ? (
                      <img
                        src={h.imej_url}
                        alt={h.nama}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Gift className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </TableCell>
                <TableCell>{h.nama}</TableCell>
                <TableCell>⭐ {h.kos_star}</TableCell>
                <TableCell>{h.stok}</TableCell>
                <TableCell>
                  {h.status === "aktif" ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Aktif</span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">Tidak Aktif</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(h)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Tambah Hadiah" : "Edit Hadiah"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nama Hadiah</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Beg Sekolah Kalifah" />
            </div>
            <div className="space-y-1.5">
              <Label>Penerangan (pilihan)</Label>
              <Textarea value={penerangan} onChange={(e) => setPenerangan(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kos Star</Label>
                <Input type="number" min="1" value={kosStar} onChange={(e) => setKosStar(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Stok</Label>
                <Input type="number" min="0" value={stok} onChange={(e) => setStok(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>URL Gambar (pilihan)</Label>
              <Input value={imejUrl} onChange={(e) => setImejUrl(e.target.value)} placeholder="https://…" />
              {imejUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setPreviewUrl(imejUrl.trim())}
                  className="mt-2 block overflow-hidden rounded-xl border border-border"
                  title="Klik untuk besarkan"
                >
                  <img
                    src={imejUrl.trim()}
                    alt="Pratonton gambar"
                    className="h-32 w-auto max-w-full object-contain"
                  />
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Paparan Gambar</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Gambar hadiah"
              className="max-h-[70vh] w-full rounded-2xl object-contain"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewUrl(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
