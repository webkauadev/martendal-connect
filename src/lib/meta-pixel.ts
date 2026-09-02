import { EVENT_NAME, META_PIXEL_ID, normalizeTrafficSource, readUtms } from "./squeeze-config";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: unknown;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
  getState?: () => { pixels?: Array<{ id?: string }> };
};

type PixelWindow = Window & {
  fbq?: Fbq;
  _fbq?: Fbq;
  __martendalPixelBooted?: boolean;
};

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as PixelWindow).fbq;
  return typeof fbq === "function" ? fbq : null;
}

function isPixelRegistered(fbq: Fbq): boolean {
  try {
    const pixels = fbq.getState?.().pixels ?? [];
    if (pixels.some((p) => p?.id === META_PIXEL_ID)) return true;
  } catch {
    // getState is unavailable until fbevents.js finishes loading.
  }
  const queued = fbq.queue ?? [];
  return queued.some((args) => Array.isArray(args) && args[0] === "init");
}

/**
 * Garante que o pixel esteja inicializado e que o PageView tenha sido enviado,
 * mesmo se o snippet inline do <head> não tiver executado (ex.: navegação
 * client-side). Idempotente: nunca inicializa nem envia PageView duas vezes.
 */
export function ensurePixelBooted(): void {
  if (typeof window === "undefined") return;
  const w = window as PixelWindow;
  if (w.__martendalPixelBooted) return;
  w.__martendalPixelBooted = true;

  let fbq = getFbq();

  if (!fbq) {
    const stub = function (...args: unknown[]) {
      const self = stub as Fbq;
      if (typeof self.callMethod === "function") {
        (self.callMethod as (...a: unknown[]) => void).apply(self, args);
      } else {
        (self.queue ??= []).push(args);
      }
    } as Fbq;
    stub.queue = [];
    stub.push = stub;
    stub.loaded = true;
    stub.version = "2.0";
    w.fbq = stub;
    w._fbq = stub;
    fbq = stub;
  }

  const alreadyLoaded = Array.from(
    document.querySelectorAll<HTMLScriptElement>("script[src]"),
  ).some((s) => s.src.includes("connect.facebook.net") && s.src.includes("fbevents.js"));

  if (!alreadyLoaded) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  if (!isPixelRegistered(fbq)) {
    fbq("init", META_PIXEL_ID);
    fbq("track", "PageView");
  }
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
