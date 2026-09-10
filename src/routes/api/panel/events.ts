import { createFileRoute } from "@tanstack/react-router";

import {
  getPanelTrackingEvents,
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

          const events = await getPanelTrackingEvents(hash);

          return panelJson({
            ok: true,
            events,
          });
        } catch {
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
