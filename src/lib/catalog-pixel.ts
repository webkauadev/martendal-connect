// Eventos Meta Pixel EXCLUSIVOS do catálogo.
// Reutiliza o bootstrap existente (ensureMetaPixel) — não cria novo pixel,
// não refatora init/PageView, não duplica nada.
import { CATALOGS, type CatalogContext } from "./catalog-tracking-contract";
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

const catalogViewContentSent = new Set<string>();

export function trackCatalogViewContentOnce(catalog: CatalogContext = CATALOGS.machos): void {
  if (catalogViewContentSent.has(catalog.catalogKey)) return;
  const fbq = getFbq();
  if (!fbq) return;
  catalogViewContentSent.add(catalog.catalogKey);
  fbq("track", "ViewContent", {
    ...catalogParams(catalog),
    content_name: `Catálogo ${catalog.catalogName}`,
    content_category: "Catálogo",
    content_type: "event",
  });
}

export function trackCatalogWhatsAppClick(
  currentLot: string | null,
  currentHorse: string | null,
  catalog: CatalogContext = CATALOGS.machos,
): void {
  const fbq = getFbq();
  if (!fbq) return;
  const { utms, traffic_source } = baseParams();

  fbq("track", "Contact", {
    ...catalogParams(catalog),
    content_name: `Catálogo ${catalog.catalogName}`,
    content_category: "Catálogo",
    contact_method: "WhatsApp",
    event_name: EVENT_NAME,
    event_location: "Vilhena-RO",
    traffic_source,
  });

  fbq("trackCustom", "CatalogWhatsAppClick", {
    ...catalogParams(catalog),

    current_lot: currentLot ?? "none",
    current_horse: currentHorse ?? "none",
    traffic_source,
    ...utms,
  });
}

export function trackCatalogLotInterest(
  lotNumber: string,
  horseName: string,
  catalog: CatalogContext = CATALOGS.machos,
): void {
  const fbq = getFbq();
  if (!fbq) return;
  const { utms, traffic_source } = baseParams();

  fbq("track", "Contact", {
    ...catalogParams(catalog),
    content_name: `Lote ${lotNumber} - ${horseName}`,
    content_category: "Catálogo",
    contact_method: "WhatsApp",
    event_name: EVENT_NAME,
    event_location: "Vilhena-RO",
    traffic_source,
  });

  fbq("trackCustom", "CatalogLotInterest", {
    ...catalogParams(catalog),
    lot_number: lotNumber,
    horse_name: horseName,

    traffic_source,
    ...utms,
  });
}

export function trackCatalogVideoClick(
  lotNumber: string,
  horseName: string,
  videoUrl: string,
  catalog: CatalogContext = CATALOGS.machos,
): void {
  const fbq = getFbq();
  if (!fbq) return;
  const { utms, traffic_source } = baseParams();

  fbq("trackCustom", "CatalogVideoClick", {
    ...catalogParams(catalog),
    lot_number: lotNumber,
    horse_name: horseName,
    video_url: videoUrl,
    traffic_source,
    ...utms,
  });
}

function catalogParams(catalog: CatalogContext) {
  const { utms, traffic_source } = baseParams();
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  return {
    ...utms,
    traffic_source,
    catalog_name: catalog.catalogName,
    catalog_key: catalog.catalogKey,
    campaign_id: params.get("campaign_id"),
    adset_id: params.get("adset_id"),
    ad_id: params.get("ad_id"),
  };
}
export function trackCatalogSelected(catalog: CatalogContext): void {
  getFbq()?.("trackCustom", "CatalogSelected", catalogParams(catalog));
}
