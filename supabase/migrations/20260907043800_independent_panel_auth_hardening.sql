-- Finaliza o painel administrativo independente de OAuth/Lovable.
-- A chave temporária não aparece neste arquivo; somente o hash bcrypt é versionado.

INSERT INTO private.panel_admin_credentials (email, secret_hash)
VALUES (
  'beludokuka321@gmail.com',
  '$2a$12$XusmY6ApfeZdFjN0B/V76ug/I8ro6m2kCbSAsU3KQY/bmY.IwHBUa'
)
ON CONFLICT (email) DO NOTHING;

DELETE FROM private.panel_admin_credentials
WHERE lower(email) <> 'beludokuka321@gmail.com';

-- O painel não lê mais a tabela diretamente. Toda leitura passa pela RPC
-- panel_get_tracking_events(), que valida o token administrativo no servidor.
DROP POLICY IF EXISTS "only panel admin can read tracking events"
  ON public.martendal_tracking_events;

REVOKE SELECT ON public.martendal_tracking_events FROM anon, authenticated;
GRANT INSERT ON public.martendal_tracking_events TO anon, authenticated;
GRANT ALL ON public.martendal_tracking_events TO service_role;
