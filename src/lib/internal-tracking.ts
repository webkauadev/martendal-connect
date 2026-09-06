// Camada interna de mensuração (independente do Meta Pixel).
// Nunca bloqueia a renderização nem a abertura do WhatsApp.

const SESSION_KEY = "martendal_session_id";
const PAGE_VIEW_FLAG = "__martendalPageViewSent";
const ENDPOINT = "/api/public/track";

export type InternalEventType =
  | "page_view"
  | "whatsapp_click"
  | "catalog_view"
  | "lot_view"
  | "lot_whatsapp_click"
  | "catalog_whatsapp_click"
  | "catalog_video_click"
  | "pdf_download";

type TrackingPayload = {
  event_type: InternalEventType;
  session_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  ad_id: string | null;
  traffic_source: string;
  referrer: string | null;
  landing_path: string;
  device_type: "Mobile" | "Tablet" | "Desktop" | "Unknown";
  lot_number?: string | null;
  horse_name?: string | null;
  video_url?: string | null;
  catalog_name?: string | null;
};

const CATALOG_PREFIX = "/catalago/";
const CATALOG_LABEL = "Quarto de Milha - Martendal Weekend 2026";


export type LotContext = {
  lot_number?: string | null;
  horse_name?: string | null;
  video_url?: string | null;
};

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = uuid();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return uuid();
  }
}

function normalizeSource(utmSource: string | null, referrer: string | null): string {
  const s = (utmSource || "").trim().toLowerCase();
  if (s === "ig" || s === "instagram") return "Instagram";
  if (s === "fb" || s === "facebook") return "Facebook";
  if (s === "meta") return "Meta";
  if (!s) {
    const r = (referrer || "").toLowerCase();
    if (r.includes("instagram")) return "Instagram";
    if (r.includes("facebook") || r.includes("fb.")) return "Facebook";
  }
  return s ? s : "Direto / Desconhecido";
}

function detectDevice(): TrackingPayload["device_type"] {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent || "";
  if (!ua) return "Unknown";
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function buildPayload(eventType: TrackingPayload["event_type"]): TrackingPayload | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const get = (key: string) => {
    const value = params.get(key);
    return value && value.trim() ? value.trim().slice(0, 300) : null;
  };
  const referrer = document.referrer ? document.referrer.slice(0, 300) : null;
  const utmSource = get("utm_source");
  const path = window.location.pathname.slice(0, 200);

  return {
    event_type: eventType,
    session_id: getSessionId(),
    utm_source: utmSource,
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_content: get("utm_content"),
    utm_term: get("utm_term"),
    campaign_id: get("campaign_id"),
    adset_id: get("adset_id"),
    ad_id: get("ad_id"),
    traffic_source: normalizeSource(utmSource, referrer),
    referrer,
    landing_path: path,
    device_type: detectDevice(),
    catalog_name: path.startsWith(CATALOG_PREFIX) ? CATALOG_LABEL : null,
  };

}

function send(payload: TrackingPayload): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
  } catch {
    /* ignore */
  }
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export function trackInternalPageViewOnce(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { [PAGE_VIEW_FLAG]?: boolean };
  if (w[PAGE_VIEW_FLAG]) return;
  w[PAGE_VIEW_FLAG] = true;
  const payload = buildPayload("page_view");
  if (payload) send(payload);
}

export function trackInternalWhatsAppClick(): void {
  const payload = buildPayload("whatsapp_click");
  if (payload) send(payload);
}

// Camada interna do catálogo: dispara e retorna imediatamente (nunca aguarda rede).
export function trackInternalEvent(eventType: InternalEventType, context: LotContext = {}): void {
  const payload = buildPayload(eventType);
  if (!payload) return;
  send({
    ...payload,
    lot_number: context.lot_number ?? null,
    horse_name: context.horse_name ?? null,
    video_url: context.video_url ?? null,
  });
}

const lotViewSent = new Set<string>();

export function trackInternalLotViewOnce(lotNumber: string, horseName: string): void {
  if (typeof window === "undefined") return;
  const key = `${getSessionId()}:${lotNumber}`;
  if (lotViewSent.has(key)) return;
  lotViewSent.add(key);
  trackInternalEvent("lot_view", { lot_number: lotNumber, horse_name: horseName });
}
