-- Fix: trigger apply_payment_unlock kadang-kadang buka semua 6 darjah
-- walaupun user hanya beli 1. Punca berkemungkinan:
--   1) Lookup pesanan ikut billcode tanpa ORDER BY boleh padan pesanan
--      'bundle' lama jika billcode pernah berulang / NULL.
--   2) darjah_akses sedia ada dalam profiles mungkin sudah tercemar
--      dengan {1..6} dari ujian sebelum ini, jadi UNION kekal 6.
--   3) Tiada sanity-check: kalau pakej bukan 'bundle' tapi darjah_dipilih
--      kosong, jangan buka apa-apa (bukan buka semua).
--
-- Pembetulan:
--   - Tighten lookup: utamakan order_id; kalau guna billcode, ambil
--     pesanan TERBARU sahaja (ORDER BY created_at DESC).
--   - Tolak NULL/empty billcode dalam padanan.
--   - Validate v_to_add: hanya nilai 1..6, dan kalau kosong untuk
--     pakej bukan 'bundle', JANGAN sentuh profiles langsung.
--   - Recompute darjah_akses penuh dari SEMUA pesanan paid milik user
--     (single source of truth) supaya data tercemar dari ujian lama
--     auto-baiki bila payment baru masuk.

CREATE OR REPLACE FUNCTION public.apply_payment_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pesanan public.pesanan%ROWTYPE;
  v_to_add  INTEGER[];
  v_final   INTEGER[];
BEGIN
  -- Hanya proses status success
  IF NEW.status IS NULL OR NEW.status NOT IN ('1', 'paid', 'success') THEN
    RETURN NEW;
  END IF;

  -- Cari pesanan: utamakan order_id (UUID, tidak boleh kolisi).
  IF NEW.order_id IS NOT NULL THEN
    SELECT * INTO v_pesanan
      FROM public.pesanan
     WHERE id = NEW.order_id
     LIMIT 1;
  END IF;

  -- Fallback: cari ikut billcode TERBARU (elak padan pesanan lama).
  IF NOT FOUND AND NEW.billcode IS NOT NULL AND length(NEW.billcode) > 0 THEN
    SELECT * INTO v_pesanan
      FROM public.pesanan
     WHERE billcode = NEW.billcode
     ORDER BY created_at DESC
     LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE NOTICE 'apply_payment_unlock: pesanan tidak dijumpai (billcode=%, order_id=%)',
      NEW.billcode, NEW.order_id;
    RETURN NEW;
  END IF;

  -- Tentukan darjah yang patut dibuka untuk pesanan INI sahaja.
  IF v_pesanan.pakej = 'bundle' THEN
    v_to_add := ARRAY[1,2,3,4,5,6];
  ELSIF v_pesanan.pakej IN ('satu', 'perDarjah') THEN
    -- Hanya nilai sah 1..6, dedup, sorted.
    SELECT COALESCE(
      ARRAY(
        SELECT DISTINCT d
          FROM unnest(COALESCE(v_pesanan.darjah_dipilih, '{}'::int[])) AS d
         WHERE d BETWEEN 1 AND 6
         ORDER BY d
      ),
      '{}'::int[]
    ) INTO v_to_add;
  ELSE
    -- Pakej tidak dikenali → JANGAN buka apa-apa.
    v_to_add := '{}'::int[];
  END IF;

  -- Safety: kalau bukan bundle dan tiada darjah dipilih → keluar.
  IF v_pesanan.pakej <> 'bundle' AND array_length(v_to_add, 1) IS NULL THEN
    RAISE NOTICE 'apply_payment_unlock: darjah_dipilih kosong utk pesanan %, skip',
      v_pesanan.id;
    UPDATE public.payments SET processed = true WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Tandakan pesanan paid DULU supaya recompute di bawah ambil kira pesanan ini.
  UPDATE public.pesanan
     SET status = 'paid',
         paid_at = COALESCE(paid_at, now()),
         toyyib_transaction_id = COALESCE(toyyib_transaction_id, NEW.toyyib_transaction_id),
         billcode = COALESCE(billcode, NEW.billcode)
   WHERE id = v_pesanan.id;

  -- Recompute darjah_akses penuh dari SEMUA pesanan paid milik user ini.
  -- Ini membaiki sebarang data lama yang tercemar (cth. {1..6} dari ujian).
  WITH paid_orders AS (
    SELECT pakej, COALESCE(darjah_dipilih, '{}'::int[]) AS darjah_dipilih
      FROM public.pesanan
     WHERE user_id = v_pesanan.user_id
       AND status = 'paid'
  ),
  expanded AS (
    SELECT CASE
             WHEN pakej = 'bundle' THEN ARRAY[1,2,3,4,5,6]
             WHEN pakej IN ('satu','perDarjah') THEN darjah_dipilih
             ELSE '{}'::int[]
           END AS darjah
      FROM paid_orders
  ),
  flat AS (
    SELECT DISTINCT d
      FROM expanded, unnest(darjah) AS d
     WHERE d BETWEEN 1 AND 6
  )
  SELECT COALESCE(ARRAY(SELECT d FROM flat ORDER BY d), '{}'::int[])
    INTO v_final;

  INSERT INTO public.profiles (id, darjah_akses)
    VALUES (v_pesanan.user_id, v_final)
  ON CONFLICT (id) DO UPDATE
    SET darjah_akses = EXCLUDED.darjah_akses;

  UPDATE public.payments SET processed = true WHERE id = NEW.id;

  RAISE NOTICE 'apply_payment_unlock: user=% pesanan=% pakej=% to_add=% final=%',
    v_pesanan.user_id, v_pesanan.id, v_pesanan.pakej, v_to_add, v_final;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
