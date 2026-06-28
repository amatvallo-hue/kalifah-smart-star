-- RPC: admin grants specific darjah_akses to a user (no pesanan needed).
CREATE OR REPLACE FUNCTION public.admin_grant_darjah_akses(
  p_user_id UUID,
  p_darjah  INTEGER[]
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing INTEGER[];
  v_clean    INTEGER[];
  v_merged   INTEGER[];
  v_profile  public.profiles;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Hanya admin boleh buat tindakan ini' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id diperlukan';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT d ORDER BY d), '{}'::int[])
    INTO v_clean
    FROM unnest(COALESCE(p_darjah, '{}'::int[])) AS d
    WHERE d BETWEEN 1 AND 6;

  IF array_length(v_clean, 1) IS NULL THEN
    RAISE EXCEPTION 'Sila pilih sekurang-kurangnya satu darjah (1-6)';
  END IF;

  SELECT COALESCE(darjah_akses, '{}'::int[]) INTO v_existing
    FROM public.profiles WHERE id = p_user_id;

  SELECT COALESCE(array_agg(DISTINCT d ORDER BY d), '{}'::int[])
    INTO v_merged
    FROM unnest(COALESCE(v_existing, '{}'::int[]) || v_clean) AS d;

  INSERT INTO public.profiles (id, darjah_akses)
    VALUES (p_user_id, v_merged)
  ON CONFLICT (id) DO UPDATE
    SET darjah_akses = EXCLUDED.darjah_akses
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_darjah_akses(UUID, INTEGER[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_darjah_akses(UUID, INTEGER[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
