CREATE TABLE public.martendal_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','whatsapp_click')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  traffic_source TEXT,
  referrer TEXT,
  landing_path TEXT,
  device_type TEXT
);

CREATE INDEX martendal_tracking_events_created_at_idx ON public.martendal_tracking_events (created_at DESC);
CREATE INDEX martendal_tracking_events_session_idx ON public.martendal_tracking_events (session_id);

GRANT INSERT ON public.martendal_tracking_events TO anon;
GRANT INSERT, SELECT ON public.martendal_tracking_events TO authenticated;
GRANT ALL ON public.martendal_tracking_events TO service_role;

ALTER TABLE public.martendal_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_panel_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email'), '')) = 'beludokuka321@gmail.com'
$$;

CREATE POLICY "anon can insert tracking events"
ON public.martendal_tracking_events
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated can insert tracking events"
ON public.martendal_tracking_events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "only panel admin can read tracking events"
ON public.martendal_tracking_events
FOR SELECT
TO authenticated
USING (public.is_panel_admin());