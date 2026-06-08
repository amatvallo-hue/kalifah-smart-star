-- Revert pieces from 20260608200000_admin_dashboard.sql that touched the
-- profiles/auth flow used by darjah_akses, while keeping the admin
-- dashboard's columns (role/email/username) and admin policies intact.
--
-- Scope of revert:
--   1) Restore the original handle_new_user() trigger so signup never
--      issues an ON CONFLICT DO UPDATE against public.profiles
--      (the new version updated `email`, which under some PostgREST
--      schema-cache states forced clients to write back the row with
--      a stale/empty darjah_akses).
--   2) Re-assert the self-access RLS policies on public.profiles so a
--      signed-in user can always SELECT/UPDATE/INSERT their own row,
--      regardless of any admin-policy ordering.
--   3) Leave the admin SELECT/UPDATE policies and the new columns in
--      place so the /admin dashboard keeps working.

-- 1) Restore the simple trigger (no email backfill, DO NOTHING on conflict)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, darjah_akses)
  VALUES (NEW.id, '{}'::int[])
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) Re-assert self-access policies (PERMISSIVE) for own row
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
