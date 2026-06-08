import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getBillTransactions } from "@/lib/toyyibpay";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

function traceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

// Frontend-triggered fallback. Verify dgn ToyyibPay, lepas itu insert ke
// public.payments — trigger akan update profiles.darjah_akses.
export const Route = createFileRoute("/api/confirm-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const id = traceId();
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) {
            return Response.json({ ok: false, error: "Tidak log masuk" }, { status: 401 });
          }
          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userData, error: userErr } = await userClient.auth.getUser();
          if (userErr || !userData.user) {
            return Response.json({ ok: false, error: "Sesi tidak sah" }, { status: 401 });
          }

          const body = (await request.json().catch(() => ({}))) as {
            order_id?: string;
            billcode?: string;
          };
          console.log(`[confirm:${id}] start`, { userId: userData.user.id, ...body });

          // Pastikan pesanan milik user & ambil billcode
          const lookup = body.order_id
            ? userClient
                .from("pesanan")
                .select("id, user_id, billcode, status")
                .eq("id", body.order_id)
                .maybeSingle()
            : userClient
                .from("pesanan")
                .select("id, user_id, billcode, status")
                .eq("billcode", body.billcode ?? "")
                .maybeSingle();
          const { data: ord, error: ordErr } = await lookup;
          if (ordErr) console.error(`[confirm:${id}] lookup pesanan ralat`, ordErr);
          if (!ord || ord.user_id !== userData.user.id) {
            return Response.json({ ok: false, error: "Pesanan tidak dijumpai" }, { status: 404 });
          }

          const billcode = ord.billcode ?? body.billcode ?? null;
          if (!billcode) {
            return Response.json({ ok: false, error: "Tiada billcode" }, { status: 400 });
          }

          // Verify dgn ToyyibPay
          const secret = process.env.TOYYIBPAY_SECRET_KEY?.trim();
          if (!secret) {
            return Response.json(
              { ok: false, error: "TOYYIBPAY_SECRET_KEY tiada" },
              { status: 500 },
            );
          }
          const txs = await getBillTransactions(secret, billcode);
          const paid = txs.some((t) => String(t.billpaymentStatus) === "1");
          console.log(`[confirm:${id}] verify`, { count: txs.length, paid });
          if (!paid) {
            return Response.json({ ok: false, reason: "not-paid-yet" });
          }

          // Insert ke payments → trigger DB akan buka darjah_akses
          const { error: insErr } = await userClient.from("payments").insert({
            billcode,
            order_id: ord.id,
            status: "1",
            toyyib_transaction_id: null,
            raw: { source: "confirm-payment", trace: id },
          });
          if (insErr) {
            console.error(`[confirm:${id}] insert payments gagal`, insErr);
            return Response.json(
              { ok: false, error: insErr.message },
              { status: 500 },
            );
          }
          console.log(`[confirm:${id}] payment inserted — trigger akan unlock`);
          return Response.json({ ok: true, reason: "unlock-triggered" });
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
