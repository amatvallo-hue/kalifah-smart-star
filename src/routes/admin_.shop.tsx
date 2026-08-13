import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import {
  KATEGORI_LABEL,
  KATEGORI_LIST,
  rm,
  STATUS_PESANAN_LABEL,
  type ShopKategori,
  type ShopPesanan,
  type ShopProduk,
} from "@/lib/shop";

export const Route = createFileRoute("/admin_/shop")({
  head: () => ({ meta: [{ title: "Kalifah Shop — Admin Kalifah.my" }] }),
  ssr: false,
  component: AdminShopPage,
});

const STATUS_PESANAN_OPTS = ["menunggu", "diluluskan", "dihantar", "selesai", "dibatalkan"];
const BUCKET = "shop-imej";

function AdminShopPage() {
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
      if ((data as { role?: string } | null)?.role === "admin") setIsAdmin(true);
      else navigate({ to: "/" });
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
        <h1 className="mt-2 font-display text-3xl font-extrabold">🛍️ Kalifah Shop</h1>

        <Tabs defaultValue="pesanan" className="mt-6">
          <TabsList>
            <TabsTrigger value="pesanan">Pesanan</TabsTrigger>
            <TabsTrigger value="produk">Produk</TabsTrigger>
          </TabsList>
          <TabsContent value="pesanan" className="mt-6">
            <PesananTab />
          </TabsContent>
          <TabsContent value="produk" className="mt-6">
            <ProdukTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------- Tab: Pesanan ----------------
function PesananTab() {
  const [rows, setRows] = useState<ShopPesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShopPesanan | null>(null);
  const [statusPesanan, setStatusPesanan] = useState("menunggu");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_pesanan")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Gagal muat pesanan: " + error.message);
    setRows((data as ShopPesanan[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  function openEdit(p: ShopPesanan) {
    setEditing(p);
    setStatusPesanan(p.status_pesanan);
    setTracking(p.no_tracking ?? "");
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("shop_pesanan")
      .update({ status_pesanan: statusPesanan, no_tracking: tracking.trim() || null })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal simpan: " + error.message);
      return;
    }
    toast.success("Pesanan dikemas kini");
    setEditing(null);
    reload();
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Pembeli</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Bayaran</TableHead>
              <TableHead>Pesanan</TableHead>
              <TableHead>Ref</TableHead>
              <TableHead>Tarikh</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada pesanan.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.kod_pesanan}</TableCell>
                <TableCell>{p.nama_pembeli}</TableCell>
                <TableCell>{p.telefon}</TableCell>
                <TableCell>{rm(p.jumlah_rm_sen)}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      p.status_bayaran === "dibayar"
                        ? "bg-green-100 text-green-700"
                        : p.status_bayaran === "gagal"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status_bayaran}
                  </span>
                </TableCell>
                <TableCell className="text-xs">
                  {STATUS_PESANAN_LABEL[p.status_pesanan] ?? p.status_pesanan}
                </TableCell>
                <TableCell className="text-xs">{p.ref_code ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {new Date(p.created_at).toLocaleDateString("ms-MY")}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    Urus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Urus Pesanan {editing?.kod_pesanan}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="whitespace-pre-line rounded-2xl bg-muted/50 p-3 text-muted-foreground">
              {editing?.nama_pembeli} · {editing?.telefon}
              {"\n"}
              {editing?.email ?? "tiada emel"}
              {"\n\n"}
              {editing?.alamat_penghantaran}
            </p>
            <div className="space-y-1.5">
              <Label>Status Pesanan</Label>
              <Select value={statusPesanan} onValueChange={setStatusPesanan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PESANAN_OPTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_PESANAN_LABEL[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>No. Tracking</Label>
              <Input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Contoh: EP123456789MY"
              />
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
    </div>
  );
}

// ---------------- Tab: Produk ----------------
function ProdukTab() {
  const [rows, setRows] = useState<ShopProduk[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShopProduk | "new" | null>(null);
  const [nama, setNama] = useState("");
  const [slug, setSlug] = useState("");
  const [penerangan, setPenerangan] = useState("");
  const [kategori, setKategori] = useState<ShopKategori>("sekolah");
  const [hargaRM, setHargaRM] = useState("");
  const [hantarRM, setHantarRM] = useState("");
  const [imejUrl, setImejUrl] = useState("");
  const [stok, setStok] = useState("");
  const [bonusStar, setBonusStar] = useState("");
  const [status, setStatus] = useState("aktif");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_produk")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Gagal muat produk: " + error.message);
    setRows((data as ShopProduk[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  function openNew() {
    setEditing("new");
    setNama("");
    setSlug("");
    setPenerangan("");
    setKategori("sekolah");
    setHargaRM("");
    setHantarRM("");
    setImejUrl("");
    setStok("");
    setBonusStar("");
    setStatus("aktif");
  }

  function openEdit(p: ShopProduk) {
    setEditing(p);
    setNama(p.nama);
    setSlug(p.slug);
    setPenerangan(p.penerangan ?? "");
    setKategori(p.kategori);
    setHargaRM((p.harga_sen / 100).toFixed(2));
    setHantarRM((p.kos_penghantaran_sen / 100).toFixed(2));
    setImejUrl(p.imej_url ?? "");
    setStok(String(p.stok));
    setBonusStar(String(p.bonus_star));
    setStatus(p.status);
  }

  function autoSlug(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function muatNaikImej(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error("Gagal muat naik: " + error.message);
      return;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setImejUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Gambar dimuat naik");
  }

  async function save() {
    if (!nama.trim()) {
      toast.error("Nama produk diperlukan");
      return;
    }
    const slugAkhir = (slug.trim() || autoSlug(nama)).trim();
    const harga = Math.round(Number(hargaRM) * 100);
    const hantar = Math.round(Number(hantarRM || "0") * 100);
    const stokNum = Number(stok || "0");
    const bonus = Number(bonusStar || "0");
    if (!slugAkhir) {
      toast.error("Slug tidak sah");
      return;
    }
    if (!Number.isFinite(harga) || harga <= 0) {
      toast.error("Harga mesti lebih daripada 0");
      return;
    }
    if (!Number.isFinite(hantar) || hantar < 0 || !Number.isFinite(stokNum) || stokNum < 0) {
      toast.error("Kos penghantaran / stok tidak sah");
      return;
    }
    setSaving(true);
    const payload = {
      nama: nama.trim(),
      slug: slugAkhir,
      penerangan: penerangan.trim() || null,
      kategori,
      harga_sen: harga,
      kos_penghantaran_sen: hantar,
      imej_url: imejUrl.trim() || null,
      stok: stokNum,
      bonus_star: Number.isFinite(bonus) ? bonus : 0,
      status,
    };
    const { error } =
      editing === "new"
        ? await supabase.from("shop_produk").insert(payload)
        : await supabase
            .from("shop_produk")
            .update(payload)
            .eq("id", (editing as ShopProduk).id);
    setSaving(false);
    if (error) {
      toast.error("Gagal simpan: " + error.message);
      return;
    }
    toast.success("Produk disimpan");
    setEditing(null);
    reload();
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>+ Tambah Produk</Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Hantar</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Bonus ⭐</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  Tiada produk lagi. Tambah satu untuk mula.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.nama}</TableCell>
                <TableCell className="text-xs">
                  {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                </TableCell>
                <TableCell>{rm(p.harga_sen)}</TableCell>
                <TableCell>{rm(p.kos_penghantaran_sen)}</TableCell>
                <TableCell>{p.stok}</TableCell>
                <TableCell>{p.bonus_star}</TableCell>
                <TableCell>
                  {p.status === "aktif" ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                      Aktif
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                      Tidak Aktif
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
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
            <DialogTitle>{editing === "new" ? "Tambah Produk" : "Edit Produk"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nama Produk</Label>
              <Input
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  if (editing === "new") setSlug(autoSlug(e.target.value));
                }}
                placeholder="Contoh: Beg Sekolah Kalifah"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="beg-sekolah-kalifah" />
            </div>
            <div className="space-y-1.5">
              <Label>Penerangan</Label>
              <Textarea value={penerangan} onChange={(e) => setPenerangan(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={kategori} onValueChange={(v) => setKategori(v as ShopKategori)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_LIST.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KATEGORI_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Harga (RM)</Label>
                <Input type="number" min="0" step="0.01" value={hargaRM} onChange={(e) => setHargaRM(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Kos Penghantaran (RM)</Label>
                <Input type="number" min="0" step="0.01" value={hantarRM} onChange={(e) => setHantarRM(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Stok</Label>
                <Input type="number" min="0" value={stok} onChange={(e) => setStok(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Bonus Bintang</Label>
                <Input type="number" min="0" value={bonusStar} onChange={(e) => setBonusStar(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gambar Produk</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void muatNaikImej(f);
                }}
              />
              <Input
                value={imejUrl}
                onChange={(e) => setImejUrl(e.target.value)}
                placeholder="atau tampal URL gambar"
              />
              {uploading && <p className="text-xs text-muted-foreground">Memuat naik…</p>}
              {imejUrl && (
                <img src={imejUrl} alt="Pratonton" className="h-24 w-24 rounded-xl object-cover" />
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
    </div>
  );
}
