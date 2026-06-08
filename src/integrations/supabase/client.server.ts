import { createClient } from "@supabase/supabase-js";

// Admin client — service role bypass RLS. Server-only.
// Lovable Cloud injects SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY at runtime.
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://pgpkqbdyxoejwvubluqq.supabase.co";

export function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tidak ditetapkan. Pastikan Lovable Cloud aktif.",
    );
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
