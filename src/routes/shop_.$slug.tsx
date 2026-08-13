import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ShoppingBag, Star, Truck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { KATEGORI_LABEL, rm, tangkapAttribution, type ShopProduk } from "@/lib/shop";

export const Route = createFileRoute("/shop_/$slug")({
  head: () => ({
    meta: [
      { title: "Produk — Kalifah Shop" },
      {
        name: "description",
        content: "Beli barangan pilihan Kalifah dan dapatkan Bintang percuma untuk anak anda.",
      },
      { property: "og:title", content: "Produk — Kalifah Shop" },
      {
        property: "og:description",
        content: "Beli barangan pilihan Kalifah dan dapatkan Bintang percuma untuk anak anda.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: ProdukPage,
});

function ProdukPage() {
  const { slug } = useParams({ from: "/shop_/$slug" });
  const [produk, setProduk] = useState<ShopProduk | null>(null);
  const [loading, setLoading] = useState(true);
  const [kuantiti, setKuantiti] = useState(1);
  const [nama, setNama] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");
  const [consent, setConsent] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [bukaBintang, setBukaBintang] = useState(false);
  const viewLogged = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shop_produk")
        .select("*")
        .eq("slug", slug)
        .eq("status", "aktif")
        .maybeSingle();
      const p = (data as ShopProduk | null) ?? null;
      setProduk(p);
      setLoading(false);

      if (p && !viewLogged.current) {
        viewLogged.current = true;
        const attr = tangkapAttribution();
        void supabase
          .from("analytics_events")
          .insert({
            event_name: "shop_view_content",
            user_id: null,
            metadata: {
              produk_slug: p.slug,
              produk_nama: p.nama,
              utm_source: attr.utm_source,
              utm_medium: attr.utm_medium,
              utm_campaign: attr.utm_campaign,
              utm_content: attr.utm_content,
            },
          })
          .then(
            () => {},
            () => {},
          );
      }
    })();
  }, [slug]);

  const hargaSeunit = produk ? produk.harga_sen + produk.kos_penghantaran_sen : 0;
  const jumlah = useMemo(() => hargaSeunit * kuantiti, [hargaSeunit, kuantiti]);

  async function checkout() {
    if (!produk) return;
    if (!nama.trim() || !telefon.trim() || !alamat.trim()) {
      toast.error("Sila lengkapkan nama, telefon dan alamat penghantaran.");
      return;
    }
    if (!consent) {
      toast.error("Sila tandakan kebenaran untuk kami hubungi anda.");
      return;
    }
    setHantar(true);
    const attr = tangkapAttribution();
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/shop-checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          produk_id: produk.id,
          nama_produk: produk.nama,
          kuantiti,
          nama_pembeli: nama.trim(),
          telefon: telefon.trim(),
          email: email.trim() || null,
          alamat: alamat.trim(),
          consent_pemasaran: consent,
          ...attr,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        kod_pesanan?: string;
        jumlah_rm_sen?: number;
        payment_url?: string;
      };
      if (!json.ok || !json.payment_url) {
        toast.error(json.error ?? "Gagal memulakan pembayaran.");
        setHantar(false);
        return;
      }

      await supabase
        .from("analytics_events")
        .insert({
          event_name: "shop_initiate_checkout",
          user_id: null,
          metadata: { kod_pesanan: json.kod_pesanan, jumlah_rm_sen: json.jumlah_rm_sen },
        })
        .then(
          () => {},
          () => {},
        );

      window.location.href = json.payment_url;
    } catch {
      toast.error("Ralat rangkaian. Cuba lagi.");
      setHantar(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!produk) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-extrabold">Produk tidak dijumpai</h1>
        <Button asChild>
          <Link to="/shop">Kembali ke Kalifah Shop</Link>
        </Button>
      </div>
    );
  }

  const maxKuantiti = Math.max(1, Math.min(produk.stok || 1, 10));
  const habis = produk.stok <= 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link to="/shop" className="font-display text-sm font-bold text-muted-foreground hover:text-primary">
          ← Kalifah Shop
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div>
            {produk.imej_url ? (
              <img
                src={produk.imej_url}
                alt={produk.nama}
                className="w-full rounded-3xl object-cover shadow-card"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-muted">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {KATEGORI_LABEL[produk.kategori] ?? produk.kategori}
            </span>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground">{produk.nama}</h1>
            <p className="mt-3 font-display text-3xl font-extrabold text-primary">{rm(hargaSeunit)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Truck className="h-3.5 w-3.5" /> Harga sudah termasuk penghantaran
            </p>

            {produk.penerangan && (
              <p className="mt-4 whitespace-pre-line text-muted-foreground">{produk.penerangan}</p>
            )}

            {produk.bonus_star > 0 && (
              <div className="mt-4 rounded-2xl bg-gradient-gold/20 p-4">
                <p className="font-display font-extrabold text-foreground">
                  ⭐ Dapat {produk.bonus_star} Bintang percuma bila anda daftar akaun Kalifah!
                </p>
                <button
                  type="button"
                  onClick={() => setBukaBintang(true)}
                  className="mt-1 text-sm font-bold text-primary underline"
                >
                  Apa itu Bintang?
                </button>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <Label className="font-bold">Kuantiti</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setKuantiti((k) => Math.max(1, k - 1))}
                  disabled={habis || kuantiti <= 1}
                >
                  −
                </Button>
                <span className="w-8 text-center font-display font-extrabold">{kuantiti}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setKuantiti((k) => Math.min(maxKuantiti, k + 1))}
                  disabled={habis || kuantiti >= maxKuantiti}
                >
                  +
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {habis ? "Habis stok" : `${produk.stok} tersedia`}
              </span>
            </div>
          </div>
        </div>

        {/* Borang checkout */}
        <section className="mt-10 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
          <h2 className="font-display text-xl font-extrabold text-foreground">Maklumat Penghantaran</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tak perlu daftar akaun. Isi maklumat di bawah dan terus bayar.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nama penuh *</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama anda" />
            </div>
            <div className="space-y-1.5">
              <Label>Nombor telefon *</Label>
              <Input
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                inputMode="tel"
                placeholder="0123456789"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Emel (pilihan)</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="emel@contoh.com"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Alamat penghantaran *</Label>
              <Textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={3}
                placeholder="No rumah, jalan, poskod, bandar, negeri"
              />
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/50 p-4">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
            <span className="text-sm text-muted-foreground">
              Saya benarkan Kalifah.my hubungi saya melalui telefon/emel untuk susulan pesanan &
              promosi.
            </span>
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Jumlah bayaran</p>
              <p className="font-display text-2xl font-extrabold text-foreground">{rm(jumlah)}</p>
            </div>
            <Button size="lg" onClick={checkout} disabled={hantar || habis}>
              {hantar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses…
                </>
              ) : habis ? (
                "Habis Stok"
              ) : (
                "Bayar Sekarang"
              )}
            </Button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Pembayaran selamat melalui ToyyibPay (FPX &
            kad).
          </p>
        </section>
      </div>

      <Dialog open={bukaBintang} onOpenChange={setBukaBintang}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Star className="mr-1 inline h-5 w-5 fill-gold text-gold" /> Apa itu Bintang?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Bintang ialah mata ganjaran dalam platform pembelajaran Kalifah.my. Anak anda kumpul
              Bintang setiap kali siapkan kuiz, latihan dan aktiviti harian.
            </p>
            <p>
              Bintang boleh ditebus dengan hadiah sebenar di Kedai Hadiah Kalifah — dan pembelian di
              Kalifah Shop memberi anak anda permulaan yang lebih pantas.
            </p>
            <p className="font-bold text-foreground">
              Selepas bayaran berjaya, buka halaman status pesanan anda untuk tuntut Bintang ini ke
              akaun anak.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
