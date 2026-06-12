import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";

export interface AdminAffiliateRow {
  id: string;
  nama: string | null;
  email: string | null;
  ref_code: string | null;
  total_komisyen: number;
  total_dibayar: number;
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

async function assertAdmin(accessToken: string) {
  if (!accessToken) throw new Error("Tiada token. Sila log masuk semula.");
  const admin = getSupabaseAdmin();
  const { data: u, error: uErr } = await admin.auth.getUser(accessToken);
  if (uErr || !u.user) throw new Error("Sesi tidak sah.");
  const { data: p, error: pErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if ((p as { role?: string } | null)?.role !== "admin") {
    throw new Error("Bukan admin.");
  }
  return admin;
}

export const listAffiliates = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string }) => d)
  .handler(async ({ data }): Promise<AdminAffiliateRow[]> => {
    const admin = await assertAdmin(data.accessToken);
    const { data: rows, error } = await admin
      .from("affiliates")
      .select("id,nama,email,ref_code,total_komisyen,total_dibayar")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      nama: r.nama,
      email: r.email,
      ref_code: r.ref_code,
      total_komisyen: toNum(r.total_komisyen),
      total_dibayar: toNum(r.total_dibayar),
    }));
  });

export const markAffiliatePaid = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string; id: string }) => {
    if (!d?.id) throw new Error("id diperlukan");
    return d;
  })
  .handler(async ({ data }) => {
    const admin = await assertAdmin(data.accessToken);
    const { data: row, error: selErr } = await admin
      .from("affiliates")
      .select("id,total_komisyen,total_dibayar")
      .eq("id", data.id)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!row) throw new Error("Affiliate tidak ditemui");

    const komisyen = toNum((row as any).total_komisyen);
    const dibayar = toNum((row as any).total_dibayar);

    const { error: updErr } = await admin
      .from("affiliates")
      .update({ total_dibayar: dibayar + komisyen, total_komisyen: 0 })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { id: data.id, total_komisyen: 0, total_dibayar: dibayar + komisyen };
  });
