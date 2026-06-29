-- Tambah maklumat ibu bapa pada profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nama_penuh TEXT,
  ADD COLUMN IF NOT EXISTS no_telefon TEXT,
  ADD COLUMN IF NOT EXISTS negeri TEXT;

NOTIFY pgrst, 'reload schema';
