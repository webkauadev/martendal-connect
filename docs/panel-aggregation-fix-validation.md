# Painel: reprodução do truncamento — 2026-10-05

## Snapshot imutável antes de qualquer DDL

| campo | valor |
|---|---:|
| eventos | 8.161 |
| primeiro | 2026-09-02 19:17:25.855036+00 |
| último | 2026-10-05 09:12:57.400203+00 |
| checksum determinístico | `5b76fc05d90b38fe6b5f03d6900fdd53` |

## Root cause confirmado

`public.panel_v2_get_tracking_events` ordena por `created_at DESC` e contém `LIMIT 20000` (migration `20260910154623_panel_one_time_auth_parallel.sql`). Porém a resposta da Data API é limitada a 1.000 linhas. O `LIMIT` interno só define o máximo que a função pode produzir; não substitui o limite da camada PostgREST/Data API.

O frontend de `src/routes/leads-panel.tsx` recebe esse único array em `panelGetTrackingEvents()` e calcula no navegador filtros, cards, funis, séries, breakdows e lotes. A paginação exibida (`slice`) também é somente local.

Agregação SQL dos 1.000 registros mais recentes reproduziu exatamente o sintoma:

| métrica | 1.000 recentes |
|---|---:|
| acessos | 70 |
| sessões de acesso | 63 |
| sessões com clique | 3 |
| squeeze acessos / únicos | 34 / 32 |
| catálogo acessos / únicos | 36 / 31 |
| lot_views | 819 |
| vídeos | 28 |

## Oráculo SQL completo

Todo período, sem filtro: 1.670 acessos; 1.555 sessões únicas; squeeze 1.338/1.256/75; catálogo 332/303; 250 sessões visualizaram lotes; 6.030 lot_views; 157 cliques em vídeo em 51 sessões; 9 sessões de WhatsApp do catálogo. Acesso é apenas `page_view` ou `catalog_view`; a chave de sessão é `coalesce(nullif(session_id,''), id::text)`.

## Tentativa transacional de arquitetura nova

Uma prova em `BEGIN … ROLLBACK` criou uma função agregada protegida pelo mesmo broker/sessão e uma leitura por cursor de 100 linhas. O agregado retornou os totais completos, enquanto a página bruta retornou `100` e `hasMore=true`. A transação foi revertida: nenhum evento, segredo, sessão ou schema de produção foi modificado.

## Integração da camada de dados — 2026-10-05

Status atualizado: implementação integrada à UI original; validação final SQL × API × UI e browser deliberadamente reservada à próxima etapa. Os números acima são o snapshot da investigação, não uma nova captura visual.

### Migrations e contrato final

- Original aplicada: `20261005190000_fix_panel_dashboard_aggregations.sql`.
- Corretiva única criada pelo CLI e aplicada: `20261005191024_complete_panel_dashboard_contract.sql`.
- `panel_v2_get_dashboard(text,text,jsonb)` mantém sua assinatura. Acrescenta `summary.total_events`, séries e breakdowns específicos de catálogo, breakdowns de termo/UTM/Meta/dispositivo/catálogo/evento, detalhes completos dos lotes e `filter_options` globais.
- `panel_v2_get_tracking_events_page` recebe `p_filters jsonb` além do cursor e tamanho. A assinatura antiga foi removida para evitar overload ambíguo.
- Filtros: `start_at`, `end_at`, `experience`, `catalog_key`, `source`, `campaign`, `term`, `content`, `event`, `device`, `lot`, `search`, `session_id`. Ausência/null/vazio significa sem filtro. Lote usa `catalog_key:lot_number`.
- `private.panel_v2_authorized_session` e toda a autenticação permanecem intactos. RPCs usam SECURITY DEFINER, search_path vazio, autorização efetiva, consultas estáticas e validação de argumentos.

Antes da aplicação, DDL e corpos das consultas foram executados em transação repeatable-read e revertidos. Foram testados filtros de experiência, catálogos, origens, evento, dispositivo, valores reais de campanha/termo/conteúdo/lote/sessão/busca e intervalo; duas páginas sem sobreposição; limite de 100; campos adicionais; e rejeição de autorização inválida pelas RPCs. Os testes positivos executaram os corpos SQL, não um login administrativo real. Count e checksum de `to_jsonb(evento)` ordenado por id permaneceram iguais dentro da transação. Nenhum UPDATE/DELETE/backfill de eventos foi incluído. A verificação histórica final com cutoff permanece na etapa final.

### API e React

