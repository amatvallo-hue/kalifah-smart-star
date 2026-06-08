-- Allow user to update own pesanan (for storing billcode after ToyyibPay createBill)
DROP POLICY IF EXISTS "Users update own pesanan" ON public.pesanan;
CREATE POLICY "Users update own pesanan" ON public.pesanan
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT UPDATE ON public.pesanan TO authenticated;
