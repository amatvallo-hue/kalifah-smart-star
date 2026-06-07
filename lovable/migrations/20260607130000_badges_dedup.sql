-- Lencana (badges), dedup progress terbaik & UPDATE policy

-- 1) Padam duplikasi sedia ada — simpan baris peratus tertinggi sahaja
DELETE FROM public.user_progress a
USING public.user_progress b
WHERE a.user_id = b.user_id
  AND a.darjah = b.darjah
  AND a.subjek = b.subjek
  AND a.aktiviti = b.aktiviti
  AND (
    a.peratus < b.peratus
    OR (a.peratus = b.peratus AND a.created_at < b.created_at)
  );

-- 2) Kunci unik supaya hanya satu rekod terbaik per (user, darjah, subjek, aktiviti)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_progress_user_aktiviti_unik'
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_user_aktiviti_unik
      UNIQUE (user_id, darjah, subjek, aktiviti);
  END IF;
END $$;

-- 3) Benarkan UPDATE supaya boleh simpan markah yang lebih baik
DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;
CREATE POLICY "Users update own progress"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT UPDATE ON public.user_progress TO authenticated;


-- 4) Jadual lencana
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kod text NOT NULL,
  nama text NOT NULL,
  ikon text NOT NULL DEFAULT '🏅',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kod)
);

GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_badges_user_idx
  ON public.user_badges (user_id, created_at DESC);
