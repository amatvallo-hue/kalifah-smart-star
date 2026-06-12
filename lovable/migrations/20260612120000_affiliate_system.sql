-- Sistem Affiliate Kalifah.my

-- 1. Jadual affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  no_telefon TEXT NOT NULL,
  no_akaun_bank TEXT NOT NULL,
  nama_bank TEXT NOT NULL,
  ref_code TEXT NOT NULL UNIQUE,
  total_klik INTEGER NOT NULL DEFAULT 0,
  total_jualan INTEGER NOT NULL DEFAULT 0,
  total_komisyen_sen BIGINT NOT NULL DEFAULT 0,
  total_dibayar_sen BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_ref ON public.affiliates(ref_code);

GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT SELECT ON public.affiliates TO anon;
GRANT ALL ON public.affiliates TO service_role;

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone register affiliate" ON public.affiliates;
CREATE POLICY "Anyone register affiliate" ON public.affiliates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owner view own affiliate" ON public.affiliates;
CREATE POLICY "Owner view own affiliate" ON public.affiliates
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Anon may lookup ref" ON public.affiliates;
CREATE POLICY "Anon may lookup ref" ON public.affiliates
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Owner update own affiliate" ON public.affiliates;
CREATE POLICY "Owner update own affiliate" ON public.affiliates
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 2. Jadual affiliate_jualan
CREATE TABLE IF NOT EXISTS public.affiliate_jualan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  pesanan_id UUID REFERENCES public.pesanan(id) ON DELETE SET NULL,
  jumlah_bayar_sen INTEGER NOT NULL,
  komisyen_sen INTEGER NOT NULL,
  status_bayar TEXT NOT NULL DEFAULT 'belum', -- 'belum' | 'dibayar'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affjualan_aff ON public.affiliate_jualan(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affjualan_pesanan ON public.affiliate_jualan(pesanan_id);

GRANT SELECT ON public.affiliate_jualan TO authenticated;
GRANT ALL ON public.affiliate_jualan TO service_role;

ALTER TABLE public.affiliate_jualan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliate view own jualan" ON public.affiliate_jualan;
CREATE POLICY "Affiliate view own jualan" ON public.affiliate_jualan
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_jualan.affiliate_id
        AND (a.user_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

-- 3. Tambah ref_code pada pesanan
ALTER TABLE public.pesanan ADD COLUMN IF NOT EXISTS ref_code TEXT;
CREATE INDEX IF NOT EXISTS idx_pesanan_refcode ON public.pesanan(ref_code);

-- 4. Update trigger apply_payment_unlock — hook affiliate
CREATE OR REPLACE FUNCTION public.apply_payment_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pesanan public.pesanan%ROWTYPE;
  v_to_add  INTEGER[];
  v_final   INTEGER[];
  v_aff     public.affiliates%ROWTYPE;
  v_komisyen INTEGER;
BEGIN
  IF NEW.status IS NULL OR NEW.status NOT IN ('1', 'paid', 'success') THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS NOT NULL THEN
    SELECT * INTO v_pesanan FROM public.pesanan WHERE id = NEW.order_id LIMIT 1;
  END IF;

  IF NOT FOUND AND NEW.billcode IS NOT NULL AND length(NEW.billcode) > 0 THEN
    SELECT * INTO v_pesanan FROM public.pesanan
     WHERE billcode = NEW.billcode ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_pesanan.pakej = 'bundle' THEN
    v_to_add := ARRAY[1,2,3,4,5,6];
  ELSIF v_pesanan.pakej IN ('satu', 'perDarjah') THEN
    SELECT COALESCE(
      ARRAY(
        SELECT DISTINCT d FROM unnest(COALESCE(v_pesanan.darjah_dipilih, '{}'::int[])) AS d
         WHERE d BETWEEN 1 AND 6 ORDER BY d
      ), '{}'::int[]
    ) INTO v_to_add;
  ELSE
    v_to_add := '{}'::int[];
  END IF;

  IF v_pesanan.pakej <> 'bundle' AND array_length(v_to_add, 1) IS NULL THEN
    UPDATE public.payments SET processed = true WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  UPDATE public.pesanan
     SET status = 'paid',
         paid_at = COALESCE(paid_at, now()),
         toyyib_transaction_id = COALESCE(toyyib_transaction_id, NEW.toyyib_transaction_id),
         billcode = COALESCE(billcode, NEW.billcode)
   WHERE id = v_pesanan.id;

  WITH paid_orders AS (
    SELECT pakej, COALESCE(darjah_dipilih, '{}'::int[]) AS darjah_dipilih
      FROM public.pesanan
     WHERE user_id = v_pesanan.user_id AND status = 'paid'
  ),
  expanded AS (
    SELECT CASE
             WHEN pakej = 'bundle' THEN ARRAY[1,2,3,4,5,6]
             WHEN pakej IN ('satu','perDarjah') THEN darjah_dipilih
             ELSE '{}'::int[]
           END AS darjah
      FROM paid_orders
  ),
  flat AS (
    SELECT DISTINCT d FROM expanded, unnest(darjah) AS d WHERE d BETWEEN 1 AND 6
  )
  SELECT COALESCE(ARRAY(SELECT d FROM flat ORDER BY d), '{}'::int[]) INTO v_final;

  INSERT INTO public.profiles (id, darjah_akses)
    VALUES (v_pesanan.user_id, v_final)
  ON CONFLICT (id) DO UPDATE SET darjah_akses = EXCLUDED.darjah_akses;

  -- AFFILIATE: kalau pesanan ada ref_code, rekod komisyen 10%
  IF v_pesanan.ref_code IS NOT NULL AND length(v_pesanan.ref_code) > 0 THEN
    SELECT * INTO v_aff FROM public.affiliates
     WHERE ref_code = v_pesanan.ref_code LIMIT 1;

    IF FOUND THEN
      -- Elak double-credit: hanya kalau belum ada rekod untuk pesanan ini
      IF NOT EXISTS (
        SELECT 1 FROM public.affiliate_jualan
         WHERE pesanan_id = v_pesanan.id AND affiliate_id = v_aff.id
      ) THEN
        v_komisyen := (v_pesanan.amount_sen * 10) / 100;
        INSERT INTO public.affiliate_jualan (
          affiliate_id, pesanan_id, jumlah_bayar_sen, komisyen_sen, status_bayar
        ) VALUES (
          v_aff.id, v_pesanan.id, v_pesanan.amount_sen, v_komisyen, 'belum'
        );
        UPDATE public.affiliates
           SET total_jualan = total_jualan + 1,
               total_komisyen_sen = total_komisyen_sen + v_komisyen
         WHERE id = v_aff.id;
      END IF;
    END IF;
  END IF;

  UPDATE public.payments SET processed = true WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 5. RPC untuk increment klik (anon boleh panggil)
CREATE OR REPLACE FUNCTION public.affiliate_increment_klik(_ref TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.affiliates SET total_klik = total_klik + 1 WHERE ref_code = _ref;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_increment_klik(TEXT) TO anon, authenticated;

-- 6. RPC admin: tandakan komisyen dibayar
CREATE OR REPLACE FUNCTION public.affiliate_tanda_dibayar(_affiliate_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Bukan admin';
  END IF;

  SELECT COALESCE(SUM(komisyen_sen), 0) INTO v_amount
    FROM public.affiliate_jualan
   WHERE affiliate_id = _affiliate_id AND status_bayar = 'belum';

  UPDATE public.affiliate_jualan
     SET status_bayar = 'dibayar', paid_at = now()
   WHERE affiliate_id = _affiliate_id AND status_bayar = 'belum';

  UPDATE public.affiliates
     SET total_dibayar_sen = total_dibayar_sen + v_amount
   WHERE id = _affiliate_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_tanda_dibayar(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
