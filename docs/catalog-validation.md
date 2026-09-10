# Validação dos catálogos — 10/09/2026

Implementação local, sem commit, push ou deploy.

## Auditoria inicial

- Branch `main`, HEAD `f73db0d`. `.npmrc` e `package-lock.json` já estavam não rastreados; foram preservados.
- O catálogo original, squeeze, painel e hardening de tracking existiam. Seletor, motor compartilhado, dados/assets de Fêmeas e testes estavam ausentes.
- Supabase oficial `xvmuxskticslavzdkczf`: migration `20260910021126_multi_catalog_tracking` já aplicada. O SQL foi recuperado de `supabase_migrations.schema_migrations` para o arquivo local da mesma versão. Nenhuma migration foi reaplicada e nenhuma alteração persistente foi feita no banco.

## PDF e assets

Fonte: `~/Downloads/Martendal Weekend - Catálogo Fêmeas Elite - 11 de Setembro.pdf` (19.067.574 bytes).

- 35 páginas, 1080 × 1920; 35 WebPs nessa resolução, qualidade 88, e OG 1200 × 630.
- Total dos 36 assets: 11.671.164 bytes, em `public/catalogo-femeas/`.
- 27 lotes, nomes e proprietários conferidos no índice e nas páginas dos animais.
- Lote 01: `REM1783M FIV GENETICA ADITIVA`, página 04.
- Lote 27: `B7902 DA S.NICE`, página 30.
- 27 URLs distintas de vídeo extraídas das annotations; o PDF repete o mesmo destino em três annotations por lote. URLs preservadas como publicadas, inclusive protocolo HTTP.
- Proprietários preservados conforme a página do lote; diferenças de espaços no índice foram conferidas explicitamente. Nenhum OCR.
- Assets de Machos não foram modificados.

## Rotas e comportamento

- `/catalago/leilao-martendal-weekend-2026`: seletor.
- `/catalago/leilao-martendal-weekend-2026/machos`: catálogo original.
- `/catalago/leilao-martendal-weekend-2026/femeas`: Fêmeas Elite.
- `/leilao-martendal-weekend-2026` e `/leads-panel`: preservadas.

Um `CatalogPage` recebe configurações/dados separados. Busca por nome, número ou proprietário; seleção fecha resultados antes do scroll. “Ver lotes” vai ao primeiro lote. Movimento reduzido é respeitado. Observer com faixa visual e lazy loading preservados.

WhatsApp continua em `554391463994`: mensagens de Machos preservadas; Fêmeas usa “catálogo Fêmeas Elite” nas mensagens globais e de interesse. Todas incluem reserva de mesa.

SEO: canonicals específicos, OG/Twitter e título de Fêmeas `Catálogo Fêmeas Elite | Martendal Weekend 2026`.

## Tracking e banco

Pixel `1419927983569630`, bootstrap original intacto. Um loader/init/PageView, inclusive quando `fbq` já existe. Eventos `ViewContent`, `Contact`, `CatalogWhatsAppClick`, `CatalogLotInterest`, `CatalogVideoClick` e `CatalogSelected` recebem contexto correto.

Tracking interno: oito eventos originais e `catalog_selector_view`/`catalog_selected`; UTMs e IDs de campanha preservados. Seleção mantém toda a query string. Envio por beacon/keepalive sem aguardar navegação. Deduplicação frontend por sessão + catálogo + lote, com sessionStorage e memória.

API: quatro caminhos explícitos, matriz de eventos por rota, limite de 16 KiB, device types restritos, contexto obrigatório de lote/vídeo e resposta 202 para `23505` em lot_view. Metadados derivados da rota na API e na trigger.

Banco auditado e testado:

- `catalog_key` restrito a NULL, `machos`, `femeas`.
- Índice único parcial de lot_view: `(session_id, catalog_name, lot_number)`.
- Trigger somente INSERT, SECURITY INVOKER, search_path vazio e sem EXECUTE para anon.
- RLS ativo; anon sem SELECT, UPDATE, DELETE ou INSERT amplo; INSERT apenas nas colunas autorizadas.
- Cinco RPCs administrativas, ACLs, tabelas privadas, credenciais e sessões não alteradas.
- 57 casos da matriz executados como anon, metadados enviados incorretamente corrigidos pela trigger, deduplicação entre catálogos validada. Tudo dentro de BEGIN/ROLLBACK.
- Zero registros `multi-catalog-test-*` persistidos.
- Fotografia histórica: 5.560 registros até `2026-09-10 11:59:02.883279+00`, checksum MD5 ordenado por id e excluindo catalog_key: `4ceda6e8f1514dc5e662affa9c67bff9`. Contagem e checksum idênticos após os testes. Nenhum backfill ou recategorização.
- Advisor: cinco avisos esperados de RPCs administrativas SECURITY DEFINER acessíveis por anon; três avisos informativos de índices sem uso. Nenhum desses objetos foi alterado.

Painel: ranking, métricas, filtros, deduplicação, vídeos, CSV e detalhes reconhecem catálogo + lote. Histórico da rota antiga continua Machos. Massa sintética com os dois Lotes 01 validou detalhes separados e união do histórico antigo ao catálogo Machos.

## Testes e reprodução

Ferramentas Python instaladas somente em `/tmp/catalog-tools`: PyMuPDF, Pillow, Playwright e Ruff. Nenhuma dependência runtime adicionada.

```bash
/tmp/catalog-tools/bin/python scripts/process-catalog-femeas.py '/caminho/para/catalogo.pdf'
/tmp/catalog-tools/bin/python scripts/validate-catalog-femeas.py '/caminho/para/catalogo.pdf'
node scripts/test-tracking-contract.cjs
/tmp/catalog-tools/bin/python scripts/test-catalog-browser.py --url http://127.0.0.1:3001
/tmp/catalog-tools/bin/python scripts/test-panel-catalog-browser.py --url http://127.0.0.1:3001
```

SQL: `scripts/test-multi-catalog-tracking.sql`, executado como postgres; o próprio script assume anon na matriz e termina em ROLLBACK.

- Browser: seletor, Machos e Fêmeas em 320, 375, 390, 768 e 1440 px; busca, navegação, scroll, lote atual, CTAs, vídeos, mensagens, query string, Pixel, tracking e ausência de overflow passaram.
- Mesma sessão: Machos/01 e Fêmeas/01 registram separadamente; reload de Fêmeas não repete lot_view.
- Squeeze: eventos originais page_view/whatsapp_click e bootstrap Pixel passaram.
- Painel: cinco larguras passaram usando RPCs sintéticas, sem credencial real.
- Browser intercepta tracking, WhatsApp, vídeos e requisições externas; não valida reprodução remota do YouTube nem entrega real de eventos ao Meta.
- PDF validator, API e SQL passaram.
- `npm run typecheck`: zero erros.
- ESLint dos arquivos TS/TSX/CJS alterados/criados: zero erros.
- Ruff dos quatro scripts Python: zero erros.
- `npm run lint`: 58 erros e 6 warnings em arquivos não alterados. HEAD isolado: 243 erros e 6 warnings; dívida preexistente, inclusive `prefer-spread` no bootstrap preservado.
- `npm run build`: passou.
- `git diff --check`: passou.
