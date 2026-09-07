# Martendal Weekend 2026

Aplicação oficial da campanha **Martendal Weekend 2026**, da Pecuária Martendal, em Vilhena/RO.

A aplicação concentra a landing page de mídia paga, o catálogo digital do leilão e um painel administrativo privado para análise de acessos, campanhas, lotes e intenções de contato.

## Produção

- Domínio: `https://pecuariamartendal.kauadev.net.br`
- Landing page: `/leilao-martendal-weekend-2026`
- Catálogo: `/catalago/leilao-martendal-weekend-2026`
- Painel interno: `/leads-panel`

## Arquitetura

```text
GitHub
  ↓
Vercel
  ↓
pecuariamartendal.kauadev.net.br
  ↓
Supabase (projeto próprio da aplicação)
```

O runtime de produção não depende de construtores visuais, brokers de autenticação ou hospedagem de terceiros além da Vercel e do Supabase.

## Stack

- React 19
- TypeScript
- TanStack Start / TanStack Router
- Vite
- Nitro
- Tailwind CSS
- Supabase PostgreSQL / Data API
- Vercel
- Meta Pixel

## Funcionalidades

### Landing page

- experiência mobile-first focada em conversão;
- CTA direto para WhatsApp;
- mensagem de reserva pré-preenchida;
- persistência de parâmetros de campanha;
- Meta Pixel e eventos de conversão;
- tracking interno não bloqueante.

### Catálogo Quarto de Milha

- páginas oficiais do catálogo renderizadas localmente em WebP;
- carregamento progressivo/lazy loading;
- navegação e busca por lote/animal;
- vídeos originais por lote;
- CTA contextual para WhatsApp;
- tracking por lote, vídeo e intenção de contato.

### Painel administrativo

- acesso por chave administrativa própria;
- senha armazenada somente como hash bcrypt no banco;
- tokens de sessão aleatórios armazenados apenas como hash;
- sessões com expiração;
- leitura do histórico somente por RPC protegida;
- filtros por período, experiência, origem, campanha, criativo, dispositivo e lote;
- métricas da squeeze e do catálogo;
- ranking e detalhamento de interesse por lote.

## Banco de dados e segurança

Backend oficial:

```text
Project Ref: xvmuxskticslavzdkczf
https://xvmuxskticslavzdkczf.supabase.co
```

A aplicação utiliza somente uma chave **publishable** no cliente. Nenhuma `service_role`, secret key ou senha administrativa é versionada.

A tabela pública de tracking utiliza Row Level Security e grants de privilégio mínimo. Os dados administrativos e credenciais vivem no schema `private`, fora da superfície pública da Data API. O painel não recebe acesso direto de `SELECT` à tabela de eventos; a leitura é mediada por RPC que exige token administrativo válido.

## Tracking interno

Eventos atualmente suportados:

```text
page_view
whatsapp_click
catalog_view
lot_view
lot_whatsapp_click
catalog_whatsapp_click
catalog_video_click
pdf_download
```

Campos de atribuição incluem, quando disponíveis:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
campaign_id
adset_id
ad_id
traffic_source
landing_path
device_type
lot_number
horse_name
```

O tracking não coleta nome, telefone, e-mail do visitante, fingerprint ou outros dados pessoais do lead.

## Meta Pixel

Pixel de produção:

```text
1419927983569630
```

O bootstrap do Pixel é tratado de forma independente do tracking interno. Alterações nessa inicialização devem ser testadas com cuidado para evitar duplicação ou bloqueio do carregamento de `fbevents.js`.

## Desenvolvimento

```bash
git clone https://github.com/webkauadev/martendal-connect.git
cd martendal-connect
npm install
npm run dev
```

Validações locais:

```bash
npm run typecheck
npm run lint
npm run build
```

A configuração do projeto Supabase está centralizada em `src/integrations/supabase/config.ts`. A chave usada ali é publishable e, portanto, foi projetada para uso em aplicações cliente; a segurança dos dados depende dos grants e das políticas RLS configuradas no banco.

## Deploy

A branch `main` é a referência de produção e é implantada automaticamente pela Vercel.

O arquivo `vercel.json` declara o framework TanStack Start. O domínio customizado é gerenciado por DNS externo e aponta diretamente para a Vercel.

## Autor

**Kauã Fernandes**  
Software Development · Systems · Integrations · Automation  
`https://kauadev.net.br`  
`contato@kauadev.net.br`
