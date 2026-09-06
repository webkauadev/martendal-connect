ALTER TABLE public.martendal_tracking_events
  ADD COLUMN IF NOT EXISTS catalog_name text,
  ADD COLUMN IF NOT EXISTS experience_type text;

CREATE OR REPLACE FUNCTION public.martendal_set_experience_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.experience_type IS NULL THEN
    IF NEW.landing_path LIKE '/catalago/%' THEN
      NEW.experience_type := 'catalog';
    ELSIF NEW.landing_path IS NOT NULL THEN
      NEW.experience_type := 'squeeze';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS martendal_set_experience_type_trg ON public.martendal_tracking_events;
CREATE TRIGGER martendal_set_experience_type_trg
  BEFORE INSERT ON public.martendal_tracking_events
  FOR EACH ROW EXECUTE FUNCTION public.martendal_set_experience_type();

UPDATE public.martendal_tracking_events
SET experience_type = CASE
  WHEN landing_path LIKE '/catalago/%' THEN 'catalog'
  ELSE 'squeeze'
END
WHERE experience_type IS NULL AND landing_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS martendal_tracking_events_event_type_idx
  ON public.martendal_tracking_events (event_type);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_experience_idx
  ON public.martendal_tracking_events (experience_type, created_at DESC);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_campaign_idx
  ON public.martendal_tracking_events (utm_campaign);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_source_idx
  ON public.martendal_tracking_events (traffic_source);