# Corrigir carregamento real do Meta Pixel

## Implementação
- Manter um único snippet oficial do Meta Pixel no shell HTML global da aplicação, com o loader real de `fbevents.js`, `init` e `PageView` uma vez.
- Remover o bootstrap alternativo/customizado que recria `window.fbq`; deixar o módulo de tracking apenas consumir o `fbq` oficial para `ViewContent`, `Contact` e `WhatsAppReservationClick`.
- Preservar integralmente a lógica de UTMs, o link e a abertura imediata do WhatsApp, além do fallback `noscript` válido no `<body>`.

## Validação técnica
- Recarregar a rota em navegador limpo e confirmar a tag `script[src*="connect.facebook.net"]`, o recurso `fbevents.js`, as chamadas a `facebook.com/tr`, a contagem única dos quatro eventos e ausência de erros/CSP impeditiva.
- Repetir com o domínio do Facebook bloqueado e confirmar que o WhatsApp continua abrindo normalmente.

## Fora de escopo
- Nenhuma alteração visual, de copy, CSS, responsividade, logo, animação ou mensagem do WhatsApp.
