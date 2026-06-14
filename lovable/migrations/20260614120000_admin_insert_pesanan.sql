-- Allow admins to insert pesanan for any user (manual order entry)
DROP POLICY IF EXISTS "Admins insert all pesanan" ON public.pesanan;
CREATE POLICY "Admins insert all pesanan" ON public.pesanan
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

NOTIFY pgrst, 'reload schema';
