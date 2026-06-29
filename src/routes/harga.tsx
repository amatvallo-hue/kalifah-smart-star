import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Star, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HARGA_ASAL, PAKEJ_LIST, DARJAH_LIST } from "@/lib/curriculum";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/harga")({
  head: () => ({
    meta: [
      { title: "Harga Pakej — Kalifah.my" },
      { name: "description", content: "Pakej langganan Kalifah.my untuk Darjah 1–6. Bermula dari RM29/tahun." },
    ],
  }),
  ssr: true,
  component: HargaPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

type PakejId = "satu" | "perDarjah" | "bundle";

function HargaPage() {
  const navigate = useNavigate();
  const [pickerFor, setPickerFor] = useState<PakejId | null>(null);
  const [loading, setLoading] = useState<PakejId | null>(null);

  async function mulaBayar(pakej: PakejId, darjah: number[]) {
    console.log("[harga] mulaBayar dipanggil", { pakej, darjah });
    setLoading(pakej);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      console.log("[harga] sesi checkout", { adaSesi: !!sess.session, adaToken: !!token });

      const { data: userData } = await supabase.auth.getUser();
      const refFromMeta = userData?.user?.user_metadata?.ref_code as string | undefined;
      const refCode =
        typeof window !== "undefined"
          ? (window.localStorage.getItem("kalifah_ref") ?? refFromMeta ?? undefined)
          : refFromMeta;
      console.log("[harga] hantar request /api/checkout", { pakej, darjah, refCode });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pakej, darjah, ref_code: refCode }),
      });
      const data = (await res.json()) as {
        url?: string;
        payment_url?: string;
        trace_id?: string;
        error?: string;
        detail?: unknown;
      };
      console.log("[harga] respons /api/checkout", { status: res.status, data });
      const paymentUrl = data.url ?? data.payment_url;
      if (res.status === 401) {
        toast.info("Sila log masuk dahulu");
        navigate({ to: "/login" });
        return;
      }
      if (!res.ok || !paymentUrl) {
        console.error("[harga] checkout tidak boleh redirect", {
          status: res.status,
          ok: res.ok,
          traceId: data.trace_id,
          error: data.error,
          detail: data.detail,
          paymentUrl,
        });
        toast.error(data.error ?? "Gagal mula pembayaran");
        return;
      }
      console.log("[harga] redirect ToyyibPay bermula", {
        traceId: data.trace_id,
        paymentUrl,
      });
      window.location.assign(paymentUrl);
    } catch (e) {
      console.error("[harga] checkout gagal", e);
      toast.error(e instanceof Error ? e.message : "Ralat tidak diketahui");
    } finally {
      setLoading(null);
    }
  }

  function handleKlik(pakej: PakejId) {
    console.log("[harga] Bayar Sekarang diklik", { pakej });
    if (pakej === "bundle") return mulaBayar("bundle", [1, 2, 3, 4, 5, 6]);
    console.log("[harga] buka pemilih darjah", { pakej });
    setPickerFor(pakej);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: HIJAU }}>
              <span className="font-display text-xl font-extrabold">ك</span>
            </div>
            <span className="font-display text-2xl font-extrabold text-foreground">
              Kalifah<span style={{ color: HIJAU }}>.my</span>
            </span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft"
            style={{ color: HIJAU }}
          >
            <Star className="h-3.5 w-3.5" /> Harga 1 Tahun Penuh
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-foreground md:text-5xl">
            Pilih Pakej Anda
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Harga asal: <span className="line-through">RM{HARGA_ASAL}/darjah</span> — kini jauh lebih murah!
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PAKEJ_LIST.map((p) => {
            const popular = !!p.popular;
            const isLoading = loading === p.id;
            return (
              <div
                key={p.id}
                className={`relative rounded-[2rem] bg-card p-7 shadow-card ${popular ? "md:scale-105" : ""}`}
                style={{ border: popular ? `3px solid ${EMAS}` : `2px solid ${HIJAU}22` }}
              >
                {popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-display text-[10px] font-extrabold uppercase tracking-wider text-white shadow-soft"
                    style={{ backgroundColor: EMAS }}
                  >
                    ⭐ Paling Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-extrabold text-foreground">{p.nama}</h3>
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground line-through">
                    RM{p.id === "bundle" ? HARGA_ASAL * 6 : HARGA_ASAL}{p.id === "perDarjah" ? "/darjah" : ""}
                  </p>
                  <p className="mt-1 font-display text-5xl font-extrabold" style={{ color: popular ? "#7a5300" : HIJAU }}>
                    RM{p.jumlahBayar}
                    <span className="text-base font-bold text-muted-foreground">
                      {p.id === "perDarjah" ? "/darjah" : ""}/tahun
                    </span>
                  </p>
                  {p.jimat && (
                    <p className="mt-1 text-sm font-extrabold" style={{ color: EMAS }}>
                      Jimat RM{p.jimat}!
                    </p>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.deskripsi}</p>
                <ul className="mt-5 space-y-2 text-sm text-foreground">
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Akses penuh nota, latih tubi, kuiz, game</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Dashboard ibu bapa</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Sijil automatik PDF</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Streak & lencana</li>
                  {p.id === "bundle" && <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Untuk semua anak (D1–D6)</li>}
                </ul>
                <button
                  type="button"
                  onClick={() => handleKlik(p.id as PakejId)}
                  disabled={isLoading}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
                  style={{ backgroundColor: popular ? EMAS : HIJAU }}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Memproses…" : "Bayar Sekarang"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl bg-muted/40 p-6 text-center">
          <p className="font-display text-sm font-extrabold text-foreground">
            Pembayaran selamat melalui ToyyibPay — FPX (online banking) & kad kredit/debit.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Untuk pertanyaan langganan, hubungi support@kalifah.my
          </p>
        </div>
      </main>

      {pickerFor && (
        <DarjahPicker
          pakej={pickerFor}
          loading={loading === pickerFor}
          onClose={() => setPickerFor(null)}
          onConfirm={(darjah) => mulaBayar(pickerFor, darjah)}
        />
      )}
    </div>
  );
}

function DarjahPicker({
  pakej,
  loading,
  onClose,
  onConfirm,
}: {
  pakej: PakejId;
  loading: boolean;
  onClose: () => void;
  onConfirm: (darjah: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const min = pakej === "satu" ? 1 : 2;
  const max = pakej === "satu" ? 1 : 5;
  const perDarjah = pakej === "satu" ? 29 : 25;
  const total = perDarjah * selected.length;

  function toggle(n: number) {
    setSelected((s) => {
      if (s.includes(n)) return s.filter((x) => x !== n);
      if (s.length >= max) {
        if (max === 1) return [n]; // ganti
        return s;
      }
      return [...s, n].sort((a, b) => a - b);
    });
  }

  const valid = selected.length >= min && selected.length <= max;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl bg-card p-7 shadow-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <h3 className="font-display text-2xl font-extrabold text-foreground">
          Pilih Darjah ({min === max ? min : `${min}–${max}`})
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {pakej === "satu" ? "Pilih 1 darjah untuk dilanggan." : "Pilih antara 2 hingga 5 darjah, RM25/darjah."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {DARJAH_LIST.map((d) => {
            const n = Number(d.id);
            const on = selected.includes(n);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(n)}
                className={`rounded-2xl border-2 px-3 py-3 font-display text-sm font-extrabold transition ${
                  on ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border bg-card text-foreground hover:border-muted-foreground/40"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
          <span className="font-display text-sm font-bold text-muted-foreground">Jumlah bayaran</span>
          <span className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>RM{total}</span>
        </div>

        <button
          type="button"
          disabled={!valid || loading}
          onClick={() => {
            console.log("[harga] Teruskan ke ToyyibPay diklik", { pakej, selected });
            onConfirm(selected);
          }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-50"
          style={{ backgroundColor: HIJAU }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses…" : "Teruskan ke ToyyibPay"}
        </button>
      </div>
    </div>
  );
}