Dashboard e eventos têm carregamento/erro independentes, cancelamento de requests obsoletos e clientes tipados. Filtros são validados no servidor (400), sessão ausente/inválida mantém 401 e falha de backend mantém 503; respostas no-store. Nenhum segredo chega ao cliente.

O JSX original foi preservado. A redução de 1.894 para 1.557 linhas resulta da remoção das agregações históricas locais e substituição por adapters tipados. Não foi reutilizado o JSX reduzido de 146 linhas.

| Funcionalidade | Original | Final | Fonte dos dados |
|---|---|---|---|
| Login, sessão, logout | SIM | SIM | Auth original sem alteração |
| Hoje/ontem/7 dias/todo/customizado | SIM | SIM | Timestamps Porto Velho enviados às duas RPCs |
| Experiência e catálogo | SIM | SIM | Filtros backend; opções estáticas originais |
| Origem/campanha/termo/conteúdo/device/lote | SIM | SIM | `filter_options` do histórico completo |
| Filtro evento | SIM | SIM | Opções originais; filtro backend |
| Busca lote/animal | SIM | SIM | `search` backend, debounce 300 ms |
| Busca por rótulos nas tabelas UTM | SIM | SIM | Apresentação dos breakdowns completos, sem eventos crus |
| Cards gerais/squeeze/catálogo | SIM | SIM | `summary` |
| Funis e taxas | SIM | SIM | Numeradores/denominadores agregados |
| Recharts diário geral | SIM | SIM | `timeseries` |
| Recharts diário catálogo | SIM | SIM | `catalog_timeseries` |
| Origem/campanha/termo/conteúdo/UTM/Meta | SIM | SIM | `breakdowns` |
| Origem/campanha específicas catálogo | SIM | SIM | `catalog_breakdowns` |
| Rankings, ordenação e tabela de lotes | SIM | SIM | `lots` |
| Detalhe de lote, origens, campanhas, conteúdos, devices | SIM | SIM | Mapas agregados de `lots` |
| Vídeo, URL e ranking de vídeos | SIM | SIM | `lots` |
| Eventos, colunas e paginação | SIM | SIM | Endpoint paginado, até 100 |
| Timeline de sessão | SIM | SIM | Consulta backend por `session_id` + período, paginada |
| CSV completo filtrado | SIM | SIM | Streaming server-side em páginas de 100 |
| Loading, erro, vazio, layout responsivo | SIM | SIM | JSX original e estados independentes |

Não há métricas nem opções globais derivadas de `recentEvents`. Foram removidos `rows` histórico, `groupBy`, `groupCatalogBy`, agrupamentos diários locais e a leitura antiga `panelGetTrackingEvents`. Os mapas/ordenações restantes apenas adaptam dados já agregados.

### Paginação, buscas e fórmulas

Ordenação determinística `created_at DESC, id DESC`, cursor composto, tamanho padrão/máximo 100. Anterior usa stack de cursores. Alterar filtro reinicia a página; navegar eventos não chama dashboard. Timeline busca a sessão no servidor e mostra páginas em ordem cronológica local, com controles para eventos anteriores/posteriores. CSV é ação explícita de download, transmitida pelo servidor; nunca monta histórico em estado React.

Busca lote/animal mantém a semântica original e filtra as duas RPCs. Busca de rótulos nas tabelas é apresentação de agregados completos, não busca histórica nos 100 eventos. Opções globais não diminuem conforme a página ou filtro atual.

- Acesso: page_view/catalog_view; sessão: session_id com fallback id histórico.
- Geral/squeeze: sessões com WhatsApp ÷ sessões de acesso × 100.
- Avanço catálogo: sessões WhatsApp catálogo ÷ sessões de acesso catálogo × 100.
- Interesse catálogo: sessões interessadas ÷ sessões com lot_view × 100.
- Taxa de lote: sessões interessadas ÷ sessões que visualizaram aquele catálogo+lote × 100.
- Vídeo → WhatsApp: quantidade de sessões presentes nos dois conjuntos daquele catálogo+lote, sem impor ordem temporal (semântica original).
- Séries usam dias de America/Porto_Velho; intervalo final exclusivo. Lot_view não conta como acesso.

### Testes desta etapa

`node scripts/test-panel-data.cjs`: PASS. Executa clientes/helpers reais, limites de data UTC−4 (incluindo meia-noite, ano, mês e customizado), validação de parâmetros, encaminhamento de todos os filtros, mock de 5.101 eventos com páginas de 100, três páginas distintas sem nova chamada dashboard, rejeição de payload acima de 100, verificação de títulos originais e comparação AST das três funções de autenticação com HEAD. O cenário mock valida separação do data layer; não é prova SQL × UI nem benchmark.

