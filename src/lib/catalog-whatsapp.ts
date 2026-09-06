// Mensagens do WhatsApp exclusivas do catálogo (não altera a squeeze).
import { EVENT_NAME, normalizeTrafficSource, WHATSAPP_NUMBER } from "./squeeze-config";

function originPhrase(utmSource: string): string {
  const source = normalizeTrafficSource(utmSource);
  if (source === "Instagram") return "Vim pelo Instagram.";
  if (source === "Facebook") return "Vim pelo Facebook.";
  if (source === "Meta") return "Vim pelo anúncio.";
  return "Vim pelo catálogo digital.";
}

export function buildCatalogWhatsAppUrl(
  utmSource: string,
  lot?: { lotNumber: string; horseName: string } | null,
): string {
  const origin = originPhrase(utmSource);
  const text = lot
    ? `Olá, Bárbara! Quero falar sobre o LOTE ${lot.lotNumber} - ${lot.horseName}, do ${EVENT_NAME}. ${origin}`
    : `Olá, Bárbara! Estou vendo o catálogo do ${EVENT_NAME} e quero mais informações. ${origin}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
