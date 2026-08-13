import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShoppingBag, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  KATEGORI_LABEL,
  KATEGORI_LIST,
  rm,
  tangkapAttribution,
  type ShopKategori,
  type ShopProduk,
} from "@/lib/shop";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Kalifah Shop — Barangan Belajar & Ganjaran Anak" },
      {
        name: "description",
        content:
          "Kalifah Shop: barangan sekolah, bahan pembelajaran, aktiviti dan ganjaran anak. Setiap pembelian datang dengan Bintang percuma untuk akaun Kalifah anak anda.",
      },
      { property: "og:title", content: "Kalifah Shop — Barangan Belajar & Ganjaran Anak" },
      {
        property: "og:description",
        content: "Barangan sekolah, bahan pembelajaran dan ganjaran anak dari Kalifah.my.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: ShopPage,
});

function ShopPage() {
  const [produk, setProduk] = useState<ShopProduk[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState<ShopKategori | "semua">("semua");

  useEffect(() => {
    tangkapAttribution();
    (async () => {
      const { data } = await supabase
        .from("shop_produk")
        .select("*")
        .eq("status", "aktif")
        .order("created_at", { ascending: false });
      setProduk((data as ShopProduk[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  const senarai =
    kategori === "semua" ? produk : produk.filter((p) => p.kategori === kategori);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <Link to="/" className="font-display text-sm font-bold text-primary hover:underline">
            ← Kalifah.my
          </Link>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
            <ShoppingBag className="h-3.5 w-3.5" /> KALIFAH SHOP
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Barangan pilihan Kalifah untuk anak anda 🛍️
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Setiap pembelian datang dengan <strong>Bintang percuma</strong> yang boleh anak anda
            guna dalam akaun Kalifah.
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap gap-2">
          <FilterChip
            aktif={kategori === "semua"}
            onClick={() => setKategori("semua")}
            label="Semua"
          />
          {KATEGORI_LIST.map((k) => (
            <FilterChip
              key={k}
              aktif={kategori === k}
              onClick={() => setKategori(k)}
              label={KATEGORI_LABEL[k]}
            />
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : senarai.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-muted-foreground">
            Belum ada barangan dalam kategori ini. Datang lagi nanti!
          </p>
        ) : (
          <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {senarai.map((p) => (
              <Link
                key={p.id}
                to="/shop/$slug"
                params={{ slug: p.slug }}
                className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {p.imej_url ? (
                  <img
                    src={p.imej_url}
                    alt={p.nama}
                    loading="lazy"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-muted">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                </span>
                <h2 className="font-display text-lg font-extrabold leading-tight text-foreground">
                  {p.nama}
                </h2>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-display text-xl font-extrabold text-foreground">
                    {rm(p.harga_sen + p.kos_penghantaran_sen)}
                  </span>
                  {p.bonus_star > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-2.5 py-1 font-display text-xs font-extrabold text-gold-foreground">
                      <Star className="h-3.5 w-3.5 fill-gold-foreground" /> +{p.bonus_star}
                    </span>
                  )}
                </div>
                {p.stok <= 0 && (
                  <span className="text-xs font-bold text-destructive">Habis stok</span>
                )}
              </Link>
            ))}
          </section>
        )}

        <div className="mt-10 rounded-3xl border border-border/60 bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sudah buat pesanan? Semak status melalui pautan yang kami hantar selepas pembayaran,
            atau buka <span className="font-bold text-foreground">kalifah.my/shop/pesanan/[kod
            pesanan]</span>.
          </p>
        </div>

      </main>
    </div>
  );
}

function FilterChip({
  aktif,
  label,
  onClick,
}: {
  aktif: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 font-display text-sm font-bold transition ${
        aktif
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-muted text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}
