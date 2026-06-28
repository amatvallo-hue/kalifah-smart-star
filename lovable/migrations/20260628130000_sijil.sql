-- Sijil cemerlang: rekod sijil yang dijana untuk skor 100% dalam kuiz topik.
-- Membolehkan ibu bapa lihat dan muat turun semula sijil anak.

CREATE TABLE IF NOT EXISTS public.sijil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_pelajar TEXT NOT NULL,
  subjek TEXT NOT NULL,
  topik TEXT NOT NULL,
  darjah TEXT NOT NULL,
  tarikh DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date,
  kod_sijil TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Elak duplikat: satu sijil per user/subjek/topik/darjah
CREATE UNIQUE INDEX IF NOT EXISTS sijil_user_unique_idx
  ON public.sijil (user_id, subjek, topik, darjah);

CREATE INDEX IF NOT EXISTS sijil_user_created_idx
  ON public.sijil (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.sijil TO authenticated;
GRANT ALL ON public.sijil TO service_role;

ALTER TABLE public.sijil ENABLE ROW LEVEL SECURITY;

-- Pelajar boleh lihat sijil sendiri
CREATE POLICY "Pelajar select own sijil" ON public.sijil
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Pelajar boleh insert sijil sendiri
CREATE POLICY "Pelajar insert own sijil" ON public.sijil
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ibu bapa boleh lihat sijil anak yang dipautkan
CREATE POLICY "Parent select anak sijil" ON public.sijil
  FOR SELECT TO authenticated
  USING (public.is_parent_of(user_id));
