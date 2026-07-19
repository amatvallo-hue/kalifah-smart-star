import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Search {
  order?: string;
  status_id?: string;
  billcode?: string;
}

export const Route = createFileRoute("/bayaran/selesai")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: search.order as string | undefined,
    status_id: search.status_id as string | undefined,
    billcode: search.billcode as string | undefined,
  }),
  component: BayaranSelesai,
});

function BayaranSelesai() {
  const search = useSearch({ from: "/bayaran/selesai" });
  const [state, setState] = useState<"loading" | "paid" | "pending" | "failed">("loading");

  useEffect(() => {
    if (!search.order && !search.billcode) {
      setState(search.status_id === "1" ? "paid" : "failed");
      return;
    }
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      tries++;
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (token) {
          const res = await fetch("/api/confirm-payment", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              order_id: search.order,
              billcode: search.billcode,
            }),
          });
          const json = await res.json().catch(() => ({}));
          console.log("[bayaran.selesai] confirm-payment", res.status, json);
          if (json?.ok) {
            const amountSen = typeof json.amount_sen === "number" ? json.amount_sen : null;
            const value = amountSen && amountSen > 0 ? amountSen / 100 : 49;
            if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
              (window as any).fbq("track", "Purchase", { value, currency: "MYR" });
            }
            if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
              (window as any).gtag("event", "purchase", {
                transaction_id: search.order ?? search.billcode ?? undefined,
                value,
                currency: "MYR",
              });
            }
          } else {
            const tempRes = await fetch("/api/temporary-unlock", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                order_id: search.order,
                billcode: search.billcode,
              }),
            });
            const tempJson = await tempRes.json().catch(() => ({}));
            console.log("[bayaran.selesai] temporary-unlock", tempRes.status, tempJson);
          }
        }
      } catch (e) {
        console.error("[bayaran.selesai] confirm-payment ralat", e);
      }
      if (cancelled) return;
      if (search.order) {
        const { data } = await supabase
          .from("pesanan")
          .select("status")
          .eq("id", search.order)
          .maybeSingle();
        if (data?.status === "paid") return setState("paid");
        if (data?.status === "failed") return setState("failed");
      }
      if (tries < 6) setTimeout(poll, 2000);
      else setState(search.status_id === "1" ? "paid" : "pending");
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [search.order, search.status_id, search.billcode]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Mengesahkan pembayaran…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sila tunggu sebentar.</p>
          </>
        )}
        {state === "paid" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Pembayaran berjaya!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Darjah anda telah dibuka. Selamat belajar!
            </p>
            <Link
              to="/dashboard/ibu-bapa"
              search={{ tambahAnak: "1" }}
              className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
            >
              Tambah Akaun Anak
            </Link>
          </>
        )}
        {state === "pending" && (
          <>
            <Loader2 className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Pembayaran diproses</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami sedang menunggu pengesahan dari ToyyibPay. Anda akan dapat akses sebaik sahaja
              pembayaran disahkan.
            </p>
            <Link
              to="/pilih-darjah"
              className="mt-6 inline-flex rounded-full bg-muted px-6 py-3 font-display font-extrabold"
            >
              Kembali ke Dashboard
            </Link>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-destructive" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Pembayaran gagal</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pembayaran tidak berjaya. Sila cuba sekali lagi.
            </p>
            <Link
              to="/harga"
              className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
            >
              Cuba Semula
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
