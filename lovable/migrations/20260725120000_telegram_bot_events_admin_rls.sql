-- Telegram bot events: admin-only read access.
-- Table already exists with RLS enabled and no SELECT policy (private by design).

ALTER TABLE public.telegram_bot_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.telegram_bot_events TO authenticated;
GRANT ALL ON public.telegram_bot_events TO service_role;

DROP POLICY IF EXISTS "Admin baca telegram_bot_events" ON public.telegram_bot_events;
CREATE POLICY "Admin baca telegram_bot_events"
  ON public.telegram_bot_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
