-- ============================================================
-- Export: public.martendal_tracking_events
-- Origem: projeto Supabase atual (estado real em 2026-09-07)
-- Aplicar ANTES de importar tracking-events.json
-- Nao contem chaves, secrets ou credenciais.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.martendal_tracking_events (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  session_id      text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  campaign_id     text,
  adset_id        text,
  ad_id           text,
  traffic_source  text,
  referrer        text,
  landing_path    text,
  device_type     text,
  lot_number      text,
  horse_name      text,
  video_url       text,
  catalog_name    text,
  experience_type text,
  CONSTRAINT martendal_tracking_events_pkey PRIMARY KEY (id),
  CONSTRAINT martendal_tracking_events_event_type_check CHECK (
    event_type = ANY (ARRAY[
      'page_view',
      'whatsapp_click',
      'catalog_view',
      'lot_view',
      'lot_whatsapp_click',
      'catalog_whatsapp_click',
      'catalog_video_click',
      'pdf_download'
    ])
  )
);

-- ---------- Indices ----------
CREATE INDEX IF NOT EXISTS martendal_tracking_events_created_at_idx
  ON public.martendal_tracking_events USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_session_idx
  ON public.martendal_tracking_events USING btree (session_id);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_lot_idx
  ON public.martendal_tracking_events USING btree (lot_number);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_landing_idx
  ON public.martendal_tracking_events USING btree (landing_path);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_event_type_idx
  ON public.martendal_tracking_events USING btree (event_type);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_experience_idx
  ON public.martendal_tracking_events USING btree (experience_type, created_at DESC);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_campaign_idx
  ON public.martendal_tracking_events USING btree (utm_campaign);
CREATE INDEX IF NOT EXISTS martendal_tracking_events_source_idx
  ON public.martendal_tracking_events USING btree (traffic_source);

-- ---------- Trigger: derivar experience_type ----------
CREATE OR REPLACE FUNCTION public.martendal_set_experience_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
$function$;

DROP TRIGGER IF EXISTS martendal_set_experience_type_trg ON public.martendal_tracking_events;
CREATE TRIGGER martendal_set_experience_type_trg
  BEFORE INSERT ON public.martendal_tracking_events
  FOR EACH ROW EXECUTE FUNCTION public.martendal_set_experience_type();

-- ---------- Grants (estado atual) ----------
-- anon: apenas escrita (nao pode ler eventos)
GRANT INSERT, UPDATE, DELETE ON public.martendal_tracking_events TO anon;
REVOKE SELECT ON public.martendal_tracking_events FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.martendal_tracking_events TO authenticated;
GRANT ALL ON public.martendal_tracking_events TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.martendal_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can insert tracking events" ON public.martendal_tracking_events;
CREATE POLICY "anon can insert tracking events"
  ON public.martendal_tracking_events
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated can insert tracking events" ON public.martendal_tracking_events;
CREATE POLICY "authenticated can insert tracking events"
  ON public.martendal_tracking_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Depende de private.is_panel_admin(): aplique private-schema.sql ANTES desta policy.
DROP POLICY IF EXISTS "only panel admin can read tracking events" ON public.martendal_tracking_events;
CREATE POLICY "only panel admin can read tracking events"
  ON public.martendal_tracking_events
  FOR SELECT TO authenticated
  USING (private.is_panel_admin());
