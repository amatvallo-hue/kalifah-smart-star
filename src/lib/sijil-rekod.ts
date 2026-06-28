// Helper untuk simpan & muat semula rekod sijil cemerlang.
import { supabase } from "@/integrations/supabase/client";

export interface RekodSijilInput {
  namaPelajar: string;
  subjek: string; // id subjek (cth "bm")
  topik: string;
  darjah: string; // cth "3"
  kodSijil: string;
}

export interface SijilRow {
  id: string;
  user_id: string;
  nama_pelajar: string;
  subjek: string;
  topik: string;
  darjah: string;
  tarikh: string; // YYYY-MM-DD
  kod_sijil: string;
  created_at: string;
}

/**
 * Simpan rekod sijil cemerlang. Idempoten: kalau pelajar dah ada sijil
 * untuk kombinasi subjek+topik+darjah yang sama, kekalkan rekod asal.
 */
export async function simpanRekodSijil(input: RekodSijilInput): Promise<SijilRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;

  // Cuba ambil rekod sedia ada
  const { data: existing } = await supabase
    .from("sijil")
    .select("*")
    .eq("user_id", uid)
    .eq("subjek", input.subjek)
    .eq("topik", input.topik)
    .eq("darjah", input.darjah)
    .maybeSingle();
  if (existing) return existing as SijilRow;

  const { data, error } = await supabase
    .from("sijil")
    .insert({
      user_id: uid,
      nama_pelajar: input.namaPelajar,
      subjek: input.subjek,
      topik: input.topik,
      darjah: input.darjah,
      kod_sijil: input.kodSijil,
    })
    .select()
    .single();
  if (error) {
    console.warn("[simpanRekodSijil] gagal:", error.message);
    return null;
  }
  return data as SijilRow;
}

export async function senaraikanSijilAnak(childUserId: string): Promise<SijilRow[]> {
  const { data, error } = await supabase
    .from("sijil")
    .select("*")
    .eq("user_id", childUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[senaraikanSijilAnak] gagal:", error.message);
    return [];
  }
  return (data ?? []) as SijilRow[];
}
