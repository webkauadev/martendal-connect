import { createFileRoute } from "@tanstack/react-router";
import { parsePanelQuery, PanelInputError } from "@/lib/panel-data";
import { streamPanelCsv } from "@/lib/panel-csv-server";

import {
  getPanelTrackingEventsPage,
  panelJson,
  panelSessionIsValid,
  readPanelSessionCookie,
  sessionHash,
} from "@/lib/panel-v2-server";

export const Route = createFileRoute("/api/panel/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = readPanelSessionCookie(request);

          if (!token) {
            return panelJson({ ok: false }, 401);
          }

          const hash = sessionHash(token);
          const valid = await panelSessionIsValid(hash);

          if (!valid) {
            return panelJson({ ok: false }, 401);
          }

          const { filters, cursor, pageSize, csv } = parsePanelQuery(
            new URL(request.url).searchParams,
            true,
          );
          const page = await getPanelTrackingEventsPage(
            hash,
            cursor?.created_at ?? null,
            cursor?.id ?? null,
            pageSize,
            filters,
          );
          if (csv) return streamPanelCsv(request, hash, filters, page);
          return panelJson({
            ok: true,
            ...page,
          });
        } catch (error) {
          if (error instanceof PanelInputError)
            return panelJson({ ok: false, error: error.message }, 400);
          return panelJson(
            {
              ok: false,
              error: "Não foi possível carregar os dados do painel.",
            },
            503,
          );
        }
      },
    },
  },
});
