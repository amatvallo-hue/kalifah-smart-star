import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PARENT_SESSION_BACKUP_KEY } from "@/lib/child-auth";

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

interface FastpathAnak {
  nama: string;
  child_user_id?: string;
  session: { access_token: string; refresh_token: string };
  username?: string;
  password?: string;
}

const FASTPATH_KEY = "kali_fastpath_anak";

function bacaFastpath(): FastpathAnak | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FASTPATH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FastpathAnak;
    if (
      parsed?.nama &&
      parsed?.session?.access_token &&
      parsed?.session?.refresh_token
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function FastpathPaid({ data }: { data: FastpathAnak }) {
  const navigate = useNavigate();
  const [gagal, setGagal] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [disalin, setDisalin] = useState<"username" | "password" | null>(null);

  async function mulakan() {
    setSedang(true);
    try {
      const { data: parentSess } = await supabase.auth.getSession();
      if (parentSess.session && typeof window !== "undefined") {
        window.sessionStorage.setItem(
          PARENT_SESSION_BACKUP_KEY,
          JSON.stringify({
            access_token: parentSess.session.access_token,
            refresh_token: parentSess.session.refresh_token,
          }),
        );
      }
      const { error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (error) {
        console.error("[bayaran.selesai] setSession gagal", error);
        setGagal(true);
        return;
      }
      if (typeof window !== "undefined") window.sessionStorage.removeItem(FASTPATH_KEY);
      navigate({ to: "/kali-test/belajar-untuk-saya" });
    } catch (e) {
      console.error("[bayaran.selesai] fastpath ralat", e);
      setGagal(true);
    } finally {
      setSedang(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-extrabold">🎉 KALI dah sedia untuk {data.nama}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Langkah seterusnya: biarkan {data.nama} buat diagnostic pertamanya.
        </p>

        {!gagal ? (
          <button
            type="button"
            disabled={sedang}
            onClick={() => void mulakan()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {sedang && <Loader2 className="h-4 w-4 animate-spin" />}
            Mulakan KALI untuk {data.nama} →
          </button>
        ) : (
          <div className="mt-6 text-left">
            <p className="text-sm text-muted-foreground">
              Sesi automatik tamat tempoh. Sila log masuk dengan maklumat akaun {data.nama}:
            </p>
            <div className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-4">
              {(
                [
                  ["username", "Username", data.username ?? ""],
                  ["password", "Password", data.password ?? ""],
                ] as const
              ).map(([key, label, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">{label}</p>
                    <p className="font-display text-base font-extrabold">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(value);
                      setDisalin(key);
                    }}
                    className="rounded-full bg-card px-3 py-1.5 text-xs font-bold shadow-soft"
                  >
                    {disalin === key ? "Disalin!" : "Salin"}
                  </button>
                </div>
              ))}
            </div>
            <Link
              to="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
            >
              Log Masuk Akaun Anak
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function BayaranSelesai() {
  const search = useSearch({ from: "/bayaran/selesai" });
  const [state, setState] = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [fastpath, setFastpath] = useState<FastpathAnak | null>(null);

  useEffect(() => {
    setFastpath(bacaFastpath());
  }, []);


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
            const trackId = search.order ?? search.billcode ?? null;
            const flagKey = trackId ? `purchase_tracked_${trackId}` : null;
            const already =
              flagKey && typeof window !== "undefined"
                ? window.localStorage.getItem(flagKey) === "1"
                : false;
            if (!already) {
              if (flagKey && typeof window !== "undefined") {
                window.localStorage.setItem(flagKey, "1");
              }
              if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
                (window as any).fbq("track", "Purchase", { value, currency: "MYR" });
              }
              if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
                (window as any).gtag("event", "purchase", {
                  transaction_id: trackId ?? undefined,
                  value,
                  currency: "MYR",
                });
              }
              void supabase
                .from("analytics_events")
                .insert({
                  event_name: "payment_success",
                  user_id: null,
                  metadata: { order_id: trackId, amount_sen: amountSen, source: "bayaran.selesai" },
                })
                .then(() => {}, () => {});
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

  if (state === "paid" && fastpath) {
    return <FastpathPaid data={fastpath} />;
  }

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