Checks finais registrados abaixo após execução. Não foram feitos browser matrix, performance, payload benchmark, testes extensivos de auth ou comparação final SQL × API × UI neste turno, conforme escopo solicitado. Não houve commit/push/deploy.

| Check desta etapa | Resultado |
|---|---|
| `node scripts/test-panel-data.cjs` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS (aviso do Vite sobre vite-tsconfig-paths) |
| Prettier direcionado | PASS |
| ESLint nos sete arquivos TS/TSX alterados e script de teste | PASS |
| `git diff --check` | PASS |

`.npmrc` e `package-lock.json` permanecem intocados e não rastreados. O arquivo temporário criado pelo CLI (`supabase/.temp/cli-latest`) foi movido para `/tmp/martendal-cli-latest`, recuperável, para não entrar na alteração. Nenhuma alteração foi staged.

## Tentativa de validação end-to-end — bloqueio externo reproduzido

Branch `main`; diff-check inicial limpo. `.npmrc` e `package-lock.json` continuam não rastreados e não foram editados nesta rodada. Nenhuma alteração de implementação ou migration foi feita nesta tentativa.

### Snapshot SQL direto recapturado

Consultas diretamente em `public.martendal_tracking_events`, sem RPCs: contagens por event_type e distinct `coalesce(nullif(session_id,''),id::text)`.

| Métrica | SQL atual | API | UI |
|---|---:|---|---|
| Eventos | 8.161 | Não executado | Não executado |
| Acessos | 1.670 | Bloqueado | Bloqueado |
| Únicos de acesso | 1.555 | Bloqueado | Bloqueado |
| Sessões com clique | 84 | Bloqueado | Bloqueado |
| Squeeze acessos / únicos | 1.338 / 1.256 | Bloqueado | Bloqueado |
| Squeeze WA eventos / sessões | 85 / 75 | Bloqueado | Bloqueado |
| Squeeze avanço | 5,971338% | Bloqueado | Bloqueado |
| Catálogo acessos / únicos | 332 / 303 | Bloqueado | Bloqueado |
| Sessões com lot_view / lot_views | 250 / 6.030 | Bloqueado | Bloqueado |
| Vídeo eventos / sessões | 157 / 51 | Bloqueado | Bloqueado |
| Catálogo WA eventos / sessões | 13 / 9 | Bloqueado | Bloqueado |
| Interesse eventos / sessões / lotes | 6 / 5 / 4 | Bloqueado | Bloqueado |

Primeiro evento `2026-09-02 19:17:25.855036+00`; último `2026-10-05 09:12:57.400203+00`. Não se afirma diferença zero SQL × API × UI: API e UI não puderam ser executadas.

### Bloqueio exato

`npm run dev -- --host 127.0.0.1` falhou antes de disponibilizar a aplicação:

```text
Error: listen EPERM: operation not permitted 127.0.0.1:3000
code: EPERM
syscall: listen
```

Uma reprodução independente com `node:net.createServer().listen(3001,"127.0.0.1")` também retornou `EPERM`, `syscall: listen`, porta 3001. Portanto, o bloqueio é a proibição de sockets de escuta neste ambiente, não falta de sessão ou falha identificada no React. A política da sessão não permite solicitar execução fora do sandbox.

`agent-browser open about:blank` também falhou ao criar seu diretório de sockets padrão: `Read-only file system (os error 30)`. Mesmo realocar esse diretório não resolveria a proibição de iniciar o servidor comprovada acima. Não foi gerada chave efêmera: não havia aplicação local acessível para consumi-la. Nenhum cookie/token/segredo foi exibido. Não houve deploy para contornar o bloqueio.

A skill de verificação orienta interromper na fronteira quebrada; o teste E2E parou na inicialização do servidor. Login/replay/logout, filtros UI, matriz 320/375/390/768/1440, paginação UI, timeline, console/network e regressão pública não foram executados. Payload/performance/RPC-security extensivos também não foram executados nesta rodada interrompida; os testes transacionais anteriores não substituem essa validação.

### Histórico

No cutoff fixo `2026-10-05 09:12:57.400203+00`, COUNT/MIN/MAX são iguais ao snapshot anterior. A consulta explícita atual foi:

```sql
select count(*), min(created_at), max(created_at),
       md5(string_agg(to_jsonb(e)::text, E'\n' order by id)) as checksum
from public.martendal_tracking_events e
where created_at <= '2026-10-05 09:12:57.400203+00';
```

