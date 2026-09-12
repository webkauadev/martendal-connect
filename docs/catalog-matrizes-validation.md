# Matrizes — implementação e evidências

## Fonte e conteúdo

PDF oficial: `Martendal Weekend - Catálogo Matrizes - 13 de Setembro.pdf`.
SHA-256: `9366e1366b823a8456aabb00d41d2acf04263bbbc582680a9eed9853967fc7af`.

Metadata, texto incorporado, annotations e inspeção visual das 174 páginas foram usados. As oito folhas de contato da auditoria cobrem o PDF inteiro. As páginas finais convertidas p01, p02, p03, p100, p117, p169, p170, p173 e p174 e a OG também foram inspecionadas visualmente.

- 174 páginas WebP a 1080 × 1920, mais uma OG baseada na capa oficial, sem corte, em canvas 1200 × 630.
- p01: capa; p02: condições; p03–p169: lotes; p170–p173: regulamento; p174: encerramento visual/patrocinadores.
- 81 lotes comerciais e 81 vídeos distintos, extraídos das URIs reais das annotations e normalizados para HTTPS.
- 167 nomes de animais: 30 lotes individuais, 24 duplos, 20 triplos, 6 quádruplos e 1 quíntuplo.
- Primeiro lote: 100/p03. Último: 185/p168+p169.
- Ausências confirmadas: 136, 152, 169, 174, 177.

Cada lote comercial tem um único item, `lotNumber`, `pages[]`, `animalNames[]`, proprietário e vídeo. `animalName` usa o primeiro nome oficial e a quantidade de outros animais para manter os textos compactos. A busca consulta todos os nomes originais, inclusive B/C/D/E. Nenhuma página de lote fica órfã ou pertence a dois lotes.

## Aplicação

Nova rota: `/catalago/leilao-martendal-weekend-2026/matrizes`, reutilizando `CatalogPage` e `catalogHead`. Canonical, OG e Twitter usam a configuração Matrizes. O seletor renderiza os três catálogos a partir de `CATALOGS`, incluindo apresentação, datas e preservação integral da query string.

O contrato deriva suas keys de `CATALOGS`. Os helpers existentes de Pixel e tracking interno recebem o contexto Matrizes. A API rejeita a combinação de rota e key divergentes. O WhatsApp usa o mesmo número e identifica “catálogo de Matrizes”. O painel deriva nomes/labels da configuração e permite filtrar Matrizes sem misturar números iguais de catálogos diferentes.

Não houve mudanças na autenticação, squeeze, Pixel ID, número WhatsApp, assets antigos ou migrations históricas. Não houve commit, push ou deploy. `.npmrc` e `package-lock.json` locais foram preservados.

## Banco

Migration criada pelo Supabase CLI e aplicada ao projeto conectado: `20260911154720_add_matrizes_catalog_tracking.sql`. O timestamp local corresponde à versão registrada pelo serviço ao aplicar a migration.

Altera apenas os dois checks de catálogo/evento e a função de classificação do trigger. Não contém backfill, UPDATE, DELETE ou alteração de dados históricos.

Antes da aplicação permanente, a lógica foi executada em transação com 76 casos, testes de normalização, deduplicação e permissões anon, seguidos de ROLLBACK. Os dados sintéticos foram revertidos. O banco normaliza deterministicamente o contexto a partir da rota; a API rejeita divergências antes da inserção.

Evidências completas: [matrizes-database-validation.json](./matrizes-database-validation.json).

| Momento | Registros históricos | Checksum |
| --- | ---: | --- |
| Antes | 5965 | `b1f9146ab966a78a5df2a7181c92c9e5` |
| Após ROLLBACK | 5965 | `b1f9146ab966a78a5df2a7181c92c9e5` |
| Após aplicação | 5965 | `b1f9146ab966a78a5df2a7181c92c9e5` |

O checksum agrega o JSON completo das linhas por ID. Comparações posteriores usam o corte temporal da captura inicial. Índices, grants, grants de colunas, policies, RLS, trigger e privilégios da função permaneceram iguais. Zero registros sintéticos restantes. O índice único existente continua incluindo sessão, catálogo e lote.

