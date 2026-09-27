import { createFileRoute } from "@tanstack/react-router";

// GET memaparkan halaman pengesahan sahaja (tiada perubahan data).
// POST (butang atau one-click List-Unsubscribe) menambah e-mel ke email_suppression.

const page = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Berhenti langgan — Kalifah.my</title></head><body style="font-family:system-ui,sans-serif;max-width:480px;margin:48px auto;padding:0 16px;color:#1f2937">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

async function semak(url: URL) {
  const e = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const t = url.searchParams.get("t") ?? "";
  if (!e || !t) return null;
  const { sahkanToken } = await import("@/lib/kempen-kali-email.server");
  return sahkanToken(e, t) ? e : null;
}

export const Route = createFileRoute("/api/public/berhenti-langgan")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const e = await semak(url);
        if (!e) return page("<h1>Pautan tidak sah</h1>", 400);
        return page(`<h1 style="font-size:22px">Berhenti langgan e-mel promosi?</h1><p>E-mel: <b>${e.replace(/</g, "&lt;")}</b></p>
<form method="post"><button style="background:#1B8A5A;color:#fff;border:0;padding:12px 20px;border-radius:10px;font-weight:700">Ya, berhenti langgan</button></form>`);
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const e = await semak(url);
        if (!e) return page("<h1>Pautan tidak sah</h1>", 400);
        const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await getSupabaseAdmin()
          .from("email_suppression")
          .upsert({ email: e, sebab: "unsubscribe", sumber: "kempen-link" }, { onConflict: "email", ignoreDuplicates: true });
        if (error) {
          console.error("[berhenti-langgan]", error.message);
          return page("<h1>Ralat</h1><p>Sila cuba lagi sebentar.</p>", 500);
        }
        return page("<h1>Anda telah berhenti langgan</h1><p>Anda tidak akan menerima e-mel promosi Kalifah.my lagi.</p>");
      },
    },
  },
});