Checksum atual: `ef9e555a7eb4df0800a8fe261cd87e95`. O checksum antigo `5b76fc05d90b38fe6b5f03d6900fdd53` foi registrado sem a expressão SQL correspondente. Eles diferem e não é possível afirmar equivalência nem concluir alteração de registros sem recuperar a mesma serialização original. Preservação por checksum **não certificada nesta rodada**; a evidência transacional anterior continua distinta deste teste.

### Checks executados novamente

- Mock 5.101, timezone, clientes e arquitetura: PASS; não é E2E.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run lint`: FAIL, 58 erros e 6 warnings em arquivos fora da alteração direcionada.
- ESLint direcionado nos sete arquivos TS/TSX e script: PASS.
- `git diff --check`: PASS.
- `panel-csv-server.ts` tem uso real: importado pelo endpoint events e acionado por `format=csv`, exportação da UI. Não foi removido.

Para retomar o E2E é necessário executar este mesmo worktree em ambiente que permita servidor HTTP local e browser. Não é necessário mudar auth, arquitetura ou criar outra migration para resolver o bloqueio de execução.

## Tentativa autorizada de Preview Vercel — 2026-10-05

Não houve nova tentativa de servidor local. Foram usadas as skills de Vercel CLI/deployments para conferir o projeto vinculado e restringir o alvo a Preview.

- Branch `main`; mudanças continuam locais, sem commit/push.
- Projeto vinculado: `martendal-connect` (`prj_JCyDKot4nFjNARoIXtrY5JF0tW3w`).
- `npm run typecheck`, `npm run build`, `git diff --check` e `node scripts/test-panel-data.cjs`: PASS novamente.
- CLI instalada: Vercel 57.0.0.
- Comando de tentativa: `VERCEL_TELEMETRY_DISABLED=1 NO_UPDATE_NOTIFIER=1 vercel deploy --target preview --yes --no-wait`.
- As duas variáveis acima controlam somente o processo local da CLI; nenhuma variável do projeto/Preview foi alterada.

O comando parou em `Retrieving project…`, sem fornecer deployment ID ou Preview URL. Uma consulta DNS independente de `api.vercel.com` reproduziu:

```json
{"code":"EAI_AGAIN","syscall":"getaddrinfo","hostname":"api.vercel.com"}
```

A CLI também reportou `getaddrinfo EAI_AGAIN sentry.io`; a tentativa terminou com exit code 1. O erro inicial do verificador de atualização da CLI, que tentava escrever no cache read-only, foi evitado com `NO_UPDATE_NOTIFIER=1`; isso não resolveu a falha de DNS/acesso à API da Vercel.

**Bloqueio externo:** conectividade/resolução DNS da execução local até a API da Vercel, antes de obter um deployment. Status Ready e URL de Preview não disponíveis. Não foi possível verificar a presença de `PANEL_BROKER_SECRET` no Preview; não se afirma que esteja ausente. Nenhuma chave one-time foi gerada sem um destino disponível.

SQL × API × UI, auth/replay/logout, filtros, paginação, timeline, browser, payload, performance e regressão no Preview não foram executados porque nenhum Preview ficou disponível nesta tentativa. Não foi usado domínio customizado, produção, promote, alias, alteração de DNS ou env. `.npmrc` e `package-lock.json` permanecem intocados e não versionados. A implementação não foi alterada.

Próxima condição necessária: executar o deploy Preview deste worktree em ambiente com acesso à API da Vercel. O bloqueio não requer mudança na aplicação nem nova migration.

## QA do Preview informado `dc6hqee5l` — resultado NO-GO

URL alvo: `https://martendal-connect-dc6hqee5l-kauadev.vercel.app/leads-panel`. Não foi possível carregar/autenticar esta URL nesta sessão; a confirmação visual mencionada pelo usuário não foi tratada como teste automatizado executado pelo agente.

### Ambiente e versão

Versões instaladas confirmadas por `npm ls`: react-start **1.168.60**, react-router **1.170.41**, router-plugin **1.168.42**. Atualizações existentes em package.json e tipagem `error: unknown` em __root.tsx foram preservadas; nenhum downgrade.

Tentativas reais:

1. `agent-browser open <Preview>/leads-panel`: `Failed to create socket directory: Read-only file system (os error 30)`.
2. MCP `get_deployment` no escopo kauadev: **403 Forbidden**, não autorizado ao time.
3. MCP fetch do endpoint session: `MCP tool call requires approval, but approval policy is never`.
4. Fetch web de session e leads-panel: URL não acessível pela ferramenta; não equivale a HTTP 401 da aplicação.
5. Runtime logs por deployment: **403 Forbidden**.

