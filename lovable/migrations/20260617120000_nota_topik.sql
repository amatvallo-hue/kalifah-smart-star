-- Nota Ringkas: per-topik nota content fetched from DB
CREATE TABLE IF NOT EXISTS public.nota_topik (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  darjah int NOT NULL,
  subjek text NOT NULL,
  topik text NOT NULL,
  bahasa text NOT NULL DEFAULT 'BM',
  konsep jsonb NOT NULL DEFAULT '[]'::jsonb,
  istilah jsonb NOT NULL DEFAULT '[]'::jsonb,
  formula jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (darjah, subjek, topik, bahasa)
);

GRANT SELECT ON public.nota_topik TO anon, authenticated;
GRANT ALL ON public.nota_topik TO service_role;

ALTER TABLE public.nota_topik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nota boleh dibaca semua"
  ON public.nota_topik
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_nota_topik_lookup
  ON public.nota_topik (darjah, subjek, bahasa, topik);
