import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Gift, Star, Package } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { shouldSkipChildGuard } from "@/lib/child-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/kedai-hadiah")({
  head: () => ({ meta: [{ title: "Kedai Hadiah — Kalifah.my" }] }),
  ssr: false,
  component: KedaiHadiahPage,
});

interface Hadiah {
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
  nama_hadiah_snapshot: string;
  kos_star: number;
  status: string;
  catatan_admin: string | null;
  no_tracking: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  menunggu: { label: "⏳ Menunggu", className: "bg-amber-100 text-amber-700" },
  diluluskan: { label: "✅ Diluluskan", className: "bg-blue-100 text-blue-700" },
  dihantar: { label: "📦 Dihantar", className: "bg-purple-100 text-purple-700" },
  selesai: { label: "🎉 Selesai", className: "bg-green-100 text-green-700" },
  ditolak: { label: "❌ Ditolak", className: "bg-red-100 text-red-700" },
};

function KedaiHadiahPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const studentName = user?.user_metadata?.name as string | undefined;
  const mata = usePoints();
  const [hadiah, setHadiah] = useState<Hadiah[]>([]);
  const [tebusan, setTebusan] = useState<Tebusan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [redeemTarget, setRedeemTarget] = useState<Hadiah | null>(null);
  const [alamat, setAlamat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [alamatDefault, setAlamatDefault] = useState("");

  useEffect(() => {
    if (shouldSkipChildGuard()) return;
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function reload() {
    setLoadingData(true);
    const { data: hData } = await supabase
      .from("hadiah_katalog")
      .select("id, nama, penerangan, kos_star, stok, imej_url, status")
      .eq("status", "aktif")
      .order("kos_star", { ascending: true });
    setHadiah((hData as Hadiah[] | null) ?? []);

    if (user) {
      const { data: tData } = await supabase
        .from("hadiah_tebusan")
        .select("id, nama_hadiah_snapshot, kos_star, status, catatan_admin, created_at")
        .eq("child_user_id", user.id)
        .order("created_at", { ascending: false });
      setTebusan((tData as Tebusan[] | null) ?? []);
    }
    setLoadingData(false);
  }

  useEffect(() => {
    if (!user) return;
    reload();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  async function submitTebus() {
    if (!redeemTarget) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("tebus_hadiah", {
      p_hadiah_id: redeemTarget.id,
      p_alamat: alamat.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Gagal tebus hadiah");
      return;
    }
    toast.success(`Berjaya tebus "${redeemTarget.nama}"! Tunggu admin proses.`);
    setRedeemTarget(null);
    setAlamat("");
    reload();
  }

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <section className="rounded-[2rem] bg-gradient-hero p-6 shadow-card md:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
            <Gift className="h-3.5 w-3.5" /> KEDAI HADIAH
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Tukar Star Kamu Dengan Hadiah! 🎁
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Baki star kamu sekarang: <span className="font-display font-extrabold text-foreground">⭐ {mata}</span>
          </p>
        </section>

        {loadingData ? (
          <div className="mt-8 flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hadiah.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-muted-foreground">
            Belum ada hadiah dalam kedai. Datang lagi nanti!
          </p>
        ) : (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hadiah.map((h) => {
              const bolehTebus = mata >= h.kos_star && h.stok > 0;
              return (
                <div
                  key={h.id}
                  className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-5 shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => h.imej_url && setPreviewUrl(h.imej_url)}
                    className={`relative w-full overflow-hidden rounded-2xl ${h.imej_url ? "cursor-pointer" : "cursor-default"}`}
                    disabled={!h.imej_url}
                  >
                    <div className="aspect-square w-full">
                      {h.imej_url ? (
                        <img
                          src={h.imej_url}
                          alt={h.nama}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Gift className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-foreground">{h.nama}</h3>
                    {h.penerangan && (
                      <p className="mt-1 text-sm text-muted-foreground">{h.penerangan}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-3 py-1.5 font-display text-sm font-extrabold text-gold-foreground">
                      <Star className="h-4 w-4 fill-gold-foreground text-gold-foreground" /> {h.kos_star}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Package className="h-3.5 w-3.5" /> {h.stok > 0 ? `${h.stok} baki` : "Habis stok"}
                    </span>
                  </div>
                  <Button
                    disabled={!bolehTebus}
                    onClick={() => {
                      setRedeemTarget(h);
                      setAlamat("");
                    }}
                    className="mt-1"
                  >
                    {h.stok <= 0 ? "Stok Habis" : mata < h.kos_star ? "Star Tidak Cukup" : "Tebus Sekarang"}
                  </Button>
                </div>
              );
            })}
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold text-foreground">Riwayat Tebusan Saya</h2>
          {tebusan.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada tebusan lagi.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {tebusan.map((t) => {
                const s = STATUS_LABEL[t.status] ?? { label: t.status, className: "bg-muted text-muted-foreground" };
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
                  >
                    <div>
                      <p className="font-display text-sm font-extrabold text-foreground">{t.nama_hadiah_snapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        ⭐ {t.kos_star} · {new Date(t.created_at).toLocaleDateString("ms-MY")}
                      </p>
                      {t.catatan_admin && (
                        <p className="mt-1 text-xs italic text-muted-foreground">"{t.catatan_admin}"</p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.className}`}>{s.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <Dialog open={!!redeemTarget} onOpenChange={(o) => !o && setRedeemTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tebus "{redeemTarget?.nama}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {redeemTarget?.kos_star} ⭐ akan ditolak dari baki star kamu. Sila isi alamat penghantaran untuk hadiah ini.
          </p>
          <Textarea
            placeholder="Alamat penuh untuk penghantaran hadiah…"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemTarget(null)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={submitTebus} disabled={submitting || !alamat.trim()}>
              {submitting ? "Memproses…" : "Sahkan Tebus"}
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
