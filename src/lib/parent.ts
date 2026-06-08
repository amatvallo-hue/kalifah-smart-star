import { supabase } from "@/integrations/supabase/client";

export interface ChildProfile {
  id: string;
  parent_id: string;
  child_user_id: string | null;
  nama: string;
  darjah: string;
  kod_jemputan: string;
  created_at: string;
}

function janaKod(): string {
  const huruf = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // tanpa I, O, 0, 1 (mudah dibaca)
  let out = "";
  for (let i = 0; i < 6; i++) out += huruf[Math.floor(Math.random() * huruf.length)];
  return out;
}

export async function senaraikanAnak(): Promise<ChildProfile[]> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) {
    console.warn("senaraikanAnak: tiada sesi pengguna");
    return [];
  }
  const { data, error } = await supabase
    .from("child_profiles" as never)
    .select("*")
    .eq("parent_id", uid)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("senaraikanAnak gagal:", error);
    return [];
  }
  console.info(`senaraikanAnak: ${data?.length ?? 0} anak untuk parent ${uid}`);
  return (data ?? []) as unknown as ChildProfile[];
}

export async function tambahAnak(
  nama: string,
  darjah: string,
): Promise<{ ok: true; row: ChildProfile } | { ok: false; mesej: string }> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return { ok: false, mesej: "Anda perlu log masuk semula." };
  let lastErr = "Tidak dapat menjana kod unik. Cuba lagi.";
  for (let cuba = 0; cuba < 5; cuba++) {
    const kod = janaKod();
    const username = `anak_${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase
      .from("child_profiles" as never)
      .insert({ parent_id: uid, nama: nama.trim(), darjah, kod_jemputan: kod, username })
      .select("*")
      .single();
    if (!error && data) return { ok: true, row: data as unknown as ChildProfile };
    if (error) {
      lastErr = error.message;
      console.warn("tambahAnak gagal:", error);
      const msg = error.message.toLowerCase();
      // Retry pada konflik unik (kod_jemputan / username) sahaja
      if (!msg.includes("kod_jemputan") && !msg.includes("username")) {
        return { ok: false, mesej: error.message };
      }
    }
  }
  return { ok: false, mesej: lastErr };
}

export async function padamAnak(id: string): Promise<boolean> {
  const { error } = await supabase.from("child_profiles" as never).delete().eq("id", id);
  if (error) console.warn("padamAnak gagal:", error);
  return !error;
}

export async function sertaiDenganKod(kod: string): Promise<{ ok: boolean; mesej?: string }> {
  const { error } = await supabase.rpc("sertai_dengan_kod" as never, { _kod: kod.trim().toUpperCase() } as never);
  if (error) return { ok: false, mesej: error.message };
  return { ok: true };
}
