import { CATALOGS, TRACKING_EVENTS } from "./catalog-tracking-contract";
import type { DashboardFilters, EventPage } from "./panel-auth";

export type Period = "today" | "yesterday" | "7d" | "all" | "custom";
const DAY = 86_400_000;
export function panelPeriodFilters(
  period: Period,
  from: string,
  to: string,
  now = new Date(),
): DashboardFilters {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Porto_Velho",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const midnight = Date.parse(`${date}T00:00:00-04:00`);
  const iso = (ms: number) => new Date(ms).toISOString();
  if (period === "today") return { start_at: iso(midnight) };
  if (period === "yesterday") return { start_at: iso(midnight - DAY), end_at: iso(midnight) };
  if (period === "7d") return { start_at: iso(midnight - 6 * DAY) };
  if (period === "custom")
    return {
      ...(from ? { start_at: iso(Date.parse(`${from}T00:00:00-04:00`)) } : {}),
      ...(to ? { end_at: iso(Date.parse(`${to}T00:00:00-04:00`) + DAY) } : {}),
    };
  return {};
}

export function panelLotLabel(key: string): string {
  const [catalogKey, ...number] = key.split(":");
  const catalog = Object.values(CATALOGS).find((c) => c.catalogKey === catalogKey);
  const lot = number.join(":");
  return `${catalog?.label ?? "Seleção de catálogos"} / ${lot === "-100" ? "Coberturas" : `Lote ${lot}`}`;
}

export class PanelInputError extends Error {}
const FILTER_KEYS = [
  "start_at",
  "end_at",
  "experience",
  "catalog_key",
  "source",
  "campaign",
  "term",
  "content",
  "event",
  "device",
  "lot",
  "search",
  "session_id",
] as const;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
function validTimestamp(value: string): boolean {
  if (!timestamp.test(value) || !Number.isFinite(Date.parse(value))) return false;
  // Date.parse normalizes impossible dates (e.g. February 30); PostgreSQL rejects them.
  const day = value.slice(0, 10);
  const calendarDate = new Date(`${day}T00:00:00Z`);
  return (
    Number.isFinite(calendarDate.getTime()) &&
    calendarDate.toISOString().slice(0, 10) === day &&
    Number(day.slice(0, 4)) > 0
  );
}
export function parsePanelQuery(
  params: URLSearchParams,
  events = false,
): {
  filters: DashboardFilters;
  cursor: EventPage["nextCursor"];
  pageSize: number;
  csv: boolean;
} {
  const allowed: readonly string[] = events
    ? [...FILTER_KEYS, "cursor_created_at", "cursor_id", "page_size", "format"]
    : FILTER_KEYS;
  for (const [key, value] of params) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1 || value.length > 200)
      throw new PanelInputError("Filtro inválido.");
  }
  const filters: DashboardFilters = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  for (const key of ["start_at", "end_at"] as const) {
    const value = filters[key];
    if (value && !validTimestamp(value)) throw new PanelInputError("Data inválida.");
  }
  if (
    filters.start_at &&
    filters.end_at &&
    Date.parse(filters.start_at) >= Date.parse(filters.end_at)
  )
    throw new PanelInputError("Intervalo inválido.");
  const enums: [string | undefined, readonly string[]][] = [
    [filters.experience, ["squeeze", "catalog"]],
    [filters.catalog_key, Object.keys(CATALOGS)],
    [filters.event, TRACKING_EVENTS],
    [filters.device, ["Mobile", "Tablet", "Desktop", "Unknown"]],
  ];
  if (enums.some(([value, options]) => value && !options.includes(value)))
    throw new PanelInputError("Filtro inválido.");
  const at = params.get("cursor_created_at");
  const id = params.get("cursor_id");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    (at === null) !== (id === null) ||
    (at !== null && !validTimestamp(at)) ||
    (id !== null && !uuid.test(id))
  )
    throw new PanelInputError("Cursor inválido.");
  const sizeText = params.get("page_size") ?? "100";
  const pageSize = Number(sizeText);
  if (!/^\d+$/.test(sizeText) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw new PanelInputError("Tamanho de página inválido.");
  const format = params.get("format");
  if (format !== null && format !== "csv") throw new PanelInputError("Formato inválido.");
  return {
    filters,
    cursor: at && id ? { created_at: at, id } : null,
    pageSize,
    csv: format === "csv",
  };
}
