-- Backfill darjah_akses untuk akaun anak sedia ada.
-- Setiap rekod child_profiles ada `darjah` (cth "1"). Akaun anak (auth user
-- yang dirujuk oleh child_user_id) sepatutnya ada akses kepada darjah itu
-- dalam profiles.darjah_akses sendiri (BUKAN diwarisi dari ibu bapa).

UPDATE public.profiles p
SET darjah_akses = ARRAY[ (cp.darjah)::int ]
FROM public.child_profiles cp
WHERE cp.child_user_id = p.id
  AND cp.darjah ~ '^[0-9]+$'
  AND (p.darjah_akses IS NULL OR array_length(p.darjah_akses, 1) IS NULL
       OR NOT ((cp.darjah)::int = ANY(p.darjah_akses)));

NOTIFY pgrst, 'reload schema';
