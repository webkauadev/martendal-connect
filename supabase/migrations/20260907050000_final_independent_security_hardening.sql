-- Final security pass for the independent Vercel + Supabase runtime.
-- Removes OAuth-era objects, narrows Data API grants and hardens panel RPCs.

DROP FUNCTION IF EXISTS private.is_panel_admin();
DROP TABLE IF EXISTS private.panel_admins;
REVOKE USAGE ON SCHEMA private FROM anon, authenticated;

DROP POLICY IF EXISTS "authenticated can insert tracking events" ON public.martendal_tracking_events;
REVOKE ALL ON public.martendal_tracking_events FROM authenticated;

REVOKE ALL ON public.martendal_tracking_events FROM anon;
GRANT INSERT (
  event_type, session_id, utm_source, utm_medium, utm_campaign, utm_content,
  utm_term, campaign_id, adset_id, ad_id, traffic_source, referrer,
  landing_path, device_type, lot_number, horse_name, video_url, catalog_name,
  experience_type
) ON public.martendal_tracking_events TO anon;

ALTER TABLE public.martendal_tracking_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon can insert tracking events" ON public.martendal_tracking_events;
CREATE POLICY "anon can insert tracking events"
  ON public.martendal_tracking_events
  FOR INSERT TO anon
  WITH CHECK (true);

ALTER TABLE public.martendal_tracking_events
  DROP CONSTRAINT IF EXISTS martendal_tracking_payload_lengths,
  ADD CONSTRAINT martendal_tracking_payload_lengths CHECK (
    (session_id IS NULL OR char_length(session_id) <= 80) AND
    (utm_source IS NULL OR char_length(utm_source) <= 300) AND
    (utm_medium IS NULL OR char_length(utm_medium) <= 300) AND
    (utm_campaign IS NULL OR char_length(utm_campaign) <= 300) AND
    (utm_content IS NULL OR char_length(utm_content) <= 300) AND
    (utm_term IS NULL OR char_length(utm_term) <= 300) AND
    (campaign_id IS NULL OR char_length(campaign_id) <= 80) AND
    (adset_id IS NULL OR char_length(adset_id) <= 80) AND
    (ad_id IS NULL OR char_length(ad_id) <= 80) AND
    (traffic_source IS NULL OR char_length(traffic_source) <= 80) AND
    (referrer IS NULL OR char_length(referrer) <= 300) AND
    (landing_path IS NULL OR char_length(landing_path) <= 200) AND
    (device_type IS NULL OR char_length(device_type) <= 20) AND
    (lot_number IS NULL OR char_length(lot_number) <= 20) AND
    (horse_name IS NULL OR char_length(horse_name) <= 120) AND
    (video_url IS NULL OR char_length(video_url) <= 300) AND
    (catalog_name IS NULL OR char_length(catalog_name) <= 120) AND
    (experience_type IS NULL OR experience_type IN ('squeeze','catalog'))
  );

