-- Lock semua darjah & sokong akaun anak dengan username
-- 1) Reset akses sedia ada — semua pengguna kena bayar
UPDATE public.profiles SET darjah_akses = '{}'::int[];

-- 2) Default baru untuk profil baru = kosong
ALTER TABLE public.profiles ALTER COLUMN darjah_akses SET DEFAULT '{}'::int[];

-- 3) Tambah username kepada child_profiles (unik, opsyenal)
ALTER TABLE public.child_profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE;

CREATE INDEX IF NOT EXISTS child_profiles_username_idx
  ON public.child_profiles (username);
