CREATE TABLE IF NOT EXISTS public.challenge_bulanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL,
  target_jualan INTEGER NOT NULL DEFAULT 10,
  bonus_rm NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (bulan, tahun)
);

GRANT SELECT ON public.challenge_bulanan TO anon, authenticated;
GRANT ALL ON public.challenge_bulanan TO service_role;

ALTER TABLE public.challenge_bulanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active challenge" ON public.challenge_bulanan;
CREATE POLICY "Public read active challenge" ON public.challenge_bulanan
  FOR SELECT USING (aktif = true);

DROP POLICY IF EXISTS "Admin read all challenge" ON public.challenge_bulanan;
CREATE POLICY "Admin read all challenge" ON public.challenge_bulanan
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin write challenge" ON public.challenge_bulanan;
CREATE POLICY "Admin write challenge" ON public.challenge_bulanan
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.challenge_bulanan (bulan, tahun, target_jualan, bonus_rm, aktif)
VALUES (6, 2026, 10, 50.00, true)
ON CONFLICT (bulan, tahun) DO NOTHING;

NOTIFY pgrst, 'reload schema';
