-- Final least-privilege pass after independent runtime migration.
-- Keeps the experience-type trigger callable only by PostgreSQL trigger execution
-- and gives the private rate-limit table an explicit service-role policy.

CREATE OR REPLACE FUNCTION public.martendal_set_experience_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
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

REVOKE EXECUTE ON FUNCTION public.martendal_set_experience_type() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.martendal_set_experience_type() TO service_role;

DROP POLICY IF EXISTS "service role manages panel login attempts" ON private.panel_login_attempts;
CREATE POLICY "service role manages panel login attempts"
  ON private.panel_login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
