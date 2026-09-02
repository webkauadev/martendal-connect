# Squeeze page Martendal Weekend 2026 + Meta Pixel

Uma única tela mobile-first, sem scroll, com um objetivo: clique no WhatsApp da Bárbara.

## Tela (rota `/`)

Ordem visual, tudo dentro de 100dvh, `max-width: 480px`, centralizado:

```text
        [ logo Martendal ]

      LEILÃO MARTENDAL
        WEEKEND 2026
      ─── linha dourada fina ───
      11 A 13 DE SETEMBRO
          VILHENA • RO

  Garanta sua mesa para o
     Martendal Weekend.

  [  ⬤ RESERVAR MINHA MESA  ]

 Fale diretamente com Bárbara Silva
        pelo WhatsApp.
```

- Fundo preto/grafite feito só com CSS: radial-gradient verde muito escuro + radial âmbar muito sutil + vinheta. Zero imagem de fundo.
- Logo enviada é usada como está (proporção preservada, ~120px, com dimensões definidas para não causar CLS).
- Tipografia system stack (Inter/system-ui/Arial). Nenhuma fonte externa.
- Headline branca, extra-bold, uppercase; datas com letter-spacing.
- Botão: verde WhatsApp de alto contraste, ~90% da largura, altura 60px, radius 16px, SVG inline do WhatsApp, sombra verde suave, `scale(0.98)` no toque, pulso CSS de 2.2s (transform + opacity), desativado em `prefers-reduced-motion`.
- Botão posicionado na metade inferior da tela; espaçamentos com `clamp()` para telas baixas. Safe areas respeitadas. Sem scroll horizontal nunca.
- Desktop: mesmo conteúdo centralizado em 480px.

## WhatsApp

Constantes no topo de um único arquivo de config:

```text
EVENT_NAME      = "Leilão Martendal Weekend 2026"
EVENT_DATE      = "11 a 13 de setembro"
EVENT_LOCATION  = "Vilhena • RO"
CONTACT_NAME    = "Bárbara Silva"
WHATSAPP_NUMBER = "554391463994"   // VALIDAR ANTES DE PUBLICAR
```

Atenção: o número informado tem 8 dígitos após o DDD (`91463-994`). Celulares brasileiros têm 9. Vou deixar `554391463994` na constante com um comentário de validação bem visível; me passe o dígito faltante e eu ajusto em um segundo.

Link: `https://wa.me/{NUMBER}?text={mensagem codificada}`.

Mensagem conforme `utm_source`:
- `instagram` / `ig` → "... Vim pelo Instagram."
- `facebook` / `fb` → "... Vim pelo Facebook."
- `meta`, ausente ou desconhecido → "... Vim pelo anúncio."

Sempre a palavra "reservar". UTMs (`source, medium, campaign, content, term`) lidas com `URLSearchParams` nativo, nunca bloqueando a conversão se faltarem.

## Meta Pixel (1419927983569630)

- Snippet oficial assíncrono inicializado **uma única vez** globalmente no documento, com o `<noscript>` no body.
- `PageView` e `ViewContent` (`content_name: 'Leilão Martendal Weekend 2026 - Reserva de Mesa'`, `content_category: 'Reserva de Mesa'`, `content_type: 'event'`) uma única vez por carregamento — protegidos contra re-render do React.
- No clique, uma função central `trackWhatsAppReservation()` dispara, em ordem, `Contact` e `trackCustom('WhatsAppReservationClick')` com `traffic_source` normalizado (Instagram / Facebook / Meta / Direct-Unknown) e as 5 UTMs.
- Guardas `if (typeof window.fbq === 'function')`; um único handler no botão; sem delay, sem loading, sem confirmação — o WhatsApp abre imediatamente mesmo com o pixel bloqueado.
- Nada de GA4, GTM, SDKs ou libs de analytics. `dataLayer.push` opcional já previsto, só se existir.

## SEO / head

- title: `Reserve sua Mesa | Leilão Martendal Weekend 2026`
- description e og:title/og:description conforme especificado, `theme-color` escuro, viewport correta. Sem og:image inventada.

## Detalhes técnicos

- Rota única: reescrita de `src/routes/index.tsx` (substitui o placeholder do template).
- Logo enviada publicada via Lovable Assets (ponteiro `.asset.json`), sem binário no repo.
- Pixel injetado via `scripts` no `head()`/`__root.tsx` da stack TanStack Start, o mais cedo possível e assíncrono.
- CSS no `src/styles.css` com tokens do design system; zero dependência nova instalada.
- Verificação final em 360x640, 375x667, 390x844 e 430x932 com screenshots, corrigindo qualquer overflow ou CTA escondido.
