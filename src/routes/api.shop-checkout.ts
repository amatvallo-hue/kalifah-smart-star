import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createBill } from "@/lib/toyyibpay";

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

const PUBLIC_APP_URL =
  process.env.PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "https://kalifah.my";

type Body = Record<string, unknown>;

function str(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t.slice(0, max) : null;
}

function safeError(error: unknown) {
  if (error instanceof Error) return { message: error.message };
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    return { message: e.message, code: e.code, details: e.details, hint: e.hint };
  }
  return { message: String(error) };
}

export const Route = createFileRoute("/api/shop-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const trace = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
        try {
          let body: Body;
          try {
            body = (await request.json()) as Body;
          } catch {
            return Response.json({ ok: false, error: "JSON body tidak sah" }, { status: 400 });
          }

          const produkId = str(body.produk_id, 64);
          const kuantiti = Number(body.kuantiti);
          const nama = str(body.nama_pembeli, 120);
          const telefon = str(body.telefon, 40);
          const email = str(body.email, 254);
          const alamat = str(body.alamat, 500);
          const consent = body.consent_pemasaran === true;

          if (!produkId || !nama || !telefon || !alamat) {
            return Response.json({ ok: false, error: "Sila lengkapkan semua maklumat wajib" }, { status: 400 });
          }
          if (!Number.isInteger(kuantiti) || kuantiti < 1 || kuantiti > 50) {
            return Response.json({ ok: false, error: "Kuantiti tidak sah" }, { status: 400 });
          }
          if (!consent) {
            return Response.json({ ok: false, error: "Sila tandakan kebenaran hubungi" }, { status: 400 });
          }

          const auth = request.headers.get("authorization") ?? "";
          const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: auth ? { headers: { Authorization: auth } } : {},
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: rpcData, error: rpcErr } = await supa.rpc("buat_pesanan_shop", {
            p_produk_id: produkId,
            p_kuantiti: kuantiti,
            p_nama_pembeli: nama,
            p_telefon: telefon,
            p_email: email,
            p_alamat: alamat,
            p_consent_pemasaran: consent,
            p_utm_source: str(body.utm_source, 120),
            p_utm_medium: str(body.utm_medium, 120),
            p_utm_campaign: str(body.utm_campaign, 120),
            p_utm_content: str(body.utm_content, 120),
            p_ref_code: str(body.ref_code, 64),
          });

          const order = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
            | { id: string; kod_pesanan: string; jumlah_rm_sen: number }
            | null;

          if (rpcErr || !order) {
            console.error(`[shop-checkout:${trace}] buat_pesanan_shop gagal`, rpcErr);
            return Response.json(
              { ok: false, error: rpcErr?.message ?? "Gagal cipta pesanan", detail: safeError(rpcErr) },
              { status: 400 },
            );
          }

          const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
          if (!secretKey) {
            return Response.json({ ok: false, error: "TOYYIBPAY_SECRET_KEY tidak ditetapkan" }, { status: 500 });
          }

          const namaProduk = str(body.nama_produk, 100) ?? "Kalifah Shop";
          const returnUrl = `${PUBLIC_APP_URL}/shop/pesanan/${order.kod_pesanan}`;
          const callbackUrl = `${PUBLIC_APP_URL}/api/public/toyyibpay/callback`;

          let billCode: string;
          try {
            billCode = await createBill({
              secretKey,
              billName: "Kalifah Shop",
              billDescription: `${namaProduk} x${kuantiti}`.slice(0, 100),
              amountSen: order.jumlah_rm_sen,
              externalRef: order.id,
              returnUrl,
              callbackUrl,
              customerName: nama,
              customerEmail: email ?? "noreply@kalifah.my",
              customerPhone: telefon,
            });
          } catch (error) {
            console.error(`[shop-checkout:${trace}] createBill gagal`, error);
            return Response.json(
              { ok: false, error: "Gagal cipta bil pembayaran", detail: safeError(error) },
              { status: 502 },
            );
          }

          await supa
            .from("shop_pesanan")
            .update({ toyyibpay_bill_code: billCode })
            .eq("id", order.id);

          return Response.json({
            ok: true,
            kod_pesanan: order.kod_pesanan,
            jumlah_rm_sen: order.jumlah_rm_sen,
            payment_url: `https://toyyibpay.com/${billCode}`,
          });
        } catch (error) {
          console.error(`[shop-checkout:${trace}] ralat tidak dijangka`, error);
          return Response.json({ ok: false, error: "Ralat pelayan", detail: safeError(error) }, { status: 500 });
        }
      },
    },
  },
});
