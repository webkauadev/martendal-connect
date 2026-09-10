import { createFileRoute } from "@tanstack/react-router";

import {
  clearPanelSessionCookieHeader,
  destroyPanelSession,
  panelJson,
  readPanelSessionCookie,
  sameOriginRequest,
  sessionHash,
} from "@/lib/panel-v2-server";

export const Route = createFileRoute("/api/panel/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!sameOriginRequest(request)) {
          return panelJson({ ok: false }, 403);
        }

        const token = readPanelSessionCookie(request);

        if (token) {
          try {
            await destroyPanelSession(sessionHash(token));
          } catch {
            return panelJson(
              {
                ok: false,
                error: "Não foi possível encerrar a sessão.",
              },
              503,
            );
          }
        }

        return panelJson({ ok: true }, 200, {
          "set-cookie": clearPanelSessionCookieHeader(request),
        });
      },
    },
  },
});
