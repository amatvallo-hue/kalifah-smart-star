import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { getBillTransactions } from "@/lib/toyyibpay";
import { darjahDibuka, type PakejId } from "@/lib/checkout";

// Callback dari ToyyibPay (server-to-server). Tiada user session.
// ToyyibPay POST: refno, status (1=success, 2=pending, 3=fail), reason,
// billcode, order_id (externalRef), amount, transaction_id, msg
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

          if (!billcode) {
            return new Response("missing billcode", { status: 400 });
          }

          // Re-verify dengan ToyyibPay API
          const secretKey = process.env.TOYYIBPAY_SECRET_KEY!;
          const txs = await getBillTransactions(secretKey, billcode);
          const verifiedSuccess = txs.some(
            (t) => String(t.billpaymentStatus) === "1",
          );

          if (!verifiedSuccess && status !== "1") {
            return new Response("not paid", { status: 200 });
          }

          const admin = getSupabaseAdmin();
          // Cari pesanan
          const query = orderId
            ? admin.from("pesanan").select("*").eq("id", orderId).maybeSingle()
            : admin
                .from("pesanan")
                .select("*")
                .eq("billcode", billcode)
                .maybeSingle();
          const { data: pesanan, error: pErr } = await query;
          if (pErr || !pesanan) {
            console.error("[callback] pesanan not found", { billcode, orderId });
            return new Response("order not found", { status: 200 });
          }

          if (pesanan.status === "paid") {
            return new Response("already processed", { status: 200 });
          }

          // Update profile darjah_akses
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
      // ToyyibPay kadang-kadang ping GET pada return URL
      GET: async () => new Response("ok"),
    },
  },
});
