import { EVENT_NAME, META_PIXEL_ID, normalizeTrafficSource, readUtms } from "./squeeze-config";

const META_PIXEL_LOADER = "https://connect.facebook.net/en_US/fbevents.js";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

type PixelWindow = Window & {
  fbq?: Fbq;
  _fbq?: Fbq;
  __martendalMetaInitQueued?: boolean;
  __martendalMetaPageViewQueued?: boolean;
};

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as PixelWindow).fbq;
  return typeof fbq === "function" ? fbq : null;
}

// Garante o loader OFICIAL no DOM. A fonte de verdade é o elemento <script>
// real — nunca a existência de window.fbq.
export function ensureMetaLoader(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${META_PIXEL_LOADER}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = META_PIXEL_LOADER;
  script.dataset["martendalMetaPixel"] = "true";
  document.head.appendChild(script);
}

// Cria o stub apenas se necessário, garante o loader sempre, e enfileira
// init/PageView uma única vez cada (flags separadas por estado).
export function ensureMetaPixel(): void {
  if (typeof window === "undefined") return;
  const w = window as PixelWindow;

  if (typeof w.fbq !== "function") {
    const fbq: Fbq = function (this: unknown, ...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue?.push(args);
    } as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    w.fbq = fbq;
    if (!w._fbq) w._fbq = fbq;
  }

  ensureMetaLoader();

  const fbq = getFbq();
  if (!fbq) return;

  if (!w.__martendalMetaInitQueued) {
    w.__martendalMetaInitQueued = true;
    fbq("init", META_PIXEL_ID);
  }
  if (!w.__martendalMetaPageViewQueued) {
    w.__martendalMetaPageViewQueued = true;
    fbq("track", "PageView");
  }
}

let viewContentSent = false;




export function trackViewContentOnce(): void {
  if (viewContentSent) return;
  const fbq = getFbq();
  if (!fbq) return;
  viewContentSent = true;
  fbq("track", "ViewContent", {
    content_name: `${EVENT_NAME} - Reserva de Mesa`,
    content_category: "Reserva de Mesa",
    content_type: "event",
  });
}

export function trackWhatsAppReservation(): void {
  const utms = readUtms();
  const trafficSource = normalizeTrafficSource(utms.utm_source);

  if (typeof window !== "undefined" && typeof (window as PixelWindow).fbq === "function") {
    const fbq = (window as PixelWindow).fbq;
    if (!fbq) return;
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
}
