CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.panel_v2_broker (
  id smallint PRIMARY KEY CHECK (id = 1),
  secret_hash text NOT NULL CHECK (secret_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private.panel_v2_consumed_keys (
  jti_hash text PRIMARY KEY CHECK (jti_hash ~ '^[0-9a-f]{64}$'),
  key_expires_at timestamptz NOT NULL,
  consumed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private.panel_v2_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS private.panel_v2_request_limits (
  fingerprint text PRIMARY KEY CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS panel_v2_sessions_expires_idx
  ON private.panel_v2_sessions (expires_at);

CREATE INDEX IF NOT EXISTS panel_v2_consumed_keys_expires_idx
  ON private.panel_v2_consumed_keys (key_expires_at);

REVOKE ALL ON private.panel_v2_broker FROM PUBLIC, anon, authenticated;
REVOKE ALL ON private.panel_v2_consumed_keys FROM PUBLIC, anon, authenticated;
REVOKE ALL ON private.panel_v2_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON private.panel_v2_request_limits FROM PUBLIC, anon, authenticated;

ALTER TABLE private.panel_v2_broker ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.panel_v2_consumed_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.panel_v2_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.panel_v2_request_limits ENABLE ROW LEVEL SECURITY;

INSERT INTO private.panel_v2_broker (id, secret_hash)
VALUES (1, 'be3eeb4bed72a52bd4e7eee03db0b473c4b789ef89a4baec9ed911cfd3be1982')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.panel_v2_broker_ok(p_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.panel_v2_broker b
    WHERE b.id = 1
      AND b.secret_hash =
        encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex')
  )
$$;

REVOKE ALL ON FUNCTION private.panel_v2_broker_ok(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.panel_v2_rate_limit(
  p_broker_secret text,
  p_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_count integer;
  v_window timestamptz;
BEGIN
  IF NOT private.panel_v2_broker_ok(p_broker_secret) THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'unauthorized');
  END IF;

  IF p_fingerprint IS NULL OR p_fingerprint !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'invalid_fingerprint');
  END IF;

  DELETE FROM private.panel_v2_request_limits
  WHERE updated_at < now() - interval '24 hours';

  INSERT INTO private.panel_v2_request_limits (
    fingerprint,
    request_count,
    window_started_at,
    updated_at
  )
  VALUES (
    p_fingerprint,
    1,
    now(),
    now()
  )
  ON CONFLICT (fingerprint) DO UPDATE
  SET
    request_count = CASE
      WHEN private.panel_v2_request_limits.window_started_at <
           now() - interval '15 minutes'
        THEN 1
      ELSE private.panel_v2_request_limits.request_count + 1
    END,
    window_started_at = CASE
      WHEN private.panel_v2_request_limits.window_started_at <
           now() - interval '15 minutes'
        THEN now()
      ELSE private.panel_v2_request_limits.window_started_at
    END,
    updated_at = now()
  RETURNING request_count, window_started_at
  INTO v_count, v_window;

  IF v_count > 20
     AND v_window >= now() - interval '15 minutes' THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'rate_limited');
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_v2_consume_key(
  p_broker_secret text,
  p_jti_hash text,
  p_session_hash text,
  p_key_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_inserted integer;
  v_session_expires timestamptz;
BEGIN
  IF NOT private.panel_v2_broker_ok(p_broker_secret) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  IF p_jti_hash IS NULL
     OR p_jti_hash !~ '^[0-9a-f]{64}$'
     OR p_session_hash IS NULL
     OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  IF p_key_expires_at IS NULL
     OR p_key_expires_at <= now()
     OR p_key_expires_at > now() + interval '6 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  DELETE FROM private.panel_v2_sessions
  WHERE expires_at <= now();

  DELETE FROM private.panel_v2_consumed_keys
  WHERE key_expires_at < now() - interval '1 day';

  INSERT INTO private.panel_v2_consumed_keys (
    jti_hash,
    key_expires_at
  )
  VALUES (
    p_jti_hash,
    p_key_expires_at
  )
  ON CONFLICT (jti_hash) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'replayed');
  END IF;

  v_session_expires := now() + interval '8 hours';

  INSERT INTO private.panel_v2_sessions (
    token_hash,
    expires_at
  )
  VALUES (
    p_session_hash,
    v_session_expires
  );

  RETURN jsonb_build_object(
    'ok', true,
    'expires_at', v_session_expires
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_v2_session_valid(
  p_broker_secret text,
  p_session_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_valid boolean;
BEGIN
  IF NOT private.panel_v2_broker_ok(p_broker_secret) THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF p_session_hash IS NULL
     OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  DELETE FROM private.panel_v2_sessions
  WHERE expires_at <= now();

  SELECT EXISTS (
    SELECT 1
    FROM private.panel_v2_sessions s
    WHERE s.token_hash = p_session_hash
      AND s.expires_at > now()
  )
  INTO v_valid;

  RETURN jsonb_build_object('valid', v_valid);
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_v2_get_tracking_events(
  p_broker_secret text,
  p_session_hash text
)
RETURNS SETOF public.martendal_tracking_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT private.panel_v2_broker_ok(p_broker_secret) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM private.panel_v2_sessions s
    WHERE s.token_hash = p_session_hash
      AND s.expires_at > now()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
    SELECT *
    FROM public.martendal_tracking_events
    ORDER BY created_at DESC
    LIMIT 20000;
END;
$$;

CREATE OR REPLACE FUNCTION public.panel_v2_logout(
  p_broker_secret text,
  p_session_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT private.panel_v2_broker_ok(p_broker_secret) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  DELETE FROM private.panel_v2_sessions
  WHERE token_hash = p_session_hash;

  DELETE FROM private.panel_v2_sessions
  WHERE expires_at <= now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.panel_v2_rate_limit(text, text)
  FROM PUBLIC, authenticated;

REVOKE ALL ON FUNCTION public.panel_v2_consume_key(text, text, text, timestamptz)
  FROM PUBLIC, authenticated;

REVOKE ALL ON FUNCTION public.panel_v2_session_valid(text, text)
  FROM PUBLIC, authenticated;

REVOKE ALL ON FUNCTION public.panel_v2_get_tracking_events(text, text)
  FROM PUBLIC, authenticated;

REVOKE ALL ON FUNCTION public.panel_v2_logout(text, text)
  FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.panel_v2_rate_limit(text, text)
  TO anon, service_role;

GRANT EXECUTE ON FUNCTION public.panel_v2_consume_key(text, text, text, timestamptz)
  TO anon, service_role;

GRANT EXECUTE ON FUNCTION public.panel_v2_session_valid(text, text)
  TO anon, service_role;

GRANT EXECUTE ON FUNCTION public.panel_v2_get_tracking_events(text, text)
  TO anon, service_role;

GRANT EXECUTE ON FUNCTION public.panel_v2_logout(text, text)
  TO anon, service_role;
