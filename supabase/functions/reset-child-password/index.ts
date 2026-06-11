// Supabase Edge Function: reset-child-password
// Ibu bapa boleh reset password anak yang dipautkan kepada mereka sahaja.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ ok: false, error: "Tiada token" }, 401);

    // Identify parent via their JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ ok: false, error: "Tidak sah" }, 401);
    const parentId = userData.user.id;

    const body = (await req.json()) as { child_user_id?: string; new_password?: string };
    const childUserId = body.child_user_id?.trim();
    const newPassword = body.new_password ?? "";
    if (!childUserId) return json({ ok: false, error: "child_user_id diperlukan" }, 400);
    if (newPassword.length < 6) return json({ ok: false, error: "Password minimum 6 aksara" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify ownership
    const { data: child, error: childErr } = await admin
      .from("child_profiles")
      .select("id, parent_id, child_user_id")
      .eq("child_user_id", childUserId)
      .maybeSingle();
    if (childErr) throw childErr;
    if (!child || child.parent_id !== parentId) {
      return json({ ok: false, error: "Anda bukan ibu bapa kepada anak ini" }, 403);
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(childUserId, {
      password: newPassword,
    });
    if (updErr) throw updErr;

    return json({ ok: true });
  } catch (e) {
    console.error("reset-child-password error:", e);
    return json({ ok: false, error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
