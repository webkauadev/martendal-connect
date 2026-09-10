import { createFileRoute } from "@tanstack/react-router";

import {
  checkPanelRateLimit,
  consumePanelKey,
  createPanelSession,
  panelJson,
  panelSessionCookieHeader,
  sameOriginRequest,
  verifyPanelOneTimeKey,
} from "@/lib/panel-v2-server";

const MAX_BODY_BYTES = 4096;

export const Route = createFileRoute("/api/panel/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!sameOriginRequest(request)) {
            return panelJson({ ok: false }, 403);
          }

          const contentType = request.headers.get("content-type") ?? "";

          if (!contentType.toLowerCase().startsWith("application/json")) {
            return panelJson({ ok: false }, 415);
          }

          const declaredLength = Number(request.headers.get("content-length") ?? "0");

          if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
            return panelJson({ ok: false }, 413);
          }

          const raw = await request.text();

          if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
            return panelJson({ ok: false }, 413);
          }

          const rate = await checkPanelRateLimit(request);

          if (rate.rateLimited || !rate.allowed) {
            return panelJson(
              {
                ok: false,
                error: "Muitas tentativas. Aguarde alguns minutos.",
              },
              429,
            );
          }

          let parsed: unknown;

          try {
            parsed = JSON.parse(raw);
          } catch {
            return panelJson({ ok: false }, 400);
          }

          if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return panelJson({ ok: false }, 400);
          }

          const body = parsed as Record<string, unknown>;

          if (Object.keys(body).length !== 1 || typeof body["key"] !== "string") {
            return panelJson({ ok: false }, 400);
          }

          const key = body["key"].trim();
          const verified = verifyPanelOneTimeKey(key);

          if (!verified.ok) {
            return panelJson(
              {
                ok: false,
                error: "Chave inválida, expirada ou já utilizada.",
              },
              401,
            );
          }

          const session = createPanelSession();

          const consumed = await consumePanelKey(
            verified.jtiHash,
            session.hash,
            verified.expiresAt,
          );

          if (!consumed.ok) {
            return panelJson(
              {
                ok: false,
                error: "Chave inválida, expirada ou já utilizada.",
              },
              401,
            );
          }

          return panelJson({ ok: true }, 200, {
            "set-cookie": panelSessionCookieHeader(request, session.token),
          });
        } catch {
          return panelJson(
            {
              ok: false,
              error: "Serviço de autenticação temporariamente indisponível.",
            },
            503,
          );
        }
      },
    },
  },
});
