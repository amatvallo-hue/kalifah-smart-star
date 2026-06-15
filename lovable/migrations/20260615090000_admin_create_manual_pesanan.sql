-- RPC: admin_create_manual_pesanan
-- Allows admins to create a manual pesanan row, bypassing RLS via SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.admin_create_manual_pesanan(
  p_user_id UUID,
  p_pakej TEXT,
  p_darjah_dipilih INTEGER[],
  p_amount_sen INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS public.pesanan
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.pesanan;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Hanya admin boleh buat tindakan ini'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id diperlukan';
  END IF;
  IF p_pakej IS NULL OR length(p_pakej) = 0 THEN
    RAISE EXCEPTION 'pakej diperlukan';
  END IF;
  IF p_amount_sen IS NULL OR p_amount_sen <= 0 THEN
    RAISE EXCEPTION 'amount_sen mesti lebih daripada 0';
  END IF;

  INSERT INTO public.pesanan (
    user_id, pakej, darjah_dipilih, amount_sen, status, payment_method
  ) VALUES (
    p_user_id,
    p_pakej,
    COALESCE(p_darjah_dipilih, '{}'::int[]),
    p_amount_sen,
    'pending',
    'manual'
  )
  RETURNING * INTO v_row;

  -- p_note is currently informational only (no nota column on pesanan).
  PERFORM p_note;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_manual_pesanan(UUID, TEXT, INTEGER[], INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_manual_pesanan(UUID, TEXT, INTEGER[], INTEGER, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
