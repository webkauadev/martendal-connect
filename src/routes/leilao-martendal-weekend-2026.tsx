import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import logoAsset from "@/assets/martendal-logo.jpg.asset.json";
import {
  trackInternalPageViewOnce,
  trackInternalWhatsAppClick,
} from "@/lib/internal-tracking";
import {
  trackViewContentOnce,
  trackWhatsAppReservation,
} from "@/lib/meta-pixel";
import { buildWhatsAppUrl, readUtms, WHATSAPP_NUMBER } from "@/lib/squeeze-config";

export const Route = createFileRoute("/leilao-martendal-weekend-2026")({
  head: () => ({
    meta: [
      { title: "Reserve sua Mesa | Leilão Martendal Weekend 2026" },
      {
        name: "description",
        content:
          "Reserve sua mesa para o Leilão Martendal Weekend 2026 em Vilhena/RO e fale diretamente com Bárbara pelo WhatsApp.",
      },
      { property: "og:title", content: "Leilão Martendal Weekend 2026" },
      { property: "og:description", content: "Reserve sua mesa para o Martendal Weekend." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/leilao-martendal-weekend-2026" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#050706" },
    ],
    links: [{ rel: "canonical", href: "/leilao-martendal-weekend-2026" }],
  }),
  component: SqueezePage,
});

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.85 1.2 3.05c.15.2 2.06 3.24 5.02 4.42 2.46.98 2.96.79 3.5.74.53-.05 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.57-.35zM12.02 21.5h-.01a9.44 9.44 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.41 9.41 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.98 6.67 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.45 9.44zM20.46 3.49A11.35 11.35 0 0 0 12.02.02C5.75.02.65 5.12.65 11.39c0 2 .52 3.96 1.52 5.68L.5 23.5l6.58-1.73a11.34 11.34 0 0 0 4.94 1.13h.01c6.26 0 11.36-5.1 11.36-11.37 0-3.04-1.18-5.9-3.33-8.04z" />
    </svg>
  );
}

function SqueezePage() {
  const [utmSource, setUtmSource] = useState("");

  useEffect(() => {
    setUtmSource(readUtms().utm_source);
    trackViewContentOnce();
  }, []);

  const href = useMemo(() => buildWhatsAppUrl(utmSource), [utmSource]);

  return (
    <main className="squeeze">
      <div className="squeeze-inner">
        <div className="squeeze-top">
          <img
            src={logoAsset.url}
            alt="Pecuária Martendal"
            width={120}
            height={120}
            className="squeeze-logo"
            decoding="async"
          />
        </div>

        <div className="squeeze-mid">
          <h1 className="squeeze-title">
            Leilão Martendal
            <br />
            Weekend 2026
          </h1>

          <span className="squeeze-rule" aria-hidden="true" />

          <p className="squeeze-date">
            11 a 13 de setembro
            <br />
            Vilhena • RO
          </p>

          <p className="squeeze-invite">Garanta sua mesa para o Martendal Weekend.</p>
        </div>

        <div className="squeeze-bottom">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="squeeze-cta"
            aria-label={`Reservar minha mesa pelo WhatsApp com Bárbara Silva (${WHATSAPP_NUMBER})`}
            onClick={() => trackWhatsAppReservation()}
          >
            <WhatsAppIcon />
            <span>Reservar minha mesa</span>
          </a>
          <p className="squeeze-micro">Fale diretamente com Bárbara Silva pelo WhatsApp.</p>
        </div>
      </div>
    </main>
  );
}
