-- RPC to lookup affiliate by ref/custom_ref_code and increment klik in one
-- SECURITY DEFINER call so anon visitors can be tracked despite RLS.
CREATE OR REPLACE FUNCTION public.increment_affiliate_klik_by_ref(p_ref text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.affiliates
     SET total_klik = total_klik + 1
   WHERE ref_code ILIKE p_ref
      OR custom_ref_code ILIKE p_ref;
$$;

GRANT EXECUTE ON FUNCTION public.increment_affiliate_klik_by_ref(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
