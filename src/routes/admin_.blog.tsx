import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Newspaper, Plus, Eye } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MarkdownArtikel } from "@/components/blog/MarkdownArtikel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/blog")({
  head: () => ({ meta: [{ title: "Blog — Admin Kalifah.my" }] }),
  ssr: false,
  component: AdminBlogPage,
});

interface Artikel {
  id: string;
  slug: string;
  tajuk: string;
  ringkasan: string | null;
  kandungan_markdown: string | null;
  gambar_utama_url: string | null;
  gambar_utama_alt: string | null;
  kategori: string | null;
  status: string;
  tarikh_terbit: string | null;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function janaSlug(tajuk: string) {
  return tajuk
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type FormState = {
  id: string | null;
  slug: string;
  tajuk: string;
  ringkasan: string;
  kandungan_markdown: string;
  gambar_utama_url: string;
  gambar_utama_alt: string;
  kategori: string;
  meta_title: string;
  meta_description: string;
  status: "draf" | "published";
  asalStatus: "draf" | "published";
};

const KOSONG: FormState = {
  id: null,
  slug: "",
  tajuk: "",
  ringkasan: "",
  kandungan_markdown: "",
  gambar_utama_url: "",
  gambar_utama_alt: "",
  kategori: "",
  meta_title: "",
  meta_description: "",
  status: "draf",
  asalStatus: "draf",
};

function AdminBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(KOSONG);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirmTerbit, setConfirmTerbit] = useState(false);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_artikel")
      .select(
        "id, slug, tajuk, ringkasan, kandungan_markdown, gambar_utama_url, gambar_utama_alt, kategori, status, tarikh_terbit, updated_at, meta_title, meta_description",
      )
      .order("updated_at", { ascending: false });
    if (error) toast.error("Gagal muat artikel: " + error.message);
    setItems((data ?? []) as Artikel[]);
    setLoading(false);
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
      if ((data as { role?: string } | null)?.role === "admin") {
        setIsAdmin(true);
        await loadItems();
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  function bukaBaharu() {
    setForm(KOSONG);
    setOpen(true);
  }

  function bukaEdit(a: Artikel) {
    setForm({
      id: a.id,
      slug: a.slug,
      tajuk: a.tajuk,
      ringkasan: a.ringkasan ?? "",
      kandungan_markdown: a.kandungan_markdown ?? "",
      gambar_utama_url: a.gambar_utama_url ?? "",
      gambar_utama_alt: a.gambar_utama_alt ?? "",
      kategori: a.kategori ?? "",
      meta_title: a.meta_title ?? "",
      meta_description: a.meta_description ?? "",
      status: a.status === "published" ? "published" : "draf",
      asalStatus: a.status === "published" ? "published" : "draf",
    });
    setOpen(true);
  }

  function validate(): string | null {
    if (!form.tajuk.trim()) return "Tajuk wajib diisi.";
    if (!SLUG_RE.test(form.slug))
      return "Format slug salah. Guna huruf kecil, nombor dan tanda sengkang sahaja (contoh: tips-matematik-darjah-4).";
    if (!form.ringkasan.trim()) return "Ringkasan wajib diisi.";
    if (!form.kandungan_markdown.trim()) return "Kandungan markdown wajib diisi.";
    const adaUrl = !!form.gambar_utama_url.trim();
    const adaAlt = !!form.gambar_utama_alt.trim();
    if (adaUrl !== adaAlt)
      return "Gambar utama: URL dan teks alt mesti diisi kedua-duanya (atau kosongkan kedua-duanya).";
    return null;
  }

  async function submit() {
    const ralat = validate();
    if (ralat) {
      toast.error(ralat);
      return;
    }
    if (form.status === "published" && form.asalStatus !== "published") {
      setConfirmTerbit(true);
      return;
    }
    await simpan();
  }

  async function simpan() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      tajuk: form.tajuk.trim(),
      ringkasan: form.ringkasan.trim(),
      kandungan_markdown: form.kandungan_markdown,
      gambar_utama_url: form.gambar_utama_url.trim() || null,
      gambar_utama_alt: form.gambar_utama_alt.trim() || null,
      kategori: form.kategori.trim() || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      status: form.status,
    };
    // Slug dikunci oleh trigger DB selepas published — hanya hantar bila belum terbit.
    if (form.asalStatus !== "published") payload.slug = form.slug.trim();

    const res = form.id
      ? await supabase.from("blog_artikel").update(payload).eq("id", form.id)
      : await supabase.from("blog_artikel").insert(payload);

