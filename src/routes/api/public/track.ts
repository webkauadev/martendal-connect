import {
  catalogForPath,
  eventAllowedAtPath,
  isCatalogKey,
  TRACKING_EVENTS,
} from "@/lib/catalog-tracking-contract";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/config";

const MAX_BODY_BYTES = 16 * 1024;
const DEVICE_TYPES = new Set(["Mobile", "Tablet", "Desktop", "Unknown"]);
const EVENT_TYPES = TRACKING_EVENTS;

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

function isLotEvent(eventType: EventType): boolean {
  return (
    eventType === "lot_view" ||
    eventType === "lot_whatsapp_click" ||
    eventType === "catalog_video_click"
  );
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
          if (!sessionId || !landingPath || !trafficSource || !deviceType)
            return jsonResponse(400, false);
          if (!DEVICE_TYPES.has(deviceType)) return jsonResponse(400, false);

          if (!eventAllowedAtPath(eventType, landingPath)) return jsonResponse(400, false);
          const catalog = catalogForPath(landingPath);
          const selectedKey = body["catalog_key"];
          if (catalog && selectedKey != null && selectedKey !== catalog.catalogKey)
            return jsonResponse(400, false);
          if (eventType === "catalog_selected" && !isCatalogKey(selectedKey))
            return jsonResponse(400, false);
          if (eventType === "catalog_selector_view" && selectedKey != null)
            return jsonResponse(400, false);

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
            catalog_name: catalog?.catalogName ?? null,
            catalog_key:
              catalog?.catalogKey ?? (eventType === "catalog_selected" ? selectedKey : null),
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
            // lot_view é único por sessão+catálogo+lote. Recarregar a mesma sessão não é erro de tracking.
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
