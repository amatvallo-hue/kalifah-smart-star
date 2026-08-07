import { supabase } from "@/integrations/supabase/client";

export async function tambahMata({
  userId,
  mata,
  sumber,
  darjah,
  subjek,
}: {
  userId: string;
  mata: number;
  sumber: string;
  darjah: string;
  subjek: string;
}) {
  // Log transaksi
  await supabase.from("user_points_log").insert({
    user_id: userId,
    mata,
    sumber,
    darjah,
    subjek,
  });

  // Upsert total
  const { data: existing } = await supabase
    .from("user_points")
    .select("jumlah_mata")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_points")
      .update({ jumlah_mata: existing.jumlah_mata + mata, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("user_points")
      .insert({ user_id: userId, jumlah_mata: mata });
  }
}

/**
 * Kuiz sahaja: bagi 1 star, tapi HANYA sekali seumur hidup untuk setiap soalan unik
 * (anti-farm — "Cuba Lagi" replay tak bagi star berulang untuk soalan yang sama).
 * Guna RPC award_kuiz_star() di Supabase supaya dedup berlaku secara atomic di server.
 * Return true kalau star diberi, false kalau soalan ni dah pernah bagi star sebelum ni.
 */
export async function awardKuizStar({
  soalanRef,
  darjah,
  subjek,
}: {
  soalanRef: string;
  darjah: string;
  subjek: string;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc("award_kuiz_star", {
    p_soalan_ref: soalanRef,
    p_darjah: darjah,
    p_subjek: subjek,
  });
  if (error) {
    console.error("awardKuizStar gagal:", error);
    return false;
  }
  return !!data;
}

/**
 * KALI (Belajar Bersama KALI) sahaja: bagi 1 star, tapi HANYA sekali seumur hidup untuk
 * setiap soalan unik (anti-farm — sama macam awardKuizStar).
 * Guna RPC award_kali_star() di Supabase supaya dedup berlaku secara atomic di server.
 * Return true kalau star diberi, false kalau soalan ni dah pernah bagi star sebelum ni.
 */
export async function awardKaliStar({
  soalanRef,
  darjah,
  subjek,
}: {
  soalanRef: string;
  darjah: string;
  subjek: string;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc("award_kali_star", {
    p_soalan_ref: soalanRef,
    p_darjah: darjah,
    p_subjek: subjek,
  });
  if (error) {
    console.error("awardKaliStar gagal:", error);
    return false;
  }
  return !!data;
}

/**
 * Bonus +5 star bila pelajar habiskan 1 sesi penuh Belajar Bersama KALI (10 soalan).
 * Guna RPC award_kali_sesi_bonus() — dihadkan max 1x sehari per pelajar (server-side).
 * Return true kalau bonus diberi, false kalau dah dapat bonus sesi KALI hari ni.
 */
export async function awardKaliSesiBonus(): Promise<boolean> {
  const { data, error } = await supabase.rpc("award_kali_sesi_bonus");
  if (error) {
    console.error("awardKaliSesiBonus gagal:", error);
    return false;
  }
  return !!data;
}
