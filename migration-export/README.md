# Export do backend atual — Martendal Weekend 2026

Snapshot somente-leitura do backend em produção, gerado em **2026-09-07** para ser aplicado em outro projeto Supabase já existente.
Nada da aplicação nem do banco atual foi alterado. Nenhum arquivo contém chaves de API, service_role, senhas ou tokens.

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `private-schema.sql` | Schema `private`, tabela `private.panel_admins`, RLS/policy e função `private.is_panel_admin()` (inclui o registro da allowlist) |
| `schema.sql` | `public.martendal_tracking_events`: colunas, defaults, constraint de `event_type`, 9 índices, trigger `martendal_set_experience_type`, grants/revokes e policies de RLS |
| `panel-admins.json` | Registros atuais de `private.panel_admins` |
| `tracking-events.json` | Todos os registros de `public.martendal_tracking_events` |

## Contagens exatas

- `public.martendal_tracking_events`: **767** registros
  - `page_view`: 651
  - `lot_view`: 68
  - `whatsapp_click`: 40
  - `catalog_view`: 5
  - `catalog_video_click`: 2
  - `lot_whatsapp_click`: 1
  - `catalog_whatsapp_click`: 0
  - `pdf_download`: 0
- Por experiência: `squeeze` 691 · `catalog` 76 · nulo 0
- Intervalo de datas (UTC): `2026-09-02 19:17:25.855036+00` → `2026-09-07 03:52:58.530332+00`
- `private.panel_admins`: **1** registro

## Ordem segura de importação

1. **`private-schema.sql`** — cria o schema `private`, a allowlist e `private.is_panel_admin()`.
   Precisa vir primeiro: a policy de leitura da tabela pública depende dessa função.
2. **`schema.sql`** — cria a tabela pública, índices, trigger, grants e policies.
3. **`tracking-events.json`** — importe as 767 linhas.
   Importante: o trigger `BEFORE INSERT` só preenche `experience_type` quando o valor vem nulo, portanto os valores históricos do JSON são preservados como estão. Insira **todas as colunas**, incluindo `id` e `created_at`, para manter o histórico idêntico.
4. **`panel-admins.json`** — apenas conferência; a linha já é inserida pelo passo 1 (`ON CONFLICT DO NOTHING`).

Depois da importação, valide com:

```sql
select count(*) from public.martendal_tracking_events;            -- esperado: 767
select event_type, count(*) from public.martendal_tracking_events group by 1 order by 1;
select count(*) from private.panel_admins;                        -- esperado: 1
```

## Fora deste export (configuração manual no novo projeto)

- Provedor Google (Client ID / Client Secret) e URLs de Site/Redirect — configuração de autenticação, não schema.
- Variáveis `VITE_SUPABASE_*` da aplicação, que apontam para o projeto novo.
