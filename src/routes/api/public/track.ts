import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/config";

const MAX_BODY_BYTES = 16 * 1024;
const SQUEEZE_PATH = "/leilao-martendal-weekend-2026";
const CATALOG_PATH = "/catalago/leilao-martendal-weekend-2026";
const ALLOWED_PATHS = new Set([SQUEEZE_PATH, CATALOG_PATH]);
const DEVICE_TYPES = new Set(["Mobile", "Tablet", "Desktop", "Unknown"]);

const EVENT_TYPES = [
  "page_view",
  "whatsapp_click",
  "catalog_view",
  "lot_view",
  "lot_whatsapp_click",
  "catalog_whatsapp_click",
  "catalog_video_click",
  "pdf_download",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

function str(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function jsonResponse(status: number, ok: boolean): Response {
  return new Response(JSON.stringify({ ok }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function isCatalogEvent(eventType: EventType): boolean {
  return eventType.startsWith("catalog_") || eventType.startsWith("lot_") || eventType === "pdf_download";
}

function isLotEvent(eventType: EventType): boolean {
  return eventType === "lot_view" || eventType === "lot_whatsapp_click" || eventType === "catalog_video_click";
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const declaredLength = Number(request.headers.get("content-length") ?? "0");
          if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
            return jsonResponse(413, false);
          }

          const raw = await request.text();
          if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
            return jsonResponse(413, false);
          }

          const body = JSON.parse(raw) as Record<string, unknown>;
          const eventType = str(body["event_type"], 40) as EventType | null;
          if (!eventType || !EVENT_TYPES.includes(eventType)) return jsonResponse(400, false);

          const sessionId = str(body["session_id"], 80);
          const landingPath = str(body["landing_path"], 200);
          const trafficSource = str(body["traffic_source"], 80);
          const deviceType = str(body["device_type"], 20);
          if (!sessionId || !landingPath || !trafficSource || !deviceType) return jsonResponse(400, false);
          if (!ALLOWED_PATHS.has(landingPath) || !DEVICE_TYPES.has(deviceType)) return jsonResponse(400, false);

          const catalogRequest = landingPath === CATALOG_PATH;
          if (isCatalogEvent(eventType) && !catalogRequest) return jsonResponse(400, false);
          if ((eventType === "page_view" || eventType === "whatsapp_click") && catalogRequest) {
            return jsonResponse(400, false);
          }

          const lotNumber = str(body["lot_number"], 20);
          const horseName = str(body["horse_name"], 120);
          const videoUrl = str(body["video_url"], 300);
          if (isLotEvent(eventType) && (!lotNumber || !horseName)) return jsonResponse(400, false);
          if (eventType === "catalog_video_click" && !videoUrl) return jsonResponse(400, false);

          const key = SUPABASE_PUBLISHABLE_KEY;
          const supabase = createClient(SUPABASE_URL, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                  h.delete("Authorization");
                }
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
          });

          const { error } = await supabase.from("martendal_tracking_events").insert({
            event_type: eventType,
            session_id: sessionId,
            utm_source: str(body["utm_source"]),
            utm_medium: str(body["utm_medium"]),
            utm_campaign: str(body["utm_campaign"]),
            utm_content: str(body["utm_content"]),
            utm_term: str(body["utm_term"]),
            campaign_id: str(body["campaign_id"], 80),
            adset_id: str(body["adset_id"], 80),
            ad_id: str(body["ad_id"], 80),
            traffic_source: trafficSource,
            referrer: str(body["referrer"]),
            landing_path: landingPath,
            device_type: deviceType,
            lot_number: lotNumber,
            horse_name: horseName,
            video_url: videoUrl,
          });

          if (error) {
            // lot_view é único por sessão+lote. Recarregar a mesma sessão não é erro de tracking.
            if (eventType === "lot_view" && error.code === "23505") return jsonResponse(202, true);
            console.error("tracking insert failed", error.message);
            return jsonResponse(500, false);
          }

          return jsonResponse(202, true);
        } catch {
          return jsonResponse(400, false);
        }
      },
    },
  },
});
