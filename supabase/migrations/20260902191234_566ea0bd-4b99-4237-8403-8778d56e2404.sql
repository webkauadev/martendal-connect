CREATE OR REPLACE FUNCTION public.is_panel_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email'), '')) = 'beludokuka321@gmail.com'
$$;

REVOKE ALL ON FUNCTION public.is_panel_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_panel_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_panel_admin() TO authenticated;