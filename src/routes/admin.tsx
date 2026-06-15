import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Kalifah.my" }] }),
  ssr: false,
  component: AdminDashboard,
});

interface Pesanan {
  id: string;
  user_id: string;
  pakej: string;
  darjah_dipilih: number[];
  amount_sen: number;
  status: string;
  payment_method: string | null;
  proof_url: string | null;
  created_at: string;
}
interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: string;
  darjah_akses: number[];
  created_at: string;
}
interface NotifSettings {
  id: string;
  notification_emails: string[];
}

function rm(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`;
}
function darjahForPesanan(p: Pesanan): number[] {
  if (p.pakej === "bundle") return [1, 2, 3, 4, 5, 6];
  return p.darjah_dipilih ?? [];
}

function AdminDashboard() {
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">Admin Dashboard</h1>
        <Tabs defaultValue="pembayaran">
          <TabsList>
            <TabsTrigger value="pembayaran">Pembayaran Manual</TabsTrigger>
            <TabsTrigger value="pengguna">Semua Pengguna</TabsTrigger>
            <TabsTrigger value="notifikasi">Tetapan Notifikasi</TabsTrigger>
          </TabsList>
          <TabsContent value="pembayaran" className="mt-6">
            <ManualPayments adminEmail={user?.email ?? ""} />
          </TabsContent>
          <TabsContent value="pengguna" className="mt-6">
            <AllUsers />
          </TabsContent>
          <TabsContent value="notifikasi" className="mt-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ---------------- Tab 1: Manual Payments ----------------
function ManualPayments({ adminEmail }: { adminEmail: string }) {
  const [rows, setRows] = useState<Pesanan[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [rejectFor, setRejectFor] = useState<Pesanan | null>(null);
  const [reason, setReason] = useState("");

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pesanan")
      .select("*")
      .eq("status", "pending")
      .or("payment_method.is.null,payment_method.neq.toyyibpay")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal muat pesanan: " + error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Pesanan[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length > 0) {
      const { data: pp } = await supabase
        .from("profiles")
        .select("id, email, username, role, darjah_akses, created_at")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      for (const p of (pp ?? []) as Profile[]) map[p.id] = p;
      setProfiles(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function approve(p: Pesanan) {
    // 1) Merge darjah_akses
    const { data: prof } = await supabase
      .from("profiles")
      .select("darjah_akses")
      .eq("id", p.user_id)
      .maybeSingle();
    const existing: number[] = Array.isArray((prof as { darjah_akses?: number[] } | null)?.darjah_akses)
      ? ((prof as { darjah_akses: number[] }).darjah_akses)
      : [];
    const merged = Array.from(new Set([...existing, ...darjahForPesanan(p)])).sort((a, b) => a - b);
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ darjah_akses: merged })
      .eq("id", p.user_id);
    if (upErr) {
      toast.error("Gagal kemaskini akses: " + upErr.message);
      return;
    }
    // 2) Update pesanan
    const { error: oErr } = await supabase
      .from("pesanan")
      .update({
        status: "approved",
        approved_by: adminEmail,
        approved_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (oErr) {
      toast.error("Gagal kemaskini pesanan: " + oErr.message);
      return;
    }
    toast.success("Pesanan diluluskan");
    reload();
  }

  async function reject() {
    if (!rejectFor) return;
    if (!reason.trim()) {
      toast.error("Sila isi sebab penolakan");
      return;
    }
    const { error } = await supabase
      .from("pesanan")
      .update({
        status: "rejected",
        rejected_reason: reason.trim(),
      })
      .eq("id", rejectFor.id);
    if (error) {
      toast.error("Gagal tolak: " + error.message);
      return;
    }
    toast.success("Pesanan ditolak");
    setRejectFor(null);
    setReason("");
    reload();
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <NewManualOrderDialog onCreated={reload} />
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">Tiada pembayaran manual yang menunggu.</p>
      ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama user</TableHead>
              <TableHead>Pakej</TableHead>
              <TableHead>Darjah</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tarikh</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resit</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const prof = profiles[p.user_id];
              return (
                <TableRow key={p.id}>
                  <TableCell>{prof?.username || prof?.email || p.user_id.slice(0, 8)}</TableCell>
                  <TableCell>{p.pakej}</TableCell>
                  <TableCell>{darjahForPesanan(p).join(", ") || "-"}</TableCell>
                  <TableCell>{rm(p.amount_sen)}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString("ms-MY")}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>
                    {p.proof_url ? (
                      <a
                        href={p.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        Lihat
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" onClick={() => approve(p)}>
                      ✅ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRejectFor(p);
                        setReason("");
                      }}
                    >
                      ❌ Reject
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak pesanan</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Sebab penolakan…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={reject}>
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------- Tab 2: All Users ----------------
function AllUsers() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, role, darjah_akses, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Gagal muat pengguna: " + error.message);
    setRows((data as Profile[] | null) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, []);

  async function changeRole(id: string, role: string) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) {
      toast.error("Gagal kemaskini role: " + error.message);
      return;
    }
    toast.success("Role dikemaskini");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Darjah Akses</TableHead>
            <TableHead>Tarikh Daftar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.email || "-"}</TableCell>
              <TableCell>{r.username || "-"}</TableCell>
              <TableCell>
                <Select value={r.role} onValueChange={(v) => changeRole(r.id, v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{(r.darjah_akses ?? []).join(", ") || "-"}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleDateString("ms-MY")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------- Tab 3: Notification Settings ----------------
function NotificationSettings() {
  const [settings, setSettings] = useState<NotifSettings | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("id, notification_emails")
        .limit(1)
        .maybeSingle();
      if (error) toast.error("Gagal muat tetapan: " + error.message);
      if (data) {
        const s = data as NotifSettings;
        setSettings(s);
        setEmails(s.notification_emails ?? []);
      }
      setLoading(false);
    })();
  }, []);

  function add() {
    const e = newEmail.trim();
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Email tidak sah");
      return;
    }
    if (emails.includes(e)) return;
    setEmails([...emails, e]);
    setNewEmail("");
  }
  function remove(e: string) {
    setEmails(emails.filter((x) => x !== e));
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("notification_settings")
      .update({ notification_emails: emails, updated_at: new Date().toISOString() })
      .eq("id", settings.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal simpan: " + error.message);
      return;
    }
    toast.success("Tetapan disimpan");
  }

  const dirty = useMemo(() => {
    if (!settings) return false;
    const a = [...emails].sort().join(",");
    const b = [...(settings.notification_emails ?? [])].sort().join(",");
    return a !== b;
  }, [emails, settings]);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (!settings) return <p className="text-muted-foreground">Tiada tetapan.</p>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-2">
        {emails.length === 0 && (
          <p className="text-sm text-muted-foreground">Tiada emel notifikasi.</p>
        )}
        {emails.map((e) => (
          <div key={e} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">{e}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(e)}>
              Buang
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="emel@contoh.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outline" onClick={add}>
          Tambah
        </Button>
      </div>
      <Button onClick={save} disabled={!dirty || saving}>
        {saving ? "Menyimpan…" : "Simpan"}
      </Button>
    </div>
  );
}

// ---------------- New Manual Order Dialog ----------------
type PakejVal = "satu" | "perDarjah" | "bundle";

function NewManualOrderDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [pakej, setPakej] = useState<PakejVal>("satu");
  const [darjah, setDarjah] = useState<number[]>([]);
  const [amountRm, setAmountRm] = useState<string>("");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setSearch("");
    setResults([]);
    setSelected(null);
    setPakej("satu");
    setDarjah([]);
    setAmountRm("");
    setNota("");
  }

  useEffect(() => {
    if (!open) return;
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, username, role, darjah_akses, created_at")
        .or(`email.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10);
      if (!cancelled) {
        setResults((data as Profile[] | null) ?? []);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, open]);

  function toggleDarjah(d: number) {
    setDarjah((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  async function save() {
    setSaving(true);
    try {
      let target = selected;
      if (!target) {
        const q = search.trim();
        if (!q) {
          toast.error("Sila cari dan pilih pengguna terlebih dahulu");
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, username, role, darjah_akses, created_at")
          .or(`email.ilike.${q},username.ilike.${q}`)
          .limit(1);
        if (error) {
          toast.error("Gagal cari pengguna: " + error.message);
          return;
        }
        const found = (data as Profile[] | null) ?? [];
        if (found.length === 0) {
          toast.error(
            "Pengguna dengan email ini tidak ditemui. Pastikan pengguna telah mendaftar akaun terlebih dahulu.",
          );
          return;
        }
        target = found[0];
        setSelected(target);
      }
      const rm = Number(amountRm);
      if (!Number.isFinite(rm) || rm <= 0) {
        toast.error("Jumlah mesti lebih daripada 0");
        return;
      }
      const finalDarjah = pakej === "bundle" ? [1, 2, 3, 4, 5, 6] : darjah;
      if (pakej !== "bundle" && finalDarjah.length === 0) {
        toast.error("Sila pilih sekurang-kurangnya satu darjah");
        return;
      }
      const { error } = await supabase.from("pesanan").insert({
        user_id: target.id,
        pakej,
        darjah_dipilih: finalDarjah,
        amount_sen: Math.round(rm * 100),
        status: "pending",
        payment_method: "manual",
      });
      if (error) {
        toast.error("Gagal simpan pesanan: " + error.message);
        return;
      }
      if (nota.trim()) {
        console.info("[manual order] nota:", nota.trim());
      }
      toast.success("Pesanan manual didaftarkan");
      reset();
      setOpen(false);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button onClick={() => setOpen(true)}>+ Daftar Pesanan Manual</Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Daftar Pesanan Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cari Pengguna</Label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm">
                  {selected.username || "-"} · {selected.email || selected.id.slice(0, 8)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                  Tukar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Cari email atau username…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {searching && (
                  <p className="text-xs text-muted-foreground">Mencari…</p>
                )}
                {results.length > 0 && (
                  <div className="max-h-40 overflow-auto rounded-md border">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setSelected(p);
                          setResults([]);
                          setSearch("");
                        }}
                      >
                        {p.username || "-"} · {p.email || p.id.slice(0, 8)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Pakej</Label>
            <Select value={pakej} onValueChange={(v) => setPakej(v as PakejVal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="satu">1 Darjah</SelectItem>
                <SelectItem value="perDarjah">2–5 Darjah</SelectItem>
                <SelectItem value="bundle">Bundle (6 Darjah)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pakej !== "bundle" && (
            <div className="space-y-2">
              <Label>Darjah Dipilih</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((d) => (
                  <label
                    key={d}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={darjah.includes(d)}
                      onCheckedChange={() => toggleDarjah(d)}
                    />
                    Darjah {d}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Jumlah (RM)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amountRm}
              onChange={(e) => setAmountRm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nota (pilihan)</Label>
            <Textarea
              placeholder="Contoh: Bayar via bank transfer terus"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

