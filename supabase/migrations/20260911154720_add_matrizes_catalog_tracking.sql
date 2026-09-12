-- Extend only the INSERT contract. No historical DML, index, grant or RLS changes.
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.martendal_tracking_events
  DROP CONSTRAINT martendal_tracking_catalog_key_check,
  ADD CONSTRAINT martendal_tracking_catalog_key_check
    CHECK (catalog_key IS NULL OR catalog_key IN ('machos', 'femeas', 'matrizes'));

CREATE OR REPLACE FUNCTION public.martendal_set_experience_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  CASE NEW.landing_path
    WHEN '/leilao-martendal-weekend-2026' THEN
      NEW.experience_type := 'squeeze';
      NEW.catalog_name := NULL;
      NEW.catalog_key := NULL;
    WHEN '/catalago/leilao-martendal-weekend-2026' THEN
      -- INSERT-only trigger: legacy rows are never reclassified. New root events
      -- must be selector events, even if a caller supplies historical metadata.
      IF NEW.event_type NOT IN ('catalog_selector_view', 'catalog_selected') THEN
        RAISE EXCEPTION 'Only selector events are accepted at the catalog root'
          USING ERRCODE = '23514';
      END IF;
      NEW.experience_type := 'catalog';
      NEW.catalog_name := NULL;
    WHEN '/catalago/leilao-martendal-weekend-2026/machos' THEN
      NEW.experience_type := 'catalog';
      NEW.catalog_name := 'Quarto de Milha - Martendal Weekend 2026';
      NEW.catalog_key := 'machos';
    WHEN '/catalago/leilao-martendal-weekend-2026/femeas' THEN
      NEW.experience_type := 'catalog';
      NEW.catalog_name := 'Fêmeas Elite - Martendal Weekend 2026';
      NEW.catalog_key := 'femeas';
    WHEN '/catalago/leilao-martendal-weekend-2026/matrizes' THEN
      NEW.experience_type := 'catalog';
      NEW.catalog_name := 'Matrizes - Martendal Weekend 2026';
      NEW.catalog_key := 'matrizes';
    ELSE
      RAISE EXCEPTION 'Unsupported tracking path' USING ERRCODE = '23514';
  END CASE;
  RETURN NEW;
END;
$$;

ALTER TABLE public.martendal_tracking_events
  DROP CONSTRAINT IF EXISTS martendal_tracking_event_contract,
  ADD CONSTRAINT martendal_tracking_event_contract CHECK ((
    device_type IN ('Mobile', 'Tablet', 'Desktop', 'Unknown')
    AND (
      (landing_path = '/leilao-martendal-weekend-2026'
        AND experience_type = 'squeeze' AND catalog_name IS NULL AND catalog_key IS NULL
        AND event_type IN ('page_view', 'whatsapp_click'))
      OR
      (landing_path = '/catalago/leilao-martendal-weekend-2026'
        AND experience_type = 'catalog' AND catalog_name IS NULL
        AND ((event_type = 'catalog_selector_view' AND catalog_key IS NULL)
          OR (event_type = 'catalog_selected' AND catalog_key IS NOT NULL
            AND catalog_key IN ('machos', 'femeas', 'matrizes'))))
      OR
      (experience_type = 'catalog'
        AND event_type IN ('catalog_view', 'lot_view', 'lot_whatsapp_click',
          'catalog_whatsapp_click', 'catalog_video_click', 'pdf_download')
        AND (
          (landing_path = '/catalago/leilao-martendal-weekend-2026/machos'
            AND catalog_name = 'Quarto de Milha - Martendal Weekend 2026' AND catalog_key = 'machos')
          OR (landing_path = '/catalago/leilao-martendal-weekend-2026/femeas'
            AND catalog_name = 'Fêmeas Elite - Martendal Weekend 2026' AND catalog_key = 'femeas')
          OR (landing_path = '/catalago/leilao-martendal-weekend-2026/matrizes'
            AND catalog_name = 'Matrizes - Martendal Weekend 2026' AND catalog_key = 'matrizes')
          -- Storage compatibility only: the INSERT trigger rejects new legacy events.
          OR (landing_path = '/catalago/leilao-martendal-weekend-2026'
            AND catalog_name = 'Quarto de Milha - Martendal Weekend 2026' AND catalog_key IS NULL)
        ))
    )
    AND (event_type NOT IN ('lot_view', 'lot_whatsapp_click', 'catalog_video_click')
      OR (lot_number IS NOT NULL AND horse_name IS NOT NULL))
    AND (event_type <> 'catalog_video_click' OR video_url IS NOT NULL)
  ) IS TRUE);