Não foi iniciado servidor local, gerada chave efêmera, alterado ambiente, promovido deployment ou feito commit/push. Não foi possível verificar que o artefato desse Preview coincide integralmente com o worktree atual.

### Banco atual — consultas independentes read-only

| Campo | SQL |
|---|---:|
| Total eventos | 8.164 |
| Acessos | 1.673 |
| Sessões únicas de acesso | 1.558 |
| Eventos de WhatsApp | 98 |
| Sessões com WhatsApp | 84 |
| Squeeze acessos / únicos | 1.341 / 1.259 |
| Squeeze WA eventos / sessões | 85 / 75 |
| Catálogo acessos / únicos | 332 / 303 |
| Lot views / sessões com lot_view | 6.030 / 250 |
| Vídeos / sessões vídeo | 157 / 51 |
| Catálogo WA eventos / sessões | 13 / 9 |
| Interesse eventos / sessões | 6 / 5 |

MIN: `2026-09-02T19:17:25.855036+00:00`; MAX: `2026-10-05T20:22:14.730986+00:00`.

Oráculos adicionais SQL (acessos/únicos/sessões clique): Facebook **789/727/49**, Instagram **701/666/27**, Direto **181/164/8**; Mobile **1330/1242/62**, Desktop **176/161/13**, Tablet **167/155/9**. Existem também origens `{{site_source_name}}` e `qa`, que não foram ocultadas/reclassificadas.

API dashboard e UI: não obtidas. **Convergência SQL = RPC autenticada = API = UI não certificada**. As duas RPCs administrativas foram chamadas com broker/hash inválidos e ambas rejeitaram com SQLSTATE **28000 unauthorized**, sem retornar dados. Isso não substitui testes com broker válido e sessão expirada.

### Bug encontrado e correção mínima

O parser aceitava datas inexistentes porque `Date.parse('2026-02-30T00:00:00Z')` normaliza a data. Essas strings chegariam ao PostgreSQL, que as rejeita, e o endpoint responderia erro backend em vez de erro de entrada.

- `src/lib/panel-data.ts`: valida o dia de calendário antes de aceitar timestamps de filtros/cursor, preservando timezone e precisão suportada.
- `scripts/test-panel-data.cjs`: regressões para 30/fevereiro, 29/fevereiro de ano não bissexto e 31/abril no cursor, além de aceitar 29/fevereiro bissexto.
- Evidência: teste novo falhou com `Missing expected exception` antes da alteração; passou depois.
- Nenhuma alteração de auth, SQL, layout, tracking ou migrações.
- A correção está **somente local**, sem novo Preview, pois o acesso Vercel segue bloqueado. Exige deploy Preview e reteste runtime antes de GO.

### Checks após a correção

| Check | Resultado |
|---|---|
| Typecheck | PASS |
| Build | PASS |
| Diff-check | PASS |
| Mock 5.101 + timezone + validação + paginação independente | PASS |
| npm audit --omit=dev (antes/depois) | BLOQUEADO: EAI_AGAIN registry.npmjs.org; não é resultado de zero vulnerabilidades |
| Lint global | 58 erros / 6 warnings, fora dos arquivos direcionados |
| ESLint direcionado, incluindo __root.tsx e teste | PASS |

### Cobertura e limitações finais

- Paginação no código: máximo 100, ordenação/cursor `(created_at,id)` descendente; mocks cobrem três páginas distintas sem nova chamada dashboard. Paginação real no Preview não executada.
- Filtros: validação/encaminhamento e timezone executados nos testes locais; UI e combinações no Preview não executadas.
- Login, replay, sessão, logout, rate limit e CSRF: implementação preservada, mas fluxo remoto não executado.
- Responsividade 320/375/390/768/1440, console/hydration/Recharts, network/loops/payload, timeline e detalhes de lotes: não executados no browser bloqueado.
- Smoke público squeeze/selector/machos/fêmeas/matrizes: não executado no Preview. Nenhuma alteração local no tracking/rotas públicas decorrente deste QA.
- `src/lib/panel-csv-server.ts`: **mantido**, usado de fato por events com `format=csv`, acionado por `panelExportUrl` na UI.
- Não foi carregado histórico para recalcular métricas. Não foram expostos secrets.

**Recomendação: NO-GO PARA PRODUÇÃO.** Necessário liberar acesso da integração ao time kauadev e execução do browser, obter audit online, publicar a correção mínima em Preview e concluir QA autenticado. O motivo não é regressão comprovada nos cards; é falta de comprovação E2E e correção runtime ainda não publicada/testada.
