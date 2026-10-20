import type { DashboardFilters, EventPage, TrackingEvent } from "./panel-auth";
import { getPanelTrackingEventsPage, panelJson } from "./panel-v2-server";

const columns = [
  "created_at",
  "event_type",
  "experience_type",
  "landing_path",
  "catalog_name",
  "catalog_key",
  "lot_number",
  "horse_name",
  "video_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "campaign_id",
  "adset_id",
  "ad_id",
  "traffic_source",
  "device_type",
  "session_id",
] as const satisfies readonly (keyof TrackingEvent)[];

// Explicit export only; batches stay on the server and respect stream backpressure.
export function streamPanelCsv(
  request: Request,
  hash: string,
  filters: DashboardFilters,
  firstPage: EventPage,
): Response {
  const encoder = new TextEncoder();
  let page: EventPage | null = firstPage;
  let cursor = firstPage.nextCursor;
  let header = true;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (request.signal.aborted) {
        controller.close();
        return;
      }
      try {
        if (!page) {
          if (!cursor) {
            controller.close();
            return;
          }
          page = await getPanelTrackingEventsPage(hash, cursor.created_at, cursor.id, 100, filters);
        }
        const escape = (value: string | null) => {
          const safe =
            /^[=+@\t\r]/.test(value ?? "") || /^-[^\d]/.test(value ?? "") ? "'" + value : value;
          return '"' + (safe ?? "").replace(/"/g, '""') + '"';
        };
        const lines = page.events.map((row) => columns.map((key) => escape(row[key])).join(","));
        if (header) {
          lines.unshift(columns.join(","));
          header = false;
        }
        controller.enqueue(encoder.encode(lines.join("\r\n") + "\r\n"));
        cursor = page.hasMore ? page.nextCursor : null;
        page = null;
        if (!cursor) controller.close();
      } catch {
        controller.error(new Error("Não foi possível concluir a exportação."));
      }
    },
  });
  const headers = new Headers(panelJson({}).headers);
  headers.set("content-type", "text/csv; charset=utf-8");
  headers.set("content-disposition", 'attachment; filename="martendal-eventos.csv"');
  return new Response(stream, { headers });
}
