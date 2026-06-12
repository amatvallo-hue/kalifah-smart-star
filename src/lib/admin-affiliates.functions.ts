import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminAffiliateRow {
  id: string;
  nama: string | null;
  email: string | null;
  ref_code: string | null;
  total_komisyen: number;
  total_dibayar: number;
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if ((data as { role?: string } | null)?.role !== "admin") {
    throw new Error("Forbidden: bukan admin");
  }
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export const listAffiliates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAffiliateRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("id,nama,email,ref_code,total_komisyen,total_dibayar")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      nama: r.nama,
      email: r.email,
      ref_code: r.ref_code,
      total_komisyen: toNum(r.total_komisyen),
      total_dibayar: toNum(r.total_dibayar),
    }));
  });

export const markAffiliatePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id || typeof d.id !== "string") throw new Error("id diperlukan");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: selErr } = await supabaseAdmin
      .from("affiliates")
      .select("id,total_komisyen,total_dibayar")
      .eq("id", data.id)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!row) throw new Error("Affiliate tidak ditemui");

    const komisyen = toNum((row as any).total_komisyen);
    const dibayar = toNum((row as any).total_dibayar);

    const { error: updErr } = await supabaseAdmin
      .from("affiliates")
      .update({ total_dibayar: dibayar + komisyen, total_komisyen: 0 })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { id: data.id, total_komisyen: 0, total_dibayar: dibayar + komisyen };
  });
