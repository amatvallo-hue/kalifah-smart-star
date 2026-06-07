-- Dashboard Ibu Bapa: profil anak + akses RLS ke data anak via security definer

CREATE TABLE IF NOT EXISTS public.child_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nama text NOT NULL,
  darjah text NOT NULL,
  kod_jemputan text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_profiles TO authenticated;
GRANT ALL ON public.child_profiles TO service_role;

ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

-- Ibu bapa boleh urus rekod sendiri sahaja
CREATE POLICY "Parent select own children" ON public.child_profiles
  FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "Parent insert own children" ON public.child_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parent update own children" ON public.child_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parent delete own children" ON public.child_profiles
  FOR DELETE TO authenticated USING (auth.uid() = parent_id);

-- Anak boleh lihat rekod sendiri sahaja (selepas dipautkan)
CREATE POLICY "Child select own link" ON public.child_profiles
  FOR SELECT TO authenticated USING (auth.uid() = child_user_id);

CREATE INDEX IF NOT EXISTS child_profiles_parent_idx ON public.child_profiles (parent_id);
CREATE INDEX IF NOT EXISTS child_profiles_child_idx ON public.child_profiles (child_user_id);


-- RPC untuk anak mendaftar kod jemputan tanpa mendedahkan rekod lain
CREATE OR REPLACE FUNCTION public.sertai_dengan_kod(_kod text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Anda perlu log masuk';
  END IF;

  UPDATE public.child_profiles
     SET child_user_id = auth.uid()
   WHERE kod_jemputan = upper(_kod)
     AND child_user_id IS NULL
  RETURNING id INTO _id;

  IF _id IS NULL THEN
    RAISE EXCEPTION 'Kod tidak sah atau sudah digunakan';
  END IF;

  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sertai_dengan_kod(text) TO authenticated;


-- Security definer: semak sama ada user semasa adalah ibu bapa kepada _child
CREATE OR REPLACE FUNCTION public.is_parent_of(_child uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.child_profiles
    WHERE parent_id = auth.uid()
      AND child_user_id = _child
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid) TO authenticated;


-- Extend RLS: ibu bapa boleh SELECT data anak yang dipautkan
CREATE POLICY "Parent select child progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (public.is_parent_of(user_id));

CREATE POLICY "Parent select child stats"
  ON public.user_stats FOR SELECT
  TO authenticated
  USING (public.is_parent_of(user_id));

CREATE POLICY "Parent select child badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (public.is_parent_of(user_id));