    setSaving(false);
    if (res.error) {
      const msg = res.error.message.includes("duplicate") || res.error.code === "23505"
        ? "Slug ini sudah wujud. Sila guna slug lain."
        : res.error.message;
      toast.error("Gagal simpan: " + msg);
      return;
    }
    toast.success(form.id ? "Artikel dikemaskini." : "Artikel disimpan.");
    setOpen(false);
    setConfirmTerbit(false);
    await loadItems();
  }

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const slugDikunci = form.asalStatus === "published";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-foreground">
            <Newspaper className="h-6 w-6" style={{ color: "#1B8A5A" }} />
            Blog CMS
          </h1>
          <Button onClick={bukaBaharu} style={{ backgroundColor: "#1B8A5A" }}>
            <Plus className="mr-1 h-4 w-4" /> Artikel Baharu
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Tiada artikel lagi.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tajuk</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Terbit / Kemaskini</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold">{a.tajuk}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.slug}</TableCell>
                      <TableCell>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                          style={{
                            backgroundColor: a.status === "published" ? "#1B8A5A" : "#F5A623",
                          }}
                        >
                          {a.status === "published" ? "Published" : "Draf"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{a.kategori ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.tarikh_terbit
                          ? new Date(a.tarikh_terbit).toLocaleDateString("ms-MY")
                          : "—"}
                        {" / "}
                        {a.updated_at ? new Date(a.updated_at).toLocaleDateString("ms-MY") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => bukaEdit(a)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Artikel" : "Artikel Baharu"}</DialogTitle>
            <DialogDescription>
              Meta title/description adalah override SEO. Kalau kosong, sistem guna tajuk dan
              ringkasan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tajuk</Label>
              <Input
                value={form.tajuk}
                onChange={(e) => {
                  const tajuk = e.target.value;
                  setForm((f) => ({
                    ...f,
                    tajuk,
                    slug: !f.id && !slugDikunci ? janaSlug(tajuk) : f.slug,
                  }));
                }}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                disabled={slugDikunci}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {slugDikunci
                  ? "Slug dikunci kerana artikel sudah diterbitkan."
                  : "Huruf kecil, nombor, sengkang sahaja."}
              </p>
            </div>
            <div>
              <Label>Ringkasan</Label>
              <Textarea
                rows={3}
                value={form.ringkasan}
                onChange={(e) => setForm((f) => ({ ...f, ringkasan: e.target.value }))}
              />
            </div>
            <div>
              <Label>Kandungan (Markdown)</Label>
              <Textarea
                rows={16}
                className="font-mono text-sm"
                value={form.kandungan_markdown}
                onChange={(e) => setForm((f) => ({ ...f, kandungan_markdown: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Gambar Utama URL</Label>
                <Input
                  value={form.gambar_utama_url}
                  onChange={(e) => setForm((f) => ({ ...f, gambar_utama_url: e.target.value }))}
                />
              </div>
              <div>
                <Label>Gambar Utama Alt</Label>
                <Input
                  value={form.gambar_utama_alt}
                  onChange={(e) => setForm((f) => ({ ...f, gambar_utama_alt: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Kategori</Label>
                <Input
                  value={form.kategori}
                  onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as "draf" | "published" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draf">Draf</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Meta Title (optional)</Label>
                <Input
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Meta Description (optional)</Label>
                <Input
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreview(true)}>
              <Eye className="mr-1 h-4 w-4" /> Pratonton
            </Button>
            <Button onClick={submit} disabled={saving} style={{ backgroundColor: "#1B8A5A" }}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔒 Pratonton Admin — bukan URL awam</DialogTitle>
            <DialogDescription>
              Paparan ini hanya dalam CMS. Artikel draf tidak boleh dibuka melalui /blog/{form.slug || "slug"}.
            </DialogDescription>
          </DialogHeader>
          <article>
            <h1 className="font-display text-3xl font-extrabold text-foreground">{form.tajuk}</h1>
            {form.ringkasan && (
              <p className="mt-3 text-lg text-muted-foreground">{form.ringkasan}</p>
            )}
            <div className="mt-6">
              <MarkdownArtikel kandungan={form.kandungan_markdown} />
            </div>
          </article>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmTerbit} onOpenChange={setConfirmTerbit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terbitkan artikel ini?</DialogTitle>
            <DialogDescription>Slug akan dikunci selepas ini.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmTerbit(false)}>
              Batal
            </Button>
            <Button onClick={simpan} disabled={saving} style={{ backgroundColor: "#1B8A5A" }}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
