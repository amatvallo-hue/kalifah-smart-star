-- Jadual pesanan untuk integrasi ToyyibPay
CREATE TABLE IF NOT EXISTS public.pesanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pakej TEXT NOT NULL,            -- 'satu' | 'perDarjah' | 'bundle'
  darjah_dipilih INTEGER[] NOT NULL DEFAULT '{}'::int[],
  amount_sen INTEGER NOT NULL,    -- dalam sen
  billcode TEXT,                  -- dari ToyyibPay
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed
  toyyib_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pesanan_user ON public.pesanan(user_id);
CREATE INDEX IF NOT EXISTS idx_pesanan_billcode ON public.pesanan(billcode);

GRANT SELECT, INSERT ON public.pesanan TO authenticated;
GRANT ALL ON public.pesanan TO service_role;

ALTER TABLE public.pesanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own pesanan" ON public.pesanan;
CREATE POLICY "Users view own pesanan" ON public.pesanan
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own pesanan" ON public.pesanan;
CREATE POLICY "Users insert own pesanan" ON public.pesanan
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
