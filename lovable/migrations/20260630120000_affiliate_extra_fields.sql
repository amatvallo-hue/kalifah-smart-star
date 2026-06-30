-- Tambah field tambahan untuk affiliate
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS nama_pemilik_bank TEXT,
  ADD COLUMN IF NOT EXISTS platform_promosi TEXT[];

NOTIFY pgrst, 'reload schema';
