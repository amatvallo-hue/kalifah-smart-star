import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyAndUnlock } from "@/lib/payment-unlock.server";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

// Temporary authenticated fallback: verify ToyyibPay getBillTransactions,
// then unlock profiles.darjah_akses using the signed-in user's own RLS access.
export const Route = createFileRoute("/api/temporary-unlock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = traceId();
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) {
            return Response.json(
              { ok: false, error: "Tidak log masuk", trace_id: id },
              { status: 401 },
            );
          }

          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userData, error: userErr } = await userClient.auth.getUser();
          if (userErr || !userData.user) {
            return Response.json(
              { ok: false, error: "Sesi tidak sah", trace_id: id },
              { status: 401 },
            );
          }

          const body = (await request.json().catch(() => ({}))) as {
            order_id?: string;
            billcode?: string;
          };
          console.log(`[temporary-unlock:${id}] start`, {
            userId: userData.user.id,
            order_id: body.order_id,
            billcode: body.billcode,
          });

          if (!body.order_id && !body.billcode) {
            return Response.json(
              {
                ok: false,
                error: "order_id atau billcode diperlukan",
                trace_id: id,
              },
              { status: 400 },
            );
          }

          const result = await verifyAndUnlock({
            traceId: id,
            orderId: body.order_id ?? null,
            billcode: body.billcode ?? null,
            statusFromCallback: null,
            txnId: null,
            actorClient: userClient,
            requireOwnerUserId: userData.user.id,
          });
          console.log(`[temporary-unlock:${id}] result`, result);
          return Response.json({ ...result, trace_id: id });
        } catch (e) {
          console.error(`[temporary-unlock:${id}] exception`, e);
          return Response.json(
            {
              ok: false,
              error: e instanceof Error ? e.message : "ralat",
              trace_id: id,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
