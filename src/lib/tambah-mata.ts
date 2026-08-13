import { supabase } from "@/integrations/supabase/client";

/**
 * Bagi star melalui RPC server-side `beri_star_generik`.
 * Server yang tentukan jumlah star (star_sumber_rules) & guna auth.uid().
 * Param `userId` dan `mata` dikekalkan untuk keserasian call site sedia ada,
 * tapi TIDAK dihantar ke server (client tak dipercayai).
 */
export async function tambahMata({
  sumber,
  darjah,
  subjek,
}: {
  userId?: string;
  mata?: number;
  sumber: string;
  darjah?: string;
  subjek?: string;
}): Promise<number> {
  const { data, error } = await supabase.rpc("beri_star_generik" as never, {
    p_sumber: sumber,
    p_darjah: darjah ?? null,
    p_subjek: subjek ?? null,
  } as never);
  if (error) {
    console.error("tambahMata gagal:", error);
    return 0;
  }
  return (data as unknown as number) ?? 0;
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
