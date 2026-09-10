import { createFileRoute } from "@tanstack/react-router";

import {
  clearPanelSessionCookieHeader,
  panelJson,
  panelSessionIsValid,
  readPanelSessionCookie,
  sessionHash,
} from "@/lib/panel-v2-server";

export const Route = createFileRoute("/api/panel/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = readPanelSessionCookie(request);

          if (!token) {
            return panelJson({
              authenticated: false,
            });
          }

          const valid = await panelSessionIsValid(sessionHash(token));

          if (!valid) {
            return panelJson({ authenticated: false }, 200, {
              "set-cookie": clearPanelSessionCookieHeader(request),
            });
          }

          return panelJson({
            authenticated: true,
          });
        } catch {
          return panelJson(
            {
              authenticated: false,
              error: "Serviço de autenticação temporariamente indisponível.",
            },
            503,
          );
        }
      },
    },
  },
});
