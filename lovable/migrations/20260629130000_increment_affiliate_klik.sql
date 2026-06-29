-- Safe RPC to increment affiliate klik counter from anon/authenticated clients
CREATE OR REPLACE FUNCTION public.increment_affiliate_klik(affiliate_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.affiliates SET total_klik = total_klik + 1 WHERE id = affiliate_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_affiliate_klik(uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
