import { createFileRoute } from "@tanstack/react-router";
import { verifyAndUnlock } from "@/lib/payment-unlock.server";

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

export const Route = createFileRoute("/api/public/toyyibpay/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = traceId();
        const ct = request.headers.get("content-type") ?? "";
        console.log(`[callback:${id}] received`, {
          ct,
          ua: request.headers.get("user-agent"),
        });
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
        const status = String(body.status ?? body.status_id ?? "");
        const orderId =
          body.order_id ??
          body.orderid ??
          body.billExternalReferenceNo ??
          body.refno ??
          null;
        const txnId = body.transaction_id ?? body.refno ?? null;

        try {
          const result = await verifyAndUnlock({
            traceId: id,
            orderId,
            billcode,
            statusFromCallback: status,
            txnId,
          });
          console.log(`[callback:${id}] result`, result);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          console.error(`[callback:${id}] exception`, e);
          return new Response("error", { status: 200 });
        }
      },
      GET: async ({ request }) => {
        // ToyyibPay sometimes redirects user via GET with billcode + status_id
        const id = traceId();
        const url = new URL(request.url);
        const billcode = url.searchParams.get("billcode");
        const status = url.searchParams.get("status_id");
        const orderId = url.searchParams.get("order_id");
        console.log(`[callback:${id}] GET`, { billcode, status, orderId });
        if (billcode || orderId) {
          try {
            const result = await verifyAndUnlock({
              traceId: id,
              orderId,
              billcode,
              statusFromCallback: status,
              txnId: null,
            });
            console.log(`[callback:${id}] GET result`, result);
          } catch (e) {
            console.error(`[callback:${id}] GET exception`, e);
          }
        }
        return new Response("ok");
      },
    },
  },
});
