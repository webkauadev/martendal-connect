import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const EVENT_TYPES = ["page_view", "whatsapp_click"] as const;

function str(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.text();
          const body = JSON.parse(raw) as Record<string, unknown>;
          const eventType = str(body["event_type"], 40);
          if (!eventType || !EVENT_TYPES.includes(eventType as (typeof EVENT_TYPES)[number])) {
            return new Response(JSON.stringify({ ok: false }), { status: 400 });
          }

          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
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
            session_id: str(body["session_id"], 80),
            utm_source: str(body["utm_source"]),
            utm_medium: str(body["utm_medium"]),
            utm_campaign: str(body["utm_campaign"]),
            utm_content: str(body["utm_content"]),
            utm_term: str(body["utm_term"]),
            campaign_id: str(body["campaign_id"], 80),
            adset_id: str(body["adset_id"], 80),
            ad_id: str(body["ad_id"], 80),
            traffic_source: str(body["traffic_source"], 80),
            referrer: str(body["referrer"]),
            landing_path: str(body["landing_path"], 200),
            device_type: str(body["device_type"], 20),
          });

          if (error) {
            console.error("tracking insert failed", error.message);
            return new Response(JSON.stringify({ ok: false }), { status: 500 });
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 202,
            headers: { "content-type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false }), { status: 400 });
        }
      },
    },
  },
});
