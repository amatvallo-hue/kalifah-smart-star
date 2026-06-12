-- Rename parameter to affiliate_uuid to match client call
DROP FUNCTION IF EXISTS public.affiliate_tanda_dibayar(UUID);

CREATE OR REPLACE FUNCTION public.affiliate_tanda_dibayar(affiliate_uuid UUID)
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
   WHERE affiliate_id = affiliate_uuid AND status_bayar = 'belum';

  UPDATE public.affiliate_jualan
     SET status_bayar = 'dibayar', paid_at = now()
   WHERE affiliate_id = affiliate_uuid AND status_bayar = 'belum';

  UPDATE public.affiliates
     SET total_dibayar_sen = total_dibayar_sen + v_amount
   WHERE id = affiliate_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_tanda_dibayar(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
