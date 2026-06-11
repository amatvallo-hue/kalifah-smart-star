// Supabase Edge Function: remind-inactive-students
// Cron harian (00:00 UTC = 08:00 MYT) — hantar peringatan kepada ibu bapa
// untuk anak yang tiada aktiviti dalam 3 hari terakhir.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendReminder(to: string, nama: string) {
  const subject = "Anak anda sudah 3 hari tidak belajar 📚";
  const text =
    `${nama} belum belajar selama 3 hari. Jom semak dashboard untuk pantau ` +
    `kemajuan anak anda di kalifah.my`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="color:#ea580c;margin:0 0 12px">Peringatan Belajar 📚</h2>
      <p>${text}</p>
      <p style="margin-top:24px">
        <a href="https://kalifah.my/dashboard/ibu-bapa"
           style="background:#ea580c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
           Buka Dashboard
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:32px">— Kalifah.my</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Kalifah.my <noreply@kalifah.my>",
      to: [to],
      subject,
      text,
      html,
    }),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY tidak ditetapkan");

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Ambil semua child_profiles yang ada akaun anak
    const { data: children, error: childErr } = await admin
      .from("child_profiles")
      .select("nama, parent_id, child_user_id")
      .not("child_user_id", "is", null);
    if (childErr) throw childErr;

    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const results: Array<{ child: string; status: string }> = [];

    for (const c of children ?? []) {
      // 2) Cari aktiviti terakhir anak ini
      const { data: recent, error: progErr } = await admin
        .from("user_progress")
        .select("id, created_at")
        .eq("user_id", c.child_user_id!)
        .gte("created_at", cutoff)
        .limit(1);
      if (progErr) {
        console.warn("progress query gagal:", progErr);
        continue;
      }
      if ((recent ?? []).length > 0) {
        results.push({ child: c.nama, status: "active" });
        continue;
      }

      // 3) Dapatkan email ibu bapa
      const { data: parentUser, error: parentErr } =
        await admin.auth.admin.getUserById(c.parent_id);
      if (parentErr) {
        console.warn("getUserById gagal:", parentErr);
        continue;
      }
      const email = parentUser?.user?.email;
      if (!email) {
        results.push({ child: c.nama, status: "no_email" });
        continue;
      }

      // 4) Hantar peringatan
      const r = await sendReminder(email, c.nama);
      if (!r.ok) {
        console.error("resend gagal:", r.status, r.body);
        results.push({ child: c.nama, status: `resend_${r.status}` });
      } else {
        results.push({ child: c.nama, status: "sent" });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, count: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("remind-inactive-students error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e instanceof Error ? e.message : e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
