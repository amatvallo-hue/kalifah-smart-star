import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, PackageCheck, RefreshCw, Star, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { rm, STATUS_BAYARAN_LABEL, STATUS_PESANAN_LABEL, type ShopPesanan } from "@/lib/shop";

export const Route = createFileRoute("/shop_/pesanan/$kod")({
  head: () => ({
    meta: [
      { title: "Status Pesanan — Kalifah Shop" },
      { name: "description", content: "Semak status pesanan Kalifah Shop anda." },
      { property: "og:title", content: "Status Pesanan — Kalifah Shop" },
      { property: "og:description", content: "Semak status pesanan Kalifah Shop anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: StatusPesananPage,
});

interface Anak {
  id: string;
  nama: string;
  child_user_id: string | null;
}

function StatusPesananPage() {
  const { kod } = useParams({ from: "/shop_/pesanan/$kod" });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [pesanan, setPesanan] = useState<ShopPesanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [anak, setAnak] = useState<Anak[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const { data, error } = await supabase.rpc("ambil_pesanan_shop", { p_kod_pesanan: kod });
    const row = (Array.isArray(data) ? data[0] : data) as ShopPesanan | null;
    if (error) console.warn("[shop] ambil_pesanan_shop gagal", error);
    setPesanan(row ?? null);
    setLoading(false);
    return row ?? null;
  }, [kod]);

  // Muat awal + satu kali poll (callback ToyyibPay adalah async)
  useEffect(() => {
    let batal = false;
    (async () => {
      const row = await muat();
      if (batal) return;
      if (row && row.status_bayaran === "pending") {
        setTimeout(() => {
          if (!batal) void muat();
        }, 4000);
      }
    })();
    return () => {
      batal = true;
    };
  }, [muat]);

  // Log shop_purchase sekali sahaja per kod
  useEffect(() => {
    if (!pesanan || pesanan.status_bayaran !== "dibayar") return;
    const flag = `kalifah_shop_purchase_${pesanan.kod_pesanan}`;
    try {
      if (window.localStorage.getItem(flag)) return;
      window.localStorage.setItem(flag, "1");
    } catch {
      /* abaikan */
    }
    void supabase
      .from("analytics_events")
      .insert({
        event_name: "shop_purchase",
        user_id: user?.id ?? null,
        metadata: {
          kod_pesanan: pesanan.kod_pesanan,
          jumlah_rm_sen: pesanan.jumlah_rm_sen,
          ref_code: pesanan.ref_code,
        },
      })
      .then(
        () => {},
        () => {},
      );
  }, [pesanan, user]);

  // Senarai anak untuk parent yang log masuk
  useEffect(() => {
    if (!user) {
      setAnak([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("child_profiles")
        .select("id, nama, child_user_id")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: true });
      setAnak((data as Anak[] | null) ?? []);
    })();
  }, [user]);

  async function tuntut(childUserId: string) {
    if (!pesanan) return;
    setClaiming(childUserId);
    const { error } = await supabase.rpc("tuntut_star_shop", {
      p_kod_pesanan: pesanan.kod_pesanan,
      p_child_user_id: childUserId,
    });
    setClaiming(null);
    if (error) {
      toast.error(error.message || "Gagal tuntut Bintang.");
      return;
    }
    toast.success(`${pesanan.bonus_star_total} Bintang berjaya dimasukkan!`);
    void supabase
      .from("analytics_events")
      .insert({
        event_name: "shop_star_claimed",
        user_id: user?.id ?? null,
        metadata: {
          kod_pesanan: pesanan.kod_pesanan,
          bonus_star_total: pesanan.bonus_star_total,
          child_user_id: childUserId,
        },
      })
      .then(
        () => {},
        () => {},
      );
    void muat();
  }

  function pergiLogMasuk() {
    try {
      window.sessionStorage.setItem(
        "kalifah_redirect_selepas_login",
        `/shop/pesanan/${kod}`,
      );
    } catch {
      /* abaikan */
    }
    navigate({ to: "/login" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-extrabold">Pesanan tidak dijumpai</h1>
        <p className="text-muted-foreground">Kod pesanan “{kod}” tidak wujud.</p>
        <Button asChild>
          <Link to="/shop">Kembali ke Kalifah Shop</Link>
        </Button>
      </div>
    );
  }

  const dibayar = pesanan.status_bayaran === "dibayar";
  const bolehTuntut = dibayar && !pesanan.star_dituntut && pesanan.bonus_star_total > 0;
  const anakSah = anak.filter((a) => a.child_user_id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Link to="/shop" className="font-display text-sm font-bold text-muted-foreground hover:text-primary">
          ← Kalifah Shop
        </Link>

        <section className="mt-4 rounded-3xl bg-gradient-hero p-6 shadow-card">
          <p className="font-display text-xs font-bold uppercase text-primary">Kod Pesanan</p>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            {pesanan.kod_pesanan}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {STATUS_BAYARAN_LABEL[pesanan.status_bayaran] ?? pesanan.status_bayaran} ·{" "}
            <strong>{rm(pesanan.jumlah_rm_sen)}</strong>
          </p>
        </section>

        <section className="mt-6 space-y-3 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-foreground">Status Pesanan</h2>
            <Button size="sm" variant="ghost" onClick={() => void muat()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Muat semula
            </Button>
          </div>

          {!dibayar ? (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              Kami belum terima pengesahan pembayaran. Jika anda baru sahaja membayar, tunggu
              sebentar dan tekan “Muat semula”.
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800">
              <PackageCheck className="h-4 w-4" />{" "}
              {STATUS_PESANAN_LABEL[pesanan.status_pesanan] ?? pesanan.status_pesanan}
            </p>
          )}

          {pesanan.no_tracking && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" /> No. tracking:{" "}
              <span className="font-bold text-foreground">{pesanan.no_tracking}</span>
            </p>
          )}

          <div className="pt-2 text-sm text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">Penerima:</span> {pesanan.nama_pembeli} ·{" "}
              {pesanan.telefon}
            </p>
            <p className="whitespace-pre-line">{pesanan.alamat_penghantaran}</p>
          </div>
        </section>

        {bolehTuntut && (
          <section className="mt-6 rounded-3xl border-2 border-gold/50 bg-gradient-gold/15 p-6">
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              <Star className="mr-1 inline h-6 w-6 fill-gold text-gold" /> Tuntut{" "}
              {pesanan.bonus_star_total} Bintang Percuma
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih anak yang akan terima Bintang ini dalam akaun Kalifah.
            </p>

            {authLoading ? (
              <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted-foreground" />
            ) : !user ? (
              <Button size="lg" className="mt-4 w-full" onClick={pergiLogMasuk}>
                Log masuk / Daftar untuk tuntut
              </Button>
            ) : anakSah.length === 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Anda belum ada akaun anak. Tambah anak dahulu untuk terima Bintang.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link to="/dashboard/ibu-bapa" search={{ tambahAnak: "1" } as never}>
                    Tambah Anak
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {anakSah.map((a) => (
                  <Button
                    key={a.id}
                    variant="outline"
                    className="justify-between bg-card"
                    disabled={claiming !== null}
                    onClick={() => void tuntut(a.child_user_id as string)}
                  >
                    <span className="font-bold">{a.nama}</span>
                    {claiming === a.child_user_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pilih</span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </section>
        )}

        {dibayar && pesanan.star_dituntut && (
          <p className="mt-6 rounded-2xl bg-muted/50 p-4 text-center text-sm font-bold text-muted-foreground">
            ⭐ Bintang untuk pesanan ini sudah dituntut.
          </p>
        )}
      </div>
    </div>
  );
}
