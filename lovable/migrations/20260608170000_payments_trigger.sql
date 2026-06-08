-- Payments inbox table + auto-unlock trigger.
-- Callback dari ToyyibPay akan INSERT row di sini guna anon key.
-- Trigger SECURITY DEFINER kemudian update pesanan + profiles.darjah_akses
-- tanpa perlukan service_role_key.

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billcode TEXT NOT NULL,
  order_id UUID,
  status TEXT NOT NULL,                 -- "1" = success ikut ToyyibPay
  toyyib_transaction_id TEXT,
  raw JSONB,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_billcode ON public.payments(billcode);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- Callback masuk tanpa user session => guna anon.
-- Tiada SELECT untuk anon — hanya INSERT.
GRANT INSERT ON public.payments TO anon;
GRANT INSERT, SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone may insert payment callback" ON public.payments;
CREATE POLICY "Anyone may insert payment callback" ON public.payments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.pesanan p
      WHERE (p.id = payments.order_id OR p.billcode = payments.billcode)
        AND p.user_id = auth.uid()
    )
  );

-- Trigger function: bila payment 'paid' (status = '1'),
-- buka darjah_akses pengguna berdasarkan pesanan.
CREATE OR REPLACE FUNCTION public.apply_payment_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pesanan public.pesanan%ROWTYPE;
  v_existing INTEGER[];
  v_to_add INTEGER[];
  v_merged INTEGER[];
BEGIN
  -- Hanya proses bila status success
  IF NEW.status IS NULL OR NEW.status NOT IN ('1', 'paid', 'success') THEN
    RETURN NEW;
  END IF;

  -- Cari pesanan ikut order_id atau billcode
  SELECT * INTO v_pesanan FROM public.pesanan
   WHERE (NEW.order_id IS NOT NULL AND id = NEW.order_id)
      OR (NEW.billcode IS NOT NULL AND billcode = NEW.billcode)
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE 'apply_payment_unlock: pesanan tidak dijumpai (billcode=%, order_id=%)',
      NEW.billcode, NEW.order_id;
    RETURN NEW;
  END IF;

  -- Tentukan darjah yang akan dibuka
  IF v_pesanan.pakej = 'bundle' THEN
    v_to_add := ARRAY[1,2,3,4,5,6];
  ELSE
    v_to_add := COALESCE(v_pesanan.darjah_dipilih, '{}'::int[]);
  END IF;

  -- Merge dengan darjah_akses sedia ada
  SELECT COALESCE(darjah_akses, '{}'::int[]) INTO v_existing
    FROM public.profiles WHERE id = v_pesanan.user_id;

  SELECT ARRAY(
    SELECT DISTINCT unnest(v_existing || v_to_add) ORDER BY 1
  ) INTO v_merged;

  -- Upsert profile
  INSERT INTO public.profiles (id, darjah_akses)
    VALUES (v_pesanan.user_id, v_merged)
  ON CONFLICT (id) DO UPDATE
    SET darjah_akses = EXCLUDED.darjah_akses;

  -- Tandakan pesanan paid
  UPDATE public.pesanan
     SET status = 'paid',
         paid_at = COALESCE(paid_at, now()),
         toyyib_transaction_id = COALESCE(toyyib_transaction_id, NEW.toyyib_transaction_id),
         billcode = COALESCE(billcode, NEW.billcode)
   WHERE id = v_pesanan.id;

  UPDATE public.payments SET processed = true WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_payment_unlock() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_apply_payment_unlock ON public.payments;
CREATE TRIGGER trg_apply_payment_unlock
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.apply_payment_unlock();

NOTIFY pgrst, 'reload schema';
