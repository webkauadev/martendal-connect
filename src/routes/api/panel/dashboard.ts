import { createFileRoute } from "@tanstack/react-router";
import {
  getPanelDashboard,
  panelJson,
  panelSessionIsValid,
  readPanelSessionCookie,
  sessionHash,
} from "@/lib/panel-v2-server";
import { parsePanelQuery, PanelInputError } from "@/lib/panel-data";
export const Route = createFileRoute("/api/panel/dashboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = readPanelSessionCookie(request);
          if (!token) return panelJson({ ok: false }, 401);
          const hash = sessionHash(token);
          if (!(await panelSessionIsValid(hash))) return panelJson({ ok: false }, 401);
          const { filters } = parsePanelQuery(new URL(request.url).searchParams);
          return panelJson({ ok: true, dashboard: await getPanelDashboard(hash, filters) });
        } catch (error) {
          if (error instanceof PanelInputError)
            return panelJson({ ok: false, error: error.message }, 400);
          return panelJson(
            { ok: false, error: "Não foi possível carregar os dados do painel." },
            503,
          );
        }
      },
    },
  },
});
