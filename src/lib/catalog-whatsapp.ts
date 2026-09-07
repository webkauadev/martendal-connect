// Mensagens do WhatsApp exclusivas do catálogo (não altera a squeeze).
import { WHATSAPP_NUMBER } from "./squeeze-config";

export function buildCatalogWhatsAppUrl(
  _utmSource: string,
  lot?: { lotNumber: string; horseName: string } | null,
): string {
  const text = lot
    ? `Olá, Bárbara! Vi o Lote ${lot.lotNumber} — ${lot.horseName} no catálogo do Martendal Weekend 2026 e tenho interesse. Quero mais informações sobre este lote e também reservar minha mesa.`
    : "Olá, Bárbara! Estou vendo o catálogo do Martendal Weekend 2026 e gostaria de mais informações. Também quero reservar minha mesa.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
