import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyAndUnlock } from "@/lib/payment-unlock.server";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

// Frontend-triggered fallback: dipanggil dari /bayaran/selesai
// untuk pastikan akses dibuka jika ToyyibPay callback gagal sampai.
export const Route = createFileRoute("/api/confirm-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = traceId();
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) {
            return Response.json(
              { ok: false, error: "Tidak log masuk" },
              { status: 401 },
            );
          }
          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userData, error: userErr } =
            await userClient.auth.getUser();
          if (userErr || !userData.user) {
            return Response.json(
              { ok: false, error: "Sesi tidak sah" },
              { status: 401 },
            );
          }
          const body = (await request.json().catch(() => ({}))) as {
            order_id?: string;
            billcode?: string;
          };
          console.log(`[confirm:${id}]`, {
            userId: userData.user.id,
            ...body,
          });

          // Pastikan order milik user
          const lookup = body.order_id
            ? userClient
                .from("pesanan")
                .select("id, user_id")
                .eq("id", body.order_id)
                .maybeSingle()
            : userClient
                .from("pesanan")
                .select("id, user_id")
                .eq("billcode", body.billcode ?? "")
                .maybeSingle();
          const { data: ord } = await lookup;
          if (!ord || ord.user_id !== userData.user.id) {
            return Response.json(
              { ok: false, error: "Pesanan tidak dijumpai" },
              { status: 404 },
            );
          }
          console.log(`[confirm:${id}] order verified`, { orderId: ord.id });

          const result = await verifyAndUnlock({
            traceId: id,
            orderId: ord.id,
            billcode: body.billcode ?? null,
            statusFromCallback: null,
            txnId: null,
            actorClient: userClient,
            requireOwnerUserId: userData.user.id,
          });
          console.log(`[confirm:${id}] unlock result`, result);
          return Response.json(result);
        } catch (e) {
          console.error(`[confirm:${id}] exception`, e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "ralat" },
            { status: 500 },
          );
        }
      },
    },
  },
});
