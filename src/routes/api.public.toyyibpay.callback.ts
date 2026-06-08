import { createFileRoute } from "@tanstack/react-router";
import { pool } from "@/lib/lovable/database";
import { getBillTransactions } from "@/lib/toyyibpay";
import { darjahDibuka, type PakejId } from "@/lib/checkout";

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

          if (!billcode) {
            return new Response("missing billcode", { status: 400 });
          }

          const secretKey = process.env.TOYYIBPAY_SECRET_KEY!;
          const txs = await getBillTransactions(secretKey, billcode);
          const verifiedSuccess = txs.some(
            (t) => String(t.billpaymentStatus) === "1",
          );

          if (!verifiedSuccess && status !== "1") {
            return new Response("not paid", { status: 200 });
          }

          const pesananRes = orderId
            ? await pool.query(
                `SELECT id, user_id, pakej, darjah_dipilih, status
                   FROM public.pesanan WHERE id = $1 LIMIT 1`,
                [orderId],
              )
            : await pool.query(
                `SELECT id, user_id, pakej, darjah_dipilih, status
                   FROM public.pesanan WHERE billcode = $1 LIMIT 1`,
                [billcode],
              );
          const pesanan = pesananRes.rows[0];
          if (!pesanan) {
            console.error("[callback] pesanan not found", { billcode, orderId });
            return new Response("order not found", { status: 200 });
          }
          if (pesanan.status === "paid") {
            return new Response("already processed", { status: 200 });
          }

          const profRes = await pool.query(
            `SELECT darjah_akses FROM public.profiles WHERE id = $1 LIMIT 1`,
            [pesanan.user_id],
          );
          const existing: number[] = Array.isArray(profRes.rows[0]?.darjah_akses)
            ? (profRes.rows[0].darjah_akses as number[])
            : [];
          const toAdd = darjahDibuka(
            pesanan.pakej as PakejId,
            (pesanan.darjah_dipilih as number[]) ?? [],
          );
          const merged = Array.from(new Set([...existing, ...toAdd])).sort(
            (a, b) => a - b,
          );

          await pool.query(
            `INSERT INTO public.profiles (id, darjah_akses)
             VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET darjah_akses = EXCLUDED.darjah_akses`,
            [pesanan.user_id, merged],
          );

          await pool.query(
            `UPDATE public.pesanan
               SET status = 'paid',
                   paid_at = NOW(),
                   toyyib_transaction_id = $1
             WHERE id = $2`,
            [txnId || null, pesanan.id],
          );

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
