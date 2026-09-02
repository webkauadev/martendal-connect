import { EVENT_NAME, normalizeTrafficSource, readUtms } from "./squeeze-config";

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: unknown }).fbq;
  return typeof fbq === "function" ? (fbq as Fbq) : null;
}

let viewContentSent = false;

export function trackViewContentOnce(): void {
  if (viewContentSent) return;
  viewContentSent = true;
  const fbq = getFbq();
  if (!fbq) return;
  fbq("track", "ViewContent", {
    content_name: `${EVENT_NAME} - Reserva de Mesa`,
    content_category: "Reserva de Mesa",
    content_type: "event",
  });
}

export function trackWhatsAppReservation(): void {
  const utms = readUtms();
  const trafficSource = normalizeTrafficSource(utms.utm_source);

  const fbq = getFbq();
  if (fbq) {
    fbq("track", "Contact", {
      content_name: "Reserva de Mesa - Martendal Weekend 2026",
      content_category: "Leilão",
      contact_method: "WhatsApp",
      event_name: EVENT_NAME,
      event_location: "Vilhena-RO",
      traffic_source: trafficSource,
    });

    fbq("trackCustom", "WhatsAppReservationClick", {
      event_name: EVENT_NAME,
      action: "reservar_mesa",
      contact_name: "Bárbara Silva",
      contact_method: "WhatsApp",
      traffic_source: trafficSource,
      ...utms,
    });
  }

  const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({
      event: "whatsapp_reserva_mesa",
      event_category: "WhatsApp",
      event_label: "Reserva de Mesa",
      utm_source: utms.utm_source,
    });
  }
}
