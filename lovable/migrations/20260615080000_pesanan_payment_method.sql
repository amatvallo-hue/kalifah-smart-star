-- Add payment_method column to pesanan to support manual order entry
ALTER TABLE public.pesanan
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'toyyibpay';

NOTIFY pgrst, 'reload schema';
