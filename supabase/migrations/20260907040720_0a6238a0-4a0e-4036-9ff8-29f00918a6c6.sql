CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon;

CREATE TABLE IF NOT EXISTS private.panel_admin_credentials (
  email text PRIMARY KEY,
  secret_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private.panel_sessions (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS panel_sessions_expires_idx ON private.panel_sessions (expires_at);

REVOKE ALL ON private.panel_admin_credentials FROM anon, authenticated;
REVOKE ALL ON private.panel_sessions FROM anon, authenticated;
GRANT ALL ON private.panel_admin_credentials TO service_role;
GRANT ALL ON private.panel_sessions TO service_role;

ALTER TABLE private.panel_admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.panel_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages panel credentials" ON private.panel_admin_credentials;
CREATE POLICY "service role manages panel credentials"
  ON private.panel_admin_credentials FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages panel sessions" ON private.panel_sessions;
CREATE POLICY "service role manages panel sessions"
  ON private.panel_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------- helpers ----------------
CREATE OR REPLACE FUNCTION private.panel_token_hash(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'private', 'public', 'extensions'
AS $$ SELECT encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') $$;

CREATE OR REPLACE FUNCTION private.panel_email_from_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public', 'extensions'
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

REVOKE ALL ON FUNCTION private.panel_token_hash(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.panel_email_from_token(text) FROM PUBLIC;

-- ---------------- public RPCs ----------------
CREATE OR REPLACE FUNCTION public.panel_login(p_email text, p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public', 'extensions'
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_hash text;
  v_token text;
  v_expires timestamptz;
BEGIN
  IF v_email <> 'beludokuka321@gmail.com' OR coalesce(p_secret, '') = '' THEN
    RETURN jsonb_build_object('error', 'invalid_credentials');
  END IF;

  SELECT c.secret_hash INTO v_hash
  FROM private.panel_admin_credentials c
  WHERE c.email = v_email;

  IF v_hash IS NULL OR extensions.crypt(p_secret, v_hash) <> v_hash THEN
    RETURN jsonb_build_object('error', 'invalid_credentials');
  END IF;

  DELETE FROM private.panel_sessions WHERE expires_at <= now();

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires := now() + interval '12 hours';

  INSERT INTO private.panel_sessions (token_hash, email, expires_at)
  VALUES (private.panel_token_hash(v_token), v_email, v_expires);

  RETURN jsonb_build_object('token', v_token, 'email', v_email, 'expires_at', v_expires);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_session_valid(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public', 'extensions'
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
SET search_path TO 'private', 'public', 'extensions'
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
SET search_path TO 'private', 'public', 'extensions'
AS $$
BEGIN
  DELETE FROM private.panel_sessions WHERE token_hash = private.panel_token_hash(p_token);
  DELETE FROM private.panel_sessions WHERE expires_at <= now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_change_secret(p_token text, p_current text, p_new text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'public', 'extensions'
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

REVOKE ALL ON FUNCTION public.panel_login(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.panel_session_valid(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.panel_get_tracking_events(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.panel_logout(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.panel_change_secret(text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.panel_login(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.panel_session_valid(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.panel_get_tracking_events(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.panel_logout(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.panel_change_secret(text, text, text) TO anon, authenticated, service_role;