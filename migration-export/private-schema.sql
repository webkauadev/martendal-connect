-- ============================================================
-- Export: schema `private` (protecao do /leads-panel)
-- Estado real em 2026-09-07. Sem secrets.
-- Aplicar ANTES de schema.sql (a policy de leitura depende
-- de private.is_panel_admin()).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

-- O schema NAO e exposto na API de dados.
-- ACL atual: postgres = USAGE/CREATE, authenticated = USAGE.
GRANT USAGE ON SCHEMA private TO authenticated;
REVOKE ALL ON SCHEMA private FROM anon;

-- ---------- Allowlist do painel ----------
CREATE TABLE IF NOT EXISTS private.panel_admins (
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT panel_admins_pkey PRIMARY KEY (email)
);

-- Nenhum grant para anon/authenticated: a tabela e lida apenas
-- pela funcao SECURITY DEFINER abaixo.
REVOKE ALL ON private.panel_admins FROM anon, authenticated;
GRANT ALL ON private.panel_admins TO service_role;

ALTER TABLE private.panel_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages panel admins" ON private.panel_admins;
CREATE POLICY "service role manages panel admins"
  ON private.panel_admins
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------- Verificacao de acesso ----------
CREATE OR REPLACE FUNCTION private.is_panel_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $function$
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
$function$;

-- ---------- Dados da allowlist (ver panel-admins.json) ----------
INSERT INTO private.panel_admins (email, created_at)
VALUES ('beludokuka321@gmail.com', '2026-09-02 19:34:30.278078+00')
ON CONFLICT (email) DO NOTHING;