## Reprodução

Dependências Python isoladas: PyMuPDF 1.26.7, Pillow 11.3.0 e Playwright 1.55.0. O validator também usa Poppler e TypeScript/Prettier já disponíveis no projeto.

```sh
/tmp/matrizes-venv/bin/python scripts/process-catalog-matrizes.py '/caminho/Martendal Weekend - Catálogo Matrizes - 13 de Setembro.pdf'
/tmp/matrizes-venv/bin/python scripts/validate-catalog-matrizes.py '/caminho/Martendal Weekend - Catálogo Matrizes - 13 de Setembro.pdf'
node scripts/test-tracking-contract.cjs
node scripts/test-catalog-dedup.cjs
/tmp/matrizes-venv/bin/python scripts/test-catalog-browser.py --url http://127.0.0.1:3002 --browser /caminho/chrome
/tmp/matrizes-venv/bin/python scripts/test-panel-catalog-browser.py --url http://127.0.0.1:3002 --browser /caminho/chrome
npm run typecheck
npm run lint
npm run build
git diff --check
```

`scripts/test-matrizes-tracking.sql` contém BEGIN/ROLLBACK para reproduzir a matriz no banco com o contrato instalado; não deixa registros sintéticos.

## Limites dos testes

Resultados executados:

| Verificação | Resultado |
| --- | --- |
| Validator PDF/dados/assets | PASS: 174 páginas, OG, 81 lotes/vídeos, 167 nomes |
| Contrato/API/Pixel bootstrap | PASS: 76 casos, uma inicialização e um PageView |
| Deduplicação em sessão | PASS: três catálogos com lote 102; repetição, reload e nova sessão |
| Browser seletor + Machos + Fêmeas + Matrizes | PASS em 320, 375, 390, 768 e 1440 px |
| Browser Matrizes | PASS: busca B/C/D/E, grupos de 1–5 páginas, 174 URLs e decode das amostras finais, CTAs, WhatsApp, UTMs, eventos, Pixel, scroll e recarga |
| Browser squeeze | PASS em 390 px: page_view/whatsapp_click e único init/PageView |
| Conferência adicional de vídeo em 390 px | PASS nos três catálogos: URL do link igual à URL do evento interno e Pixel, com catálogo e lote corretos |
| Browser painel com APIs simuladas | PASS em 320, 375, 390, 768 e 1440 px; mesmos números separados e histórico Machos preservado |
| Typecheck | PASS |
| Lint direcionado a todos os JS/TS alterados/criados | PASS |
| Lint global | 58 erros e 6 warnings preexistentes, fora do escopo |
| Build | PASS |
| git diff --check | PASS |

Nas cinco larguras, o browser também confirmou ausência de overflow horizontal e de erros de página/console ou respostas locais 4xx/5xx, considerando a simulação da integração de hospedagem descrita abaixo. O teste de deduplicação alterna A/B/A/B do lote 102 e recarrega mantendo sessionStorage: apenas um lot_view permanece. O teste do banco confirma que três catálogos podem registrar o mesmo lote 102 na mesma sessão sem colisão.

Os testes browser interceptam tracking, Pixel e destinos externos: verificam os payloads e interações sem enviar leads/eventos reais ao Meta ou WhatsApp. O painel usa respostas simuladas dos endpoints atuais; não exercita uma credencial real nem muda a autenticação. A entrega real das mensagens e o recebimento remoto pelo Meta não foram testados.

A matriz final usa o build de produção servido localmente. O recurso `/_vercel/insights/script.js` é simulado no teste, pois o servidor Node local não fornece esse script da hospedagem. Nenhuma configuração Vercel foi alterada. Tentativas anteriores no servidor de desenvolvimento sofreram timeouts; seus resultados incompletos não contam como aprovação da matriz final.

O lint global apresenta dívida preexistente: 58 erros e 6 warnings em arquivos fora do escopo. O lint direcionado aos arquivos JavaScript/TypeScript alterados passa. Os arquivos de origem da dívida não foram refatorados.
