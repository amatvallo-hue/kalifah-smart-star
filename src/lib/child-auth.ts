import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Domain emel sintetik untuk akaun anak — tidak digunakan untuk hantar emel
export const CHILD_EMAIL_DOMAIN = "anak.kalifah.local";

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
}

export function isValidUsername(u: string): boolean {
  const n = normalizeUsername(u);
  return n.length >= 3 && n.length <= 30;
}

// URL/key Supabase (sama dengan client utama)
const SUPABASE_URL = "https://pgpkqbdyxoejwvubluqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo";

/**
 * Cipta akaun anak (signup) tanpa mengganggu sesi ibu bapa.
 * Guna instance Supabase sekunder dengan `persistSession: false` supaya
 * sesi ibu bapa di tetingkap utama kekal aktif.
 */
export async function ciptaAkaunAnak(
  nama: string,
  username: string,
  password: string,
  darjah: string,
): Promise<{ ok: boolean; mesej?: string; childId?: string; userId?: string }> {
  const uname = normalizeUsername(username);
  if (!isValidUsername(uname)) {
    return { ok: false, mesej: "Username mesti 3–30 aksara (huruf kecil, nombor, titik, garis bawah)." };
  }
  if (password.length < 6) {
    return { ok: false, mesej: "Password mesti sekurang-kurangnya 6 aksara." };
  }

  // 1) Dapatkan parent user id dari sesi semasa
  const { data: parentSess } = await supabase.auth.getSession();
  const parentId = parentSess.session?.user?.id;
  if (!parentId) return { ok: false, mesej: "Anda perlu log masuk sebagai ibu bapa." };

  // 2) Pastikan username belum digunakan
  const { data: wujud } = await supabase
    .from("child_profiles" as never)
    .select("id")
    .eq("username", uname)
    .maybeSingle();
  if (wujud) return { ok: false, mesej: "Username ini sudah digunakan." };

  // 3) Cipta akaun auth pada klien sekunder (supaya sesi parent tak terganti)
  const secondary = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "kalifah-child-signup" },
  });
  const childEmail = `${uname}@${CHILD_EMAIL_DOMAIN}`;
  const { data: signup, error: signupErr } = await secondary.auth.signUp({
    email: childEmail,
    password,
    options: { data: { name: nama, username: uname, role: "child" } },
  });
  if (signupErr || !signup.user) {
    return { ok: false, mesej: signupErr?.message ?? "Gagal cipta akaun anak." };
  }
  const childUserId = signup.user.id;

  // 4) Cipta rekod child_profile berserta pautan
  const kod = janaKod();
  const { data: row, error: insertErr } = await supabase
    .from("child_profiles" as never)
    .insert({
      parent_id: parentId,
      child_user_id: childUserId,
      username: uname,
      nama: nama.trim(),
      darjah,
      kod_jemputan: kod,
    })
    .select("id")
    .single();
  if (insertErr || !row) {
    return { ok: false, mesej: insertErr?.message ?? "Gagal simpan profil anak." };
  }

  // 5) Set darjah_akses pada profile anak (guna sesi anak — RLS benarkan
  //    user kemas kini profile sendiri sahaja). Anak hanya dapat akses
  //    darjah dia sendiri, bukan dari profil ibu bapa.
  const darjahNum = Number(darjah);
  if (Number.isFinite(darjahNum) && darjahNum > 0) {
    const { error: profErr } = await secondary
      .from("profiles")
      .upsert(
        { id: childUserId, darjah_akses: [darjahNum] },
        { onConflict: "id" },
      );
    if (profErr) {
      console.error("[ciptaAkaunAnak] gagal set darjah_akses anak:", profErr);
    }
  }

  // 6) Sign out klien sekunder (bersihkan)
  await secondary.auth.signOut();

  return { ok: true, childId: (row as { id: string }).id, userId: childUserId };
}

function janaKod(): string {
  const huruf = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += huruf[Math.floor(Math.random() * huruf.length)];
  return out;
}
