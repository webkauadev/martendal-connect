// Eventos Meta Pixel EXCLUSIVOS do catálogo.
// Reutiliza o bootstrap existente (ensureMetaPixel) — não cria novo pixel,
// não refatora init/PageView, não duplica nada.
import { CATALOG_NAME } from "./catalog-data";
import { EVENT_NAME, normalizeTrafficSource, readUtms } from "./squeeze-config";

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as Window & { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

function baseParams() {
  const utms = readUtms();
  return {
    utms,
    traffic_source: normalizeTrafficSource(utms.utm_source),
  };
}

let catalogViewContentSent = false;

export function trackCatalogViewContentOnce(): void {
  if (catalogViewContentSent) return;
  const fbq = getFbq();
  if (!fbq) return;
  catalogViewContentSent = true;
  fbq("track", "ViewContent", {
    content_name: "Catálogo Quarto de Milha - Martendal Weekend 2026",
    content_category: "Catálogo",
    content_type: "event",
  });
}

export function trackCatalogWhatsAppClick(
  currentLot: string | null,
  currentHorse: string | null,
): void {
  const fbq = getFbq();
  if (!fbq) return;
  const { utms, traffic_source } = baseParams();

  fbq("track", "Contact", {
    content_name: "Catálogo Quarto de Milha - Martendal Weekend 2026",
    content_category: "Catálogo",
    contact_method: "WhatsApp",
    event_name: EVENT_NAME,
    event_location: "Vilhena-RO",
    traffic_source,
  });

  fbq("trackCustom", "CatalogWhatsAppClick", {
    catalog_name: CATALOG_NAME,
    current_lot: currentLot ?? "none",
    current_horse: currentHorse ?? "none",
    traffic_source,
    ...utms,
  });
}

export function trackCatalogLotInterest(lotNumber: string, horseName: string): void {
  const fbq = getFbq();
  if (!fbq) return;
  const { utms, traffic_source } = baseParams();

  fbq("track", "Contact", {
    content_name: `Lote ${lotNumber} - ${horseName}`,
    content_category: "Catálogo",
    contact_method: "WhatsApp",
    event_name: EVENT_NAME,
    event_location: "Vilhena-RO",
    traffic_source,
  });

  fbq("trackCustom", "CatalogLotInterest", {
    lot_number: lotNumber,
    horse_name: horseName,
    catalog_name: CATALOG_NAME,
    traffic_source,
    ...utms,
  });
}

export function trackCatalogVideoClick(
  lotNumber: string,
  horseName: string,
  videoUrl: string,
): void {
  const fbq = getFbq();
  if (!fbq) return;
  const { utms, traffic_source } = baseParams();

  fbq("trackCustom", "CatalogVideoClick", {
    lot_number: lotNumber,
    horse_name: horseName,
    video_url: videoUrl,
    traffic_source,
    ...utms,
  });
}
