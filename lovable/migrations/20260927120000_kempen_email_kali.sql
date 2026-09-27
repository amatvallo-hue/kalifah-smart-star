-- Kempen e-mel KALI (ibu bapa belum bayar): log idempotency + suppression.
-- Hanya service_role boleh akses; tiada akses anon/authenticated.

CREATE TABLE IF NOT EXISTS public.email_suppression (
  email TEXT PRIMARY KEY,               -- huruf kecil
  sebab TEXT NOT NULL DEFAULT 'unsubscribe', -- unsubscribe | bounce | complaint | manual
  sumber TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_suppression TO service_role;
ALTER TABLE public.email_suppression ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.email_kempen_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kempen TEXT NOT NULL,
  email TEXT NOT NULL,
  segmen TEXT NOT NULL,
  mode TEXT NOT NULL,                    -- test | production
  idempotency_key TEXT NOT NULL UNIQUE,  -- kempen:mode:email
  status TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed | skipped
  resend_id TEXT,
  ralat TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_kempen_log_kempen ON public.email_kempen_log(kempen, status);
GRANT ALL ON public.email_kempen_log TO service_role;
ALTER TABLE public.email_kempen_log ENABLE ROW LEVEL SECURITY;
-- Sengaja tiada polisi: hanya service_role (bypass RLS) boleh baca/tulis.
