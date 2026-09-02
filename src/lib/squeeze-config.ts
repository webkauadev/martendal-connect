// ============================================================
// CONFIGURAÇÃO CENTRAL DA SQUEEZE PAGE
// ============================================================

export const EVENT_NAME = "Leilão Martendal Weekend 2026";
export const EVENT_DATE = "11 a 13 de setembro";
export const EVENT_LOCATION = "Vilhena • RO";
export const CONTACT_NAME = "Bárbara Silva";

// Formato: 55 + DDD + número (somente dígitos).
// Número confirmado pelo cliente: (43) 91463-994.
export const WHATSAPP_NUMBER = "554391463994";

export const META_PIXEL_ID = "1419927983569630";

export type Utms = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
};

export function readUtms(): Utms {
  const empty: Utms = {
    utm_source: "unknown",
    utm_medium: "unknown",
    utm_campaign: "unknown",
    utm_content: "unknown",
    utm_term: "unknown",
  };
  if (typeof window === "undefined") return empty;
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "unknown",
    utm_medium: params.get("utm_medium") || "unknown",
    utm_campaign: params.get("utm_campaign") || "unknown",
    utm_content: params.get("utm_content") || "unknown",
    utm_term: params.get("utm_term") || "unknown",
  };
}

export function normalizeTrafficSource(utmSource: string): string {
  const s = utmSource.trim().toLowerCase();
  if (s === "instagram" || s === "ig") return "Instagram";
  if (s === "facebook" || s === "fb") return "Facebook";
  if (s === "meta") return "Meta";
  return "Direct/Unknown";
}

export function buildWhatsAppMessage(utmSource: string): string {
  const source = normalizeTrafficSource(utmSource);
  const origin =
    source === "Instagram"
      ? "Vim pelo Instagram."
      : source === "Facebook"
        ? "Vim pelo Facebook."
        : "Vim pelo anúncio.";
  return `Olá, Bárbara! Quero reservar minha mesa para o ${EVENT_NAME}. ${origin}`;
}

export function buildWhatsAppUrl(utmSource: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(utmSource),
  )}`;
}
