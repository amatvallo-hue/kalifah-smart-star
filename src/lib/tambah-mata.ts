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
