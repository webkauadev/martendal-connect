-- Allowlist table (server-side source of truth)
CREATE TABLE IF NOT EXISTS public.panel_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No Data API access at all: only SECURITY DEFINER functions and service_role may touch it.
REVOKE ALL ON TABLE public.panel_admins FROM PUBLIC;
REVOKE ALL ON TABLE public.panel_admins FROM anon;
REVOKE ALL ON TABLE public.panel_admins FROM authenticated;
GRANT ALL ON TABLE public.panel_admins TO service_role;

ALTER TABLE public.panel_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages panel admins" ON public.panel_admins;
CREATE POLICY "service role manages panel admins"
ON public.panel_admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO public.panel_admins (email)
VALUES ('beludokuka321@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Hardened admin check: allowlist + verified email + Google identity
CREATE OR REPLACE FUNCTION public.is_panel_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.panel_admins pa
    WHERE pa.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  AND lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'email_verified', 'false')) IN ('true','t')
  AND (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'google'
    OR (auth.jwt() -> 'app_metadata' -> 'providers') ? 'google'
  )
$$;

REVOKE ALL ON FUNCTION public.is_panel_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_panel_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_panel_admin() TO authenticated;

-- Re-assert read policy on tracking data
DROP POLICY IF EXISTS "only panel admin can read tracking events" ON public.martendal_tracking_events;
CREATE POLICY "only panel admin can read tracking events"
ON public.martendal_tracking_events
FOR SELECT
TO authenticated
USING (public.is_panel_admin());

REVOKE SELECT ON public.martendal_tracking_events FROM anon;