CREATE TABLE IF NOT EXISTS private.panel_login_attempts (
  fingerprint text PRIMARY KEY,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.panel_login_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.panel_login_attempts TO service_role;
ALTER TABLE private.panel_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.panel_token_hash(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

CREATE OR REPLACE FUNCTION private.panel_email_from_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_email text;
BEGIN
  DELETE FROM private.panel_sessions WHERE expires_at <= now();
  SELECT s.email INTO v_email
  FROM private.panel_sessions s
  WHERE s.token_hash = private.panel_token_hash(p_token)
    AND s.expires_at > now();
  RETURN v_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_login(p_email text, p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_hash text;
  v_token text;
  v_expires timestamptz;
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_address text;
  v_fingerprint text;
  v_attempts integer;
  v_window timestamptz;
BEGIN
  v_address := btrim(split_part(
    coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'cf-connecting-ip', 'unknown'),
    ',', 1
  ));
  v_fingerprint := encode(extensions.digest(v_address, 'sha256'), 'hex');

  DELETE FROM private.panel_login_attempts
  WHERE window_started_at < now() - interval '24 hours';

  SELECT failed_attempts, window_started_at
    INTO v_attempts, v_window
  FROM private.panel_login_attempts
  WHERE fingerprint = v_fingerprint;

  IF v_window IS NOT NULL
     AND v_window >= now() - interval '15 minutes'
     AND v_attempts >= 10 THEN
    RETURN jsonb_build_object('error', 'rate_limited');
  END IF;

  IF v_email <> 'beludokuka321@gmail.com' OR coalesce(p_secret, '') = '' THEN
    INSERT INTO private.panel_login_attempts(fingerprint, failed_attempts, window_started_at, updated_at)
    VALUES (v_fingerprint, 1, now(), now())
    ON CONFLICT (fingerprint) DO UPDATE SET
      failed_attempts = CASE
        WHEN private.panel_login_attempts.window_started_at < now() - interval '15 minutes' THEN 1
        ELSE private.panel_login_attempts.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN private.panel_login_attempts.window_started_at < now() - interval '15 minutes' THEN now()
        ELSE private.panel_login_attempts.window_started_at
      END,
      updated_at = now();
    RETURN jsonb_build_object('error', 'invalid_credentials');
  END IF;

  SELECT c.secret_hash INTO v_hash
  FROM private.panel_admin_credentials c
  WHERE c.email = v_email;

  IF v_hash IS NULL OR extensions.crypt(p_secret, v_hash) <> v_hash THEN
    INSERT INTO private.panel_login_attempts(fingerprint, failed_attempts, window_started_at, updated_at)
    VALUES (v_fingerprint, 1, now(), now())
    ON CONFLICT (fingerprint) DO UPDATE SET
      failed_attempts = CASE
        WHEN private.panel_login_attempts.window_started_at < now() - interval '15 minutes' THEN 1
        ELSE private.panel_login_attempts.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN private.panel_login_attempts.window_started_at < now() - interval '15 minutes' THEN now()
        ELSE private.panel_login_attempts.window_started_at
      END,
      updated_at = now();
    RETURN jsonb_build_object('error', 'invalid_credentials');
  END IF;

  DELETE FROM private.panel_login_attempts WHERE fingerprint = v_fingerprint;
  DELETE FROM private.panel_sessions WHERE expires_at <= now();

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires := now() + interval '12 hours';
  INSERT INTO private.panel_sessions(token_hash, email, expires_at)
  VALUES (private.panel_token_hash(v_token), v_email, v_expires);

  RETURN jsonb_build_object('token', v_token, 'email', v_email, 'expires_at', v_expires);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_session_valid(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_email text;
BEGIN
  v_email := private.panel_email_from_token(p_token);
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  RETURN jsonb_build_object('valid', true, 'email', v_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_get_tracking_events(p_token text)
RETURNS SETOF public.martendal_tracking_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_email text;
BEGIN
  v_email := private.panel_email_from_token(p_token);
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.martendal_tracking_events
    ORDER BY created_at DESC
    LIMIT 20000;
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_logout(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM private.panel_sessions
  WHERE token_hash = private.panel_token_hash(p_token);
  DELETE FROM private.panel_sessions WHERE expires_at <= now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_change_secret(p_token text, p_current text, p_new text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
  v_hash text;
BEGIN
  v_email := private.panel_email_from_token(p_token);
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;
  IF p_new IS NULL OR length(p_new) < 12 THEN
    RETURN jsonb_build_object('error', 'weak_secret');
  END IF;
  SELECT c.secret_hash INTO v_hash
  FROM private.panel_admin_credentials c
  WHERE c.email = v_email;
  IF v_hash IS NULL OR extensions.crypt(coalesce(p_current, ''), v_hash) <> v_hash THEN
    RETURN jsonb_build_object('error', 'invalid_credentials');
  END IF;
  UPDATE private.panel_admin_credentials
  SET secret_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 12)),
      updated_at = now()
  WHERE email = v_email;
  DELETE FROM private.panel_sessions WHERE email = v_email;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION private.panel_token_hash(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.panel_email_from_token(text) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.panel_login(text, text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.panel_session_valid(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.panel_get_tracking_events(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.panel_logout(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.panel_change_secret(text, text, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.panel_login(text, text) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.panel_session_valid(text) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.panel_get_tracking_events(text) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.panel_logout(text) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.panel_change_secret(text, text, text) TO anon, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
