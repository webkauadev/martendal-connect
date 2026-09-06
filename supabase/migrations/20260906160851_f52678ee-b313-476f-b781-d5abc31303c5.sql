ALTER TABLE public.martendal_tracking_events
  ADD COLUMN IF NOT EXISTS lot_number text,
  ADD COLUMN IF NOT EXISTS horse_name text,
  ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.martendal_tracking_events
  DROP CONSTRAINT IF EXISTS martendal_tracking_events_event_type_check;

ALTER TABLE public.martendal_tracking_events
  ADD CONSTRAINT martendal_tracking_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'page_view','whatsapp_click',
    'catalog_view','lot_view','lot_whatsapp_click',
    'catalog_whatsapp_click','catalog_video_click','pdf_download'
  ]));

CREATE INDEX IF NOT EXISTS martendal_tracking_events_lot_idx
  ON public.martendal_tracking_events (lot_number);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_landing_idx
  ON public.martendal_tracking_events (landing_path);