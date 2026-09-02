CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER TABLE public.panel_admins SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.is_panel_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.panel_admins pa
    WHERE pa.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  AND lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'email_verified', 'false')) IN ('true','t')
  AND (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'google'
    OR (auth.jwt() -> 'app_metadata' -> 'providers') ? 'google'
  )
$$;

REVOKE ALL ON FUNCTION private.is_panel_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_panel_admin() TO authenticated;

DROP POLICY IF EXISTS "only panel admin can read tracking events" ON public.martendal_tracking_events;
CREATE POLICY "only panel admin can read tracking events"
ON public.martendal_tracking_events
FOR SELECT
TO authenticated
USING (private.is_panel_admin());

DROP FUNCTION IF EXISTS public.is_panel_admin();