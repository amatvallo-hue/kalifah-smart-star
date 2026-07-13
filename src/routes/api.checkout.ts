import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createBill } from "@/lib/toyyibpay";
import { kiraHarga, type PakejId } from "@/lib/checkout";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

type CheckoutBody = {
  pakej?: unknown;
  darjah?: unknown;
  ref_code?: unknown;
};

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function isPakejId(value: unknown): value is PakejId {
  return value === "satu" || value === "perDarjah" || value === "bundle";
}

function safeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    return {
      name: e.name,
      message: e.message,
      code: e.code,
      details: e.details,
      hint: e.hint,
      status: e.status,
      statusText: e.statusText,
    };
  }
  return { message: String(error) };
}

function logStep(id: string, step: string, data?: Record<string, unknown>) {
  console.log(`[checkout:${id}] ${step}`, data ?? {});
}

function logWarn(id: string, step: string, data?: Record<string, unknown>) {
  console.warn(`[checkout:${id}] ${step}`, data ?? {});
}

function logError(id: string, step: string, error: unknown) {
  console.error(`[checkout:${id}] ${step}`, safeError(error));
}

function jsonError(
  id: string,
  status: number,
  error: string,
  detail?: unknown,
) {
  return Response.json(
    { ok: false, trace_id: id, error, detail },
    { status },
  );
}

