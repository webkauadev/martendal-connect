export const SQUEEZE_PATH = "/leilao-martendal-weekend-2026";
export const CATALOG_BASE_PATH = "/catalago/leilao-martendal-weekend-2026";
export const CATALOGS = {
  machos: {
    catalogKey: "machos",
    catalogName: "Quarto de Milha - Martendal Weekend 2026",
    path: `${CATALOG_BASE_PATH}/machos`,
    label: "Machos",
    heading: "Quarto de Milha",
    date: "12 de setembro",
    whatsappContext: "catálogo do",
  },
  femeas: {
    catalogKey: "femeas",
    catalogName: "Fêmeas Elite - Martendal Weekend 2026",
    path: `${CATALOG_BASE_PATH}/femeas`,
    label: "Fêmeas Elite",
    heading: "Fêmeas Elite",
    date: "11 de setembro",
    whatsappContext: "catálogo Fêmeas Elite do",
  },
  matrizes: {
    catalogKey: "matrizes",
    catalogName: "Matrizes - Martendal Weekend 2026",
    path: `${CATALOG_BASE_PATH}/matrizes`,
    label: "Matrizes",
    heading: "Matrizes",
    date: "13 de setembro",
    whatsappContext: "catálogo de Matrizes do",
  },
} as const;
export type CatalogKey = keyof typeof CATALOGS;
export type CatalogContext = (typeof CATALOGS)[CatalogKey];
export function isCatalogKey(value: unknown): value is CatalogKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CATALOGS, value);
}
export function catalogForPath(path: string): CatalogContext | null {
  return Object.values(CATALOGS).find((catalog) => catalog.path === path) ?? null;
}
export const CATALOG_EVENTS = [
  "catalog_view",
  "lot_view",
  "lot_whatsapp_click",
  "catalog_whatsapp_click",
  "catalog_video_click",
  "pdf_download",
] as const;
export const TRACKING_EVENTS = [
  "page_view",
  "whatsapp_click",
  ...CATALOG_EVENTS,
  "catalog_selector_view",
  "catalog_selected",
] as const;
export function eventAllowedAtPath(event: string, path: string): boolean {
  if (path === SQUEEZE_PATH) return event === "page_view" || event === "whatsapp_click";
  if (path === CATALOG_BASE_PATH)
    return event === "catalog_selector_view" || event === "catalog_selected";
  return catalogForPath(path) !== null && CATALOG_EVENTS.some((allowed) => allowed === event);
}
