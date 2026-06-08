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
  const [state, setState] = useState<"loading" | "paid" | "pending" | "failed">(
    "loading",
  );

  useEffect(() => {
    if (!search.order) {
      setState(search.status_id === "1" ? "paid" : "failed");
      return;
    }
    let tries = 0;
    const poll = async () => {
      tries++;
      const { data } = await supabase
        .from("pesanan")
        .select("status")
        .eq("id", search.order!)
        .maybeSingle();
      if (data?.status === "paid") return setState("paid");
      if (data?.status === "failed") return setState("failed");
      if (tries < 8) setTimeout(poll, 1500);
      else setState(search.status_id === "1" ? "paid" : "pending");
    };
    poll();
  }, [search.order, search.status_id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">
              Mengesahkan pembayaran…
            </h1>
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
              to="/pilih-darjah"
              className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
            >
              Ke Pilihan Darjah
            </Link>
          </>
        )}
        {state === "pending" && (
          <>
            <Loader2 className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-4 font-display text-2xl font-extrabold">Pembayaran diproses</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami sedang menunggu pengesahan dari ToyyibPay. Anda akan dapat akses sebaik sahaja pembayaran disahkan.
            </p>
            <Link to="/pilih-darjah" className="mt-6 inline-flex rounded-full bg-muted px-6 py-3 font-display font-extrabold">
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
            <Link to="/harga" className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
              Cuba Semula
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
