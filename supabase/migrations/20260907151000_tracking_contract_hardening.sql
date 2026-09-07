-- Enforce the analytics contract at the database boundary.
-- Existing production rows were audited before this migration.

-- Backfill catalog metadata created before catalog_name became part of the payload.
UPDATE public.martendal_tracking_events
SET catalog_name = 'Quarto de Milha - Martendal Weekend 2026'
WHERE landing_path = '/catalago/leilao-martendal-weekend-2026'
  AND catalog_name IS NULL;

-- The database owns derived experience/catalog metadata. Client-supplied values
-- are overwritten so direct Data API callers cannot misclassify events.
CREATE OR REPLACE FUNCTION public.martendal_set_experience_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.landing_path = '/catalago/leilao-martendal-weekend-2026' THEN
    NEW.experience_type := 'catalog';
    NEW.catalog_name := 'Quarto de Milha - Martendal Weekend 2026';
  ELSIF NEW.landing_path = '/leilao-martendal-weekend-2026' THEN
    NEW.experience_type := 'squeeze';
    NEW.catalog_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.martendal_set_experience_type() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.martendal_set_experience_type() TO service_role;

ALTER TABLE public.martendal_tracking_events
  ALTER COLUMN session_id SET NOT NULL,
  ALTER COLUMN traffic_source SET NOT NULL,
  ALTER COLUMN landing_path SET NOT NULL,
  ALTER COLUMN device_type SET NOT NULL,
  ALTER COLUMN experience_type SET NOT NULL;

ALTER TABLE public.martendal_tracking_events
  DROP CONSTRAINT IF EXISTS martendal_tracking_event_contract,
  ADD CONSTRAINT martendal_tracking_event_contract CHECK (
    event_type IN (
      'page_view',
      'whatsapp_click',
      'catalog_view',
      'lot_view',
      'lot_whatsapp_click',
      'catalog_whatsapp_click',
      'catalog_video_click',
      'pdf_download'
    )
    AND device_type IN ('Mobile', 'Tablet', 'Desktop', 'Unknown')
    AND (
      (
        landing_path = '/leilao-martendal-weekend-2026'
        AND experience_type = 'squeeze'
        AND catalog_name IS NULL
        AND event_type IN ('page_view', 'whatsapp_click')
      )
      OR
      (
        landing_path = '/catalago/leilao-martendal-weekend-2026'
        AND experience_type = 'catalog'
        AND catalog_name = 'Quarto de Milha - Martendal Weekend 2026'
        AND event_type IN (
          'catalog_view',
          'lot_view',
          'lot_whatsapp_click',
          'catalog_whatsapp_click',
          'catalog_video_click',
          'pdf_download'
        )
      )
    )
    AND (
      event_type NOT IN ('lot_view', 'lot_whatsapp_click', 'catalog_video_click')
      OR (lot_number IS NOT NULL AND horse_name IS NOT NULL)
    )
    AND (event_type <> 'catalog_video_click' OR video_url IS NOT NULL)
  );

-- lot_view is a session-level metric. A page reload in the same browser session
-- must not inflate the lot ranking.
CREATE UNIQUE INDEX IF NOT EXISTS martendal_tracking_events_unique_lot_view_session_idx
  ON public.martendal_tracking_events (session_id, lot_number)
  WHERE event_type = 'lot_view';
