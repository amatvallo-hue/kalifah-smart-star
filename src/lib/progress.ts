import { supabase } from "@/integrations/supabase/client";

export interface SimpanProgressInput {
  darjah: string;
  subjek: string;
  aktiviti: string;
  markah: number;
  jumlahSoalan: number;
  masaAmbil?: number; // saat
}

function todayKL(): string {
  // Anggap zon waktu Malaysia untuk konsistensi streak
  const now = new Date();
  const ms = now.getTime() + (8 * 60 - now.getTimezoneOffset()) * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Simpan satu aktiviti selesai + kemas kini statistik harian. Senyap kalau gagal / tetamu. */
export async function simpanProgress(input: SimpanProgressInput): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) return;

    const jumlah = Math.max(1, input.jumlahSoalan || 1);
    const markah = Math.max(0, input.markah || 0);
    const peratus = Math.round((markah / jumlah) * 100);
    const masa = Math.max(0, input.masaAmbil ?? 0);

    await supabase.from("user_progress").insert({
      user_id: userId,
      darjah: String(input.darjah),
      subjek: input.subjek,
      aktiviti: input.aktiviti,
      markah,
      jumlah_soalan: jumlah,
      peratus,
      masa_ambil: masa,
    });

    const tarikh = todayKL();
    const minit = Math.max(1, Math.round(masa / 60));

    const { data: existing } = await supabase
      .from("user_stats")
      .select("id, soalan_dijawab, masa_belajar, bab_selesai")
      .eq("user_id", userId)
      .eq("tarikh", tarikh)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_stats")
        .update({
          soalan_dijawab: (existing.soalan_dijawab ?? 0) + jumlah,
          masa_belajar: (existing.masa_belajar ?? 0) + minit,
          bab_selesai: (existing.bab_selesai ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("user_stats").insert({
        user_id: userId,
        tarikh,
        soalan_dijawab: jumlah,
        masa_belajar: minit,
        bab_selesai: 1,
      });
    }
  } catch (e) {
    console.warn("simpanProgress gagal:", e);
  }
}
