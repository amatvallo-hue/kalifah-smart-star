-- Selepas pembayaran berjaya, buka SEMUA darjah (1..6) untuk pengguna,
-- tidak kira pakej atau darjah_dipilih.

CREATE OR REPLACE FUNCTION public.apply_payment_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pesanan public.pesanan%ROWTYPE;
  v_final   INTEGER[] := ARRAY[1,2,3,4,5,6];
BEGIN
  IF NEW.status IS NULL OR NEW.status NOT IN ('1', 'paid', 'success') THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS NOT NULL THEN
    SELECT * INTO v_pesanan FROM public.pesanan WHERE id = NEW.order_id LIMIT 1;
  END IF;

  IF NOT FOUND AND NEW.billcode IS NOT NULL AND length(NEW.billcode) > 0 THEN
    SELECT * INTO v_pesanan
      FROM public.pesanan
     WHERE billcode = NEW.billcode
     ORDER BY created_at DESC
     LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE NOTICE 'apply_payment_unlock: pesanan tidak dijumpai (billcode=%, order_id=%)',
      NEW.billcode, NEW.order_id;
    RETURN NEW;
  END IF;

  UPDATE public.pesanan
     SET status = 'paid',
         paid_at = COALESCE(paid_at, now()),
         toyyib_transaction_id = COALESCE(toyyib_transaction_id, NEW.toyyib_transaction_id),
         billcode = COALESCE(billcode, NEW.billcode)
   WHERE id = v_pesanan.id;

  -- Buka SEMUA darjah secara automatik
  INSERT INTO public.profiles (id, darjah_akses)
    VALUES (v_pesanan.user_id, v_final)
  ON CONFLICT (id) DO UPDATE
    SET darjah_akses = EXCLUDED.darjah_akses;

  UPDATE public.payments SET processed = true WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- RPC admin: lulus pesanan dan buka semua darjah
CREATE OR REPLACE FUNCTION public.admin_approve_pesanan(
  p_pesanan_id UUID
)
RETURNS public.pesanan
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email TEXT;
  v_pesanan public.pesanan;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Hanya admin boleh buat tindakan ini' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  SELECT * INTO v_pesanan FROM public.pesanan WHERE id = p_pesanan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak dijumpai';
  END IF;

  IF v_pesanan.status IN ('approved', 'paid') THEN
    RAISE EXCEPTION 'Pesanan ini sudah diluluskan';
  END IF;

  UPDATE public.profiles
     SET darjah_akses = ARRAY[1,2,3,4,5,6]
   WHERE id = v_pesanan.user_id;

  UPDATE public.pesanan
     SET status = 'approved',
         approved_by = v_admin_email,
         approved_at = now(),
         paid_at = now()
   WHERE id = p_pesanan_id
   RETURNING * INTO v_pesanan;

  RETURN v_pesanan;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_pesanan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_pesanan(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
