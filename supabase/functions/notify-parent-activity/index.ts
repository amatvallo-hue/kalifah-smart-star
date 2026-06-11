// Supabase Edge Function: notify-parent-activity
// Triggered via Supabase Database Webhook on INSERT into public.user_progress.
// Looks up the parent's email and sends a notification via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    user_id: string;
    darjah: string;
    subjek: string;
    aktiviti: string;
    markah: number;
    jumlah_soalan: number;
    peratus: number | string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY tidak ditetapkan");
    }

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== "INSERT" || payload.table !== "user_progress") {
      return new Response(
        JSON.stringify({ ok: true, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const r = payload.record;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Find child profile linked to this user
    const { data: child, error: childErr } = await admin
      .from("child_profiles")
      .select("nama, darjah, parent_id")
      .eq("child_user_id", r.user_id)
      .maybeSingle();

    if (childErr) throw childErr;
    if (!child) {
      console.log("Tiada child_profile untuk user_id:", r.user_id);
      return new Response(
        JSON.stringify({ ok: true, skipped: "no_child_profile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch parent email via auth admin (profiles table tiada email)
    const { data: parentUser, error: parentErr } =
      await admin.auth.admin.getUserById(child.parent_id);
    if (parentErr) throw parentErr;
    const parentEmail = parentUser?.user?.email;
    if (!parentEmail) {
      console.log("Tiada email untuk parent:", child.parent_id);
      return new Response(
        JSON.stringify({ ok: true, skipped: "no_parent_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const peratus =
      typeof r.peratus === "string" ? Number(r.peratus) : r.peratus;
    const subject = "Anak anda baru selesai aktiviti di Kalifah.my! 🎉";
    const text =
      `${child.nama} baru selesai ${r.aktiviti} dalam ${r.subjek} Darjah ${child.darjah} ` +
      `dengan skor ${r.markah}/${r.jumlah_soalan} (${Math.round(peratus)}%)`;
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="color:#16a34a;margin:0 0 12px">Tahniah! 🎉</h2>
        <p>${text}</p>
        <p style="margin-top:24px">
          <a href="https://kalifah.my/dashboard/ibu-bapa"
             style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
             Lihat Dashboard Ibu Bapa
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px;margin-top:32px">— Kalifah.my</p>
      </div>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kalifah.my <noreply@kalifah.my>",
        to: [parentEmail],
        subject,
        text,
        html,
      }),
    });

    const resendBody = await resendRes.text();
    if (!resendRes.ok) {
      console.error("Resend gagal:", resendRes.status, resendBody);
      return new Response(
        JSON.stringify({ ok: false, status: resendRes.status, body: resendBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, sent_to: parentEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("notify-parent-activity error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e instanceof Error ? e.message : e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
