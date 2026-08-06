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

export const PARENT_SESSION_BACKUP_KEY = "kalifah_parent_session_backup";
const SKIP_CHILD_GUARD_KEY = "kalifah_skip_child_guard";
const SKIP_GUARD_WINDOW_MS = 8000;

export function markSkipChildGuard() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SKIP_CHILD_GUARD_KEY, String(Date.now()));
}

export function shouldSkipChildGuard(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.sessionStorage.getItem(SKIP_CHILD_GUARD_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > SKIP_GUARD_WINDOW_MS) {
    window.sessionStorage.removeItem(SKIP_CHILD_GUARD_KEY);
    return false;
  }
  return true;
}

export function clearSkipChildGuard() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SKIP_CHILD_GUARD_KEY);
}

function janaPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  // pastikan ada huruf + nombor
  return out + "a7";
}

function janaUsernameDari(nama: string): string {
  const base = normalizeUsername(nama).slice(0, 20) || "anak";
  const digit = String(Math.floor(1000 + Math.random() * 9000));
  return `${base}${digit}`.slice(0, 30);
}

/**
 * Cipta akaun anak (signup) tanpa mengganggu sesi ibu bapa.
 * Username & password dijana automatik. Kalau signup memulangkan session,
 * ia dipulangkan supaya caller boleh auto-login anak pada client utama.
 */
export async function ciptaAkaunAnak(
  nama: string,
  darjah: string,
): Promise<{
  ok: boolean;
  mesej?: string;
  childId?: string;
  userId?: string;
  username?: string;
  generatedPassword?: string;
  session?: { access_token: string; refresh_token: string } | null;
  needsManualLogin?: boolean;
}> {
  if (!nama.trim()) {
    return { ok: false, mesej: "Sila isi nama anak." };
  }
  const password = janaPassword();


  // 1) Dapatkan parent user id dari sesi semasa
  const { data: parentSess } = await supabase.auth.getSession();
  const parentId = parentSess.session?.user?.id;
  if (!parentId) return { ok: false, mesej: "Anda perlu log masuk sebagai ibu bapa." };

  // 2) Jana username unik (cuba beberapa kali kalau clash)
  let uname = "";
  for (let cuba = 0; cuba < 6; cuba++) {
    const calon = janaUsernameDari(nama);
    if (!isValidUsername(calon)) continue;
    const { data: wujud } = await supabase
      .from("child_profiles" as never)
      .select("id")
      .eq("username", calon)
      .maybeSingle();
    if (!wujud) {
      uname = calon;
      break;
    }
  }
  if (!uname) return { ok: false, mesej: "Gagal menjana username unik. Sila cuba lagi." };


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

  const darjahNumEvt = Number(darjah);
  try {
    void supabase
      .from("analytics_events")
      .insert({
        event_name: "tambah_anak",
        user_id: parentId,
        metadata: { child_id: (row as { id: string }).id, darjah: darjahNumEvt },
      })
      .then(() => {}, () => {});
  } catch {
    /* analytics tidak boleh ganggu flow */
  }

  // 5) Set darjah_akses pada profile anak — HANYA mirror akses yang
  //    parent sudah bayar. Jangan invent akses baharu (elak bypass bayaran).
  const darjahNum = Number(darjah);
  if (Number.isFinite(darjahNum) && darjahNum > 0) {
    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("darjah_akses")
      .eq("id", parentId)
      .maybeSingle();

    const parentAksesRaw = (parentProfile as { darjah_akses: unknown } | null)?.darjah_akses;
    const parentAkses: number[] = Array.isArray(parentAksesRaw)
      ? (parentAksesRaw as number[]).map(Number).filter(Number.isFinite)
      : typeof parentAksesRaw === "string"
        ? parentAksesRaw.replace(/[{}]/g, "").split(",").map(Number).filter(Number.isFinite)
        : [];

    const aksesAnak = parentAkses.includes(darjahNum) ? [darjahNum] : [];

    const { error: profErr } = await secondary
      .from("profiles")
      .upsert(
        { id: childUserId, darjah_akses: aksesAnak },
        { onConflict: "id" },
      );
    if (profErr) {
      console.error("[ciptaAkaunAnak] gagal set darjah_akses anak:", profErr);
    }
  }

  // 6) Ambil session anak (kalau ada) sebelum bersihkan klien sekunder
  const childSession = signup.session
    ? {
        access_token: signup.session.access_token,
        refresh_token: signup.session.refresh_token,
      }
    : null;

  await secondary.auth.signOut();

  return {
    ok: true,
    childId: (row as { id: string }).id,
    userId: childUserId,
    username: uname,
    generatedPassword: password,
    session: childSession,
    needsManualLogin: !childSession,
  };
}

/**
 * Tukar semula sesi aktif kepada sesi ibu bapa yang disimpan sebelum
 * auto-login anak. Pulangkan true kalau berjaya.
 */
export async function switchBackToParent(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const raw = window.sessionStorage.getItem(PARENT_SESSION_BACKUP_KEY);
  if (!raw) return false;
  try {
    const tokens = JSON.parse(raw) as { access_token?: string; refresh_token?: string };
    if (!tokens.access_token || !tokens.refresh_token) {
      window.sessionStorage.removeItem(PARENT_SESSION_BACKUP_KEY);
      return false;
    }
    const { error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    window.sessionStorage.removeItem(PARENT_SESSION_BACKUP_KEY);
    return !error;
  } catch {
    window.sessionStorage.removeItem(PARENT_SESSION_BACKUP_KEY);
    return false;
  }
}


function janaKod(): string {
  const huruf = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += huruf[Math.floor(Math.random() * huruf.length)];
  return out;
}

/**
 * Sebelum ke /harga: kalau sesi semasa adalah akaun anak, cuba tukar semula
 * kepada sesi ibu bapa. Pulangkan URL yang patut dilawati.
 */
export async function laluanCheckout(darjahId: string): Promise<string> {
  const hargaUrl = `/harga?pakej=satu&darjah=${darjahId}`;
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email ?? "";
  if (!email.includes(CHILD_EMAIL_DOMAIN)) return hargaUrl;

  const berjaya = await switchBackToParent();
  if (berjaya) return hargaUrl;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("kalifah_redirect_selepas_login", hargaUrl);
  }
  return `/login?mesej=${encodeURIComponent("Sila log masuk sebagai ibu bapa untuk langgan")}&redirect=${encodeURIComponent(hargaUrl)}`;
}
