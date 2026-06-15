-- RPC: admin_approve_pesanan
-- Allows admins to approve a pending pesanan: marks the row as approved/paid
-- and merges the unlocked darjah tiers into the buyer's profiles.darjah_akses.
-- Uses SECURITY DEFINER to bypass RLS safely after an explicit admin check.
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
  v_to_add INTEGER[];
  v_existing INTEGER[];
  v_final INTEGER[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Hanya admin boleh buat tindakan ini'
      USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  SELECT * INTO v_pesanan FROM public.pesanan WHERE id = p_pesanan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak dijumpai';
  END IF;

  IF v_pesanan.status = 'approved' OR v_pesanan.status = 'paid' THEN
    RAISE EXCEPTION 'Pesanan ini sudah diluluskan';
  END IF;

  -- Compute tiers to unlock
  IF v_pesanan.pakej = 'bundle' THEN
    v_to_add := ARRAY[1,2,3,4,5,6];
  ELSIF v_pesanan.pakej IN ('satu', 'perDarjah') THEN
    SELECT COALESCE(array_agg(DISTINCT d ORDER BY d), '{}'::int[])
      INTO v_to_add
      FROM unnest(COALESCE(v_pesanan.darjah_dipilih, '{}'::int[])) AS d
      WHERE d BETWEEN 1 AND 6;
  ELSE
    v_to_add := '{}'::int[];
  END IF;

  -- Merge into existing profile access
  SELECT COALESCE(darjah_akses, '{}'::int[]) INTO v_existing
    FROM public.profiles WHERE id = v_pesanan.user_id;

  SELECT COALESCE(array_agg(DISTINCT d ORDER BY d), '{}'::int[])
    INTO v_final
    FROM unnest(COALESCE(v_existing, '{}'::int[]) || COALESCE(v_to_add, '{}'::int[])) AS d;

  UPDATE public.profiles
    SET darjah_akses = v_final
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