// Canonical public origin for ToyyibPay callback/return URLs. Never derive
// from the incoming request — a checkout started on a preview or non-primary
// host would otherwise bake a dead callback URL into the bill and silently
// break payment confirmation.
const PUBLIC_APP_URL =
  process.env.PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "https://kalifah.my";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = traceId();
        logStep(id, "1/9 POST diterima", {
          method: request.method,
          url: request.url,
          contentType: request.headers.get("content-type"),
          origin: request.headers.get("origin"),
          host: request.headers.get("host"),
          hasAuthorizationHeader: request.headers.has("authorization"),
        });

        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) {
            logWarn(id, "1/9 gagal: tiada bearer token");
            return jsonError(id, 401, "Tidak log masuk");
          }

          logStep(id, "2/9 semak sesi pengguna", { hasToken: true });
          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: userData, error: userErr } =
            await userClient.auth.getUser();
          if (userErr || !userData.user) {
            logError(id, "2/9 auth gagal", userErr ?? "user kosong");
            return jsonError(id, 401, "Sesi tidak sah", safeError(userErr));
          }

          const user = userData.user;
          logStep(id, "2/9 auth berjaya", {
            userId: user.id,
            emailAda: Boolean(user.email),
          });

          let body: CheckoutBody;
          try {
            body = (await request.json()) as CheckoutBody;
          } catch (error) {
            logError(id, "3/9 JSON body tidak sah", error);
            return jsonError(id, 400, "JSON body tidak sah", safeError(error));
          }

          logStep(id, "3/9 body diterima", body as Record<string, unknown>);
          if (!isPakejId(body.pakej) || !Array.isArray(body.darjah)) {
            logWarn(id, "3/9 input gagal validasi", {
              pakej: body.pakej,
              darjahIsArray: Array.isArray(body.darjah),
            });
            return jsonError(id, 400, "Input tidak sah");
          }

          const darjah = Array.from(
            new Set(
              body.darjah
                .map((n) => Number(n))
                .filter((n) => Number.isInteger(n) && n >= 1 && n <= 6),
            ),
          ).sort((a, b) => a - b);

          let amount: number;
          try {
            amount = kiraHarga(body.pakej, darjah);
          } catch (error) {
            logError(id, "4/9 kira harga gagal", error);
            return jsonError(id, 400, "Pilihan pakej/darjah tidak sah", safeError(error));
          }

          const amountSen = amount * 100;
          logStep(id, "4/9 harga dikira", {
            pakej: body.pakej,
            darjah,
            amountRm: amount,
            amountSen,
          });

          logStep(id, "5/9 insert public.pesanan bermula", {
            userId: user.id,
            pakej: body.pakej,
            darjah,
            amountSen,
          });

          const refCode =
            typeof body.ref_code === "string" && body.ref_code.trim().length > 0
              ? body.ref_code.trim().toUpperCase().slice(0, 64)
              : null;

          const {
            data: order,
            error: orderErr,
            status: insertStatus,
            statusText: insertStatusText,
          } = await userClient
            .from("pesanan")
            .insert({
              user_id: user.id,
              pakej: body.pakej,
              darjah_dipilih: darjah,
              amount_sen: amountSen,
              status: "pending",
              ref_code: refCode,
            })
            .select("id, amount_sen, status, created_at")
            .single();

          if (orderErr || !order) {
            logError(id, "5/9 insert public.pesanan gagal", orderErr);
            return jsonError(id, 500, "Gagal cipta pesanan", {
              supabase: safeError(orderErr),
              insertStatus,
              insertStatusText,
            });
          }

          logStep(id, "5/9 insert public.pesanan berjaya", {
            orderId: order.id,
            insertStatus,
            insertStatusText,
            orderStatus: order.status,
            amountSen: order.amount_sen,
          });

          const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
          logStep(id, "6/9 semak TOYYIBPAY_SECRET_KEY", {
            configured: Boolean(secretKey),
            length: secretKey?.length ?? 0,
          });
          if (!secretKey) {
            return jsonError(id, 500, "TOYYIBPAY_SECRET_KEY tidak ditetapkan");
          }

          const origin = requestOrigin(request);
          const pakejLabel =
            body.pakej === "bundle"
              ? "Bundle 6 Darjah"
              : body.pakej === "satu"
                ? `Darjah ${darjah[0]}`
                : `${darjah.length} Darjah`;
          const returnUrl = `${origin}/bayaran/selesai?order=${order.id}`;
          const callbackUrl = `${origin}/api/public/toyyibpay/callback`;

          logStep(id, "7/9 panggil ToyyibPay createBill bermula", {
            orderId: order.id,
            pakejLabel,
            amountSen,
            returnUrl,
            callbackUrl,
            customerEmailAda: Boolean(user.email),
          });

          let billCode: string;
          try {
            billCode = await createBill({
              secretKey,
              billName: "Kalifah.my",
              billDescription: `Langganan ${pakejLabel}`,
              amountSen,
              externalRef: order.id,
              returnUrl,
              callbackUrl,
              customerName:
                (user.user_metadata?.name as string | undefined) ??
                user.email?.split("@")[0] ??
                "Pelanggan",
              customerEmail: user.email ?? "noreply@kalifah.my",
              customerPhone:
                (user.user_metadata?.phone as string | undefined) ?? undefined,
            });
          } catch (error) {
            logError(id, "7/9 ToyyibPay createBill gagal", error);
            return jsonError(id, 502, "Gagal cipta bil ToyyibPay", safeError(error));
          }

          const paymentUrl = `https://toyyibpay.com/${billCode}`;
          logStep(id, "7/9 ToyyibPay createBill berjaya", {
            billCode,
            paymentUrl,
          });

          logStep(id, "8/9 update billcode public.pesanan bermula", {
            orderId: order.id,
            billCode,
          });
          const {
            error: updErr,
            status: updateStatus,
            statusText: updateStatusText,
          } = await userClient
            .from("pesanan")
            .update({ billcode: billCode })
            .eq("id", order.id);

          if (updErr) {
            logWarn(id, "8/9 update billcode gagal tetapi redirect diteruskan", {
              supabase: safeError(updErr),
              updateStatus,
              updateStatusText,
            });
          } else {
            logStep(id, "8/9 update billcode berjaya", {
              updateStatus,
              updateStatusText,
            });
          }

          logStep(id, "9/9 pulangkan URL ToyyibPay kepada frontend", {
            ok: true,
            orderId: order.id,
            billCode,
            paymentUrl,
          });

          return Response.json({
            ok: true,
            trace_id: id,
            order_id: order.id,
            billcode: billCode,
            url: paymentUrl,
            payment_url: paymentUrl,
          });
        } catch (error) {
          logError(id, "ralat tidak dijangka", error);
          return jsonError(
            id,
            500,
            error instanceof Error ? error.message : "Ralat tidak diketahui",
            safeError(error),
          );
        }
      },
    },
  },
});
