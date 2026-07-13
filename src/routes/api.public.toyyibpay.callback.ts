import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getBillTransactions } from "@/lib/toyyibpay";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

// Anon client — INSERT ke public.payments dibenarkan oleh RLS.
// Database trigger (apply_payment_unlock) akan update profiles.darjah_akses
// dan tandakan pesanan paid. Tiada service_role_key diperlukan.
function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function recordPayment(
  id: string,
  payload: {
    billcode: string | null;
    orderId: string | null;
    status: string;
    txnId: string | null;
    raw: Record<string, unknown>;
  },
) {
  if (!payload.billcode && !payload.orderId) {
    console.warn(`[callback:${id}] tiada billcode/orderId — skip insert`);
    return { ok: false, reason: "missing-identifier" };
  }
  const supa = anonClient();
  const { data, error } = await supa
    .from("payments")
    .insert({
      billcode: payload.billcode ?? "",
      order_id: payload.orderId,
      status: payload.status,
      toyyib_transaction_id: payload.txnId,
      raw: payload.raw,
    })
    .select("id")
    .single();
  if (error) {
    console.error(`[callback:${id}] insert payments gagal`, error);
    return { ok: false, reason: "insert-failed", error: error.message };
  }
  console.log(`[callback:${id}] payments inserted`, { paymentId: data?.id });
  return { ok: true, paymentId: data?.id };
}

async function verifyWithToyyibPay(id: string, billcode: string): Promise<string | null> {
  const key = process.env.TOYYIBPAY_SECRET_KEY?.trim();
  if (!key) {
    console.warn(`[callback:${id}] TOYYIBPAY_SECRET_KEY tiada — skip verify`);
    return null;
  }
  try {
    const txs = await getBillTransactions(key, billcode);
    const paid = txs.find((t) => String(t.billpaymentStatus) === "1");
    console.log(`[callback:${id}] verify`, { count: txs.length, paid: !!paid });
    return paid ? "1" : null;
  } catch (e) {
    console.error(`[callback:${id}] verify exception`, e);
    return null;
  }
}

export const Route = createFileRoute("/api/public/toyyibpay/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = traceId();
        const ct = request.headers.get("content-type") ?? "";
        console.log(`[callback:${id}] POST received`, { ct });
        let body: Record<string, string> = {};
        try {
          if (ct.includes("application/json")) {
            body = (await request.json()) as Record<string, string>;
          } else {
            const form = await request.formData();
            form.forEach((v, k) => {
              body[k] = String(v);
            });
          }
        } catch (e) {
          console.error(`[callback:${id}] parse body gagal`, e);
        }
        console.log(`[callback:${id}] body`, body);

        const billcode = body.billcode ?? body.billCode ?? null;
        let status = String(body.status ?? body.status_id ?? "");
        const orderId =
          body.order_id ?? body.orderid ?? body.billExternalReferenceNo ?? body.refno ?? null;
        const txnId = body.transaction_id ?? body.refno ?? null;
        console.log(
          `[callback:${id}] parsed billcode=${billcode ?? "-"} order_id=${orderId ?? "-"} status=${status || "-"} txn=${txnId ?? "-"}`,
        );

        // Kalau status bukan '1', sahkan dgn ToyyibPay sebelum tanda paid
        if (status !== "1" && billcode) {
          const verified = await verifyWithToyyibPay(id, billcode);
          if (verified === "1") status = "1";
        }

        const result = await recordPayment(id, {
          billcode,
          orderId,
          status,
          txnId,
          raw: body,
        });
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },

      GET: async ({ request }) => {
        const id = traceId();
        const url = new URL(request.url);
        const billcode = url.searchParams.get("billcode");
        const statusParam = url.searchParams.get("status_id");
        const orderId = url.searchParams.get("order_id");
        console.log(`[callback:${id}] GET`, { billcode, status: statusParam, orderId });

        let status = statusParam ?? "";
        if (status !== "1" && billcode) {
          const verified = await verifyWithToyyibPay(id, billcode);
          if (verified === "1") status = "1";
        }

        if (billcode || orderId) {
          await recordPayment(id, {
            billcode,
            orderId,
            status,
            txnId: null,
            raw: Object.fromEntries(url.searchParams.entries()),
          });
        }
        return new Response("ok");
      },
    },
  },
});
