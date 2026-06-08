import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createBill } from "@/lib/toyyibpay";
import { kiraHarga, type PakejId } from "@/lib/checkout";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.log("[checkout] 1/7 received POST");
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "");
          if (!token) {
            console.warn("[checkout] no auth token");
            return Response.json(
              { error: "Tidak log masuk" },
              { status: 401 },
            );
          }

          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false },
          });
          const { data: userData, error: userErr } =
            await userClient.auth.getUser();
          if (userErr || !userData.user) {
            console.warn("[checkout] auth fail", userErr?.message);
            return Response.json(
              { error: "Sesi tidak sah" },
              { status: 401 },
            );
          }
          const user = userData.user;
          console.log("[checkout] 2/7 user", user.id);

          const body = (await request.json()) as {
            pakej: PakejId;
            darjah: number[];
          };
          console.log("[checkout] 3/7 body", body);
          if (!body.pakej || !Array.isArray(body.darjah)) {
            return Response.json(
              { error: "Input tidak sah" },
              { status: 400 },
            );
          }
          const darjah = body.darjah
            .map((n) => Number(n))
            .filter((n) => n >= 1 && n <= 6);
          const amount = kiraHarga(body.pakej, darjah);
          const amountSen = amount * 100;
          console.log("[checkout] 4/7 amount", amount, "sen", amountSen);

          const { data: order, error: orderErr } = await userClient
            .from("pesanan")
            .insert({
              user_id: user.id,
              pakej: body.pakej,
              darjah_dipilih: darjah,
              amount_sen: amountSen,
              status: "pending",
            })
            .select("id")
            .single();
          if (orderErr || !order) {
            console.error("[checkout] insert pesanan fail", orderErr);
            return Response.json(
              {
                error: "Gagal cipta pesanan",
                detail: orderErr?.message,
              },
              { status: 500 },
            );
          }
          console.log("[checkout] 5/7 order created", order.id);

          const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
          if (!secretKey) {
            console.error("[checkout] TOYYIBPAY_SECRET_KEY missing");
            return Response.json(
              { error: "TOYYIBPAY_SECRET_KEY tidak ditetapkan" },
              { status: 500 },
            );
          }

          const origin =
            request.headers.get("origin") ??
            `https://${request.headers.get("host") ?? "kalifah.my"}`;

          const pakejLabel =
            body.pakej === "bundle"
              ? "Bundle 6 Darjah"
              : body.pakej === "satu"
                ? `Darjah ${darjah[0]}`
                : `${darjah.length} Darjah`;

          console.log("[checkout] 6/7 calling ToyyibPay createBill");
          const billCode = await createBill({
            secretKey,
            billName: "Kalifah.my",
            billDescription: `Langganan ${pakejLabel}`,
            amountSen,
            externalRef: order.id,
            returnUrl: `${origin}/bayaran/selesai?order=${order.id}`,
            callbackUrl: `${origin}/api/public/toyyibpay/callback`,
            customerName:
              (user.user_metadata?.name as string | undefined) ??
              user.email?.split("@")[0] ??
              "Pelanggan",
            customerEmail: user.email ?? "noreply@kalifah.my",
            customerPhone:
              (user.user_metadata?.phone as string | undefined) ?? undefined,
          });
          console.log("[checkout] 7/7 billCode", billCode);

          const { error: updErr } = await userClient
            .from("pesanan")
            .update({ billcode: billCode })
            .eq("id", order.id);
          if (updErr) console.warn("[checkout] update billcode warn", updErr);

          return Response.json({
            ok: true,
            order_id: order.id,
            billcode: billCode,
            url: `https://toyyibpay.com/${billCode}`,
          });
        } catch (e) {
          console.error("[checkout] ralat:", e);
          return Response.json(
            {
              error: e instanceof Error ? e.message : "Ralat tidak diketahui",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
