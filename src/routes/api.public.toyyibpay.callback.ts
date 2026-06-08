import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getBillTransactions } from "@/lib/toyyibpay";
import { darjahDibuka, type PakejId } from "@/lib/checkout";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";

// Callback dari ToyyibPay (server-to-server). Tiada user session.
export const Route = createFileRoute("/api/public/toyyibpay/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ct = request.headers.get("content-type") ?? "";
          let body: Record<string, string> = {};
          if (ct.includes("application/json")) {
            body = (await request.json()) as Record<string, string>;
          } else {
            const form = await request.formData();
            form.forEach((v, k) => {
              body[k] = String(v);
            });
          }

          const billcode = body.billcode ?? body.billCode ?? "";
          const status = String(body.status ?? "");
          const orderId = body.order_id ?? body.orderid ?? "";
          const txnId = body.transaction_id ?? body.refno ?? "";
          console.log("[callback] received", { billcode, status, orderId });

          if (!billcode) {
            return new Response("missing billcode", { status: 400 });
          }

          const secretKey = process.env.TOYYIBPAY_SECRET_KEY!;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceKey) {
            console.error(
              "[callback] SUPABASE_SERVICE_ROLE_KEY missing — cannot grant access",
            );
            return new Response("server not configured", { status: 500 });
          }

          const txs = await getBillTransactions(secretKey, billcode);
          const verifiedSuccess = txs.some(
            (t) => String(t.billpaymentStatus) === "1",
          );

          if (!verifiedSuccess && status !== "1") {
            return new Response("not paid", { status: 200 });
          }

          const admin = createClient(SUPABASE_URL, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const query = orderId
            ? admin.from("pesanan").select("*").eq("id", orderId).maybeSingle()
            : admin
                .from("pesanan")
                .select("*")
                .eq("billcode", billcode)
                .maybeSingle();
          const { data: pesanan, error: pErr } = await query;
          if (pErr || !pesanan) {
            console.error("[callback] pesanan not found", {
              billcode,
              orderId,
            });
            return new Response("order not found", { status: 200 });
          }
          if (pesanan.status === "paid") {
            return new Response("already processed", { status: 200 });
          }

          const { data: profile } = await admin
            .from("profiles")
            .select("darjah_akses")
            .eq("id", pesanan.user_id)
            .maybeSingle();

          const existing: number[] = Array.isArray(profile?.darjah_akses)
            ? (profile!.darjah_akses as number[])
            : [];
          const toAdd = darjahDibuka(
            pesanan.pakej as PakejId,
            (pesanan.darjah_dipilih as number[]) ?? [],
          );
          const merged = Array.from(new Set([...existing, ...toAdd])).sort(
            (a, b) => a - b,
          );

          await admin
            .from("profiles")
            .upsert(
              { id: pesanan.user_id, darjah_akses: merged },
              { onConflict: "id" },
            );

          await admin
            .from("pesanan")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              toyyib_transaction_id: txnId || null,
            })
            .eq("id", pesanan.id);

          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("[toyyibpay callback] ralat:", e);
          return new Response("error", { status: 500 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
