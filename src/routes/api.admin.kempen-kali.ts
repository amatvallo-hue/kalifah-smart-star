import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

// POST sahaja. Auth: (a) Bearer token pengguna admin (profiles.role = 'admin'), atau
// (b) header x-kempen-secret = KEMPEN_EMAIL_SECRET (server-side). Tiada GET trigger.
// Mod: preview | dry_run | test. Mod production SENGAJA dimatikan dalam fasa ini.

const Body = z.object({
  mode: z.enum(["preview", "dry_run", "test", "production"]),
  segmen: z.enum(["pending_order", "pernah_latihan", "lain"]).optional(),
});

const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

async function isAuthorized(request: Request) {
  const secret = process.env["KEMPEN_EMAIL_SECRET"];
  const given = request.headers.get("x-kempen-secret");
  if (secret && given) {
    const a = Buffer.from(secret), b = Buffer.from(given);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const sb = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await sb.auth.getUser(auth.slice(7));
  if (!u.user) return false;
  const { data } = await sb.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  return (data as { role?: string } | null)?.role === "admin";
}

const json = (b: unknown, status = 200) =>
  Response.json(b, { status, headers: { "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/admin/kempen-kali")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAuthorized(request))) return json({ error: "Unauthorized" }, 401);
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Input tidak sah" }, 400);
        const { mode, segmen } = parsed.data;
        const k = await import("@/lib/kempen-kali-email.server");

        if (mode === "production") {
          return json({ error: "Production blast dimatikan dalam fasa ini. Perlu kelulusan berasingan." }, 403);
        }
        if (mode === "preview") {
          const e = k.renderEmel(segmen ?? "lain", k.TEST_EMAIL);
          return new Response(e.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
        }

        const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = getSupabaseAdmin();

        if (mode === "dry_run") {
          try {
            const a = await k.binaAudiens(admin);
            return json({ kempen: k.KEMPEN_ID, kiraan: a.kiraan, jumlah: a.jumlah, dikecualikan: a.dikecualikan, amaran: a.amaran });
          } catch (err) {
            return json({ error: (err as Error).message }, 500);
          }
        }

        // mode === "test": satu e-mel sahaja, alamat terkunci.
        const seg = segmen ?? "lain";
        const to = k.TEST_EMAIL;
        const idem = `${k.KEMPEN_ID}:test:${seg}:${to}`;
        const { error: logErr } = await admin.from("email_kempen_log").insert({
          kempen: k.KEMPEN_ID, email: to, segmen: seg, mode: "test", idempotency_key: idem, status: "queued",
        });
        if (logErr) {
          if (logErr.code === "23505") return json({ skipped: true, sebab: "E-mel ujian segmen ini sudah dihantar (idempotency)." }, 409);
          return json({ error: `Log gagal: ${logErr.message}` }, 500);
        }
        try {
          const id = await k.hantarResend(to, k.renderEmel(seg, to), idem);
          await admin.from("email_kempen_log").update({ status: "sent", resend_id: id, updated_at: new Date().toISOString() }).eq("idempotency_key", idem);
          return json({ sent: true, to, segmen: seg, resend_id: id });
        } catch (err) {
          const msg = (err as Error).message;
          console.error("[kempen-kali] test send failed:", msg);
          await admin.from("email_kempen_log").update({ status: "failed", ralat: msg, updated_at: new Date().toISOString() }).eq("idempotency_key", idem);
          return json({ error: msg }, 502);
        }
      },
    },
  },
});
