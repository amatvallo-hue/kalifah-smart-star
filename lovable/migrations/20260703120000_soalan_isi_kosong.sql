-- Isi Tempat Kosong: fill-in-the-blank questions with auto-grading (no AI)
CREATE TABLE IF NOT EXISTS public.soalan_isi_kosong (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  darjah int NOT NULL,
  subjek text NOT NULL,
  topik_kod text NOT NULL,
  topik_nama text NOT NULL,
  modul text NOT NULL DEFAULT 'Latih Tubi Isi Kosong',
  versi text NOT NULL,
  no_soalan int NOT NULL,
  soalan text NOT NULL,
  jawapan_utama text NOT NULL,
  jawapan_alternatif text NOT NULL,
  keyword_haram text,
  feedback_betul text NOT NULL,
  feedback_salah text NOT NULL,
  petunjuk text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soalan_isi_kosong_topik
  ON public.soalan_isi_kosong (darjah, subjek, topik_kod);

GRANT SELECT ON public.soalan_isi_kosong TO anon, authenticated;
GRANT ALL ON public.soalan_isi_kosong TO service_role;

ALTER TABLE public.soalan_isi_kosong ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Soalan isi kosong boleh dibaca semua"
  ON public.soalan_isi_kosong
  FOR SELECT
  TO anon, authenticated
  USING (true);
