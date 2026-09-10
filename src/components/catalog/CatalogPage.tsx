import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type CatalogConfig, type CatalogItem } from "@/lib/catalog-config";
import {
  trackCatalogLotInterest,
  trackCatalogVideoClick,
  trackCatalogViewContentOnce,
  trackCatalogWhatsAppClick,
} from "@/lib/catalog-pixel";
import { buildCatalogWhatsAppUrl } from "@/lib/catalog-whatsapp";
import { trackInternalEvent, trackInternalLotViewOnce } from "@/lib/internal-tracking";
import { ensureMetaPixel } from "@/lib/meta-pixel";
import { readUtms } from "@/lib/squeeze-config";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.85 1.2 3.05c.15.2 2.06 3.24 5.02 4.42 2.46.98 2.96.79 3.5.74.53-.05 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.57-.35zM12.02 21.5h-.01a9.44 9.44 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.41 9.41 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.98 6.67 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.45 9.44zM20.46 3.49A11.35 11.35 0 0 0 12.02.02C5.75.02.65 5.12.65 11.39c0 2 .52 3.96 1.52 5.68L.5 23.5l6.58-1.73a11.34 11.34 0 0 0 4.94 1.13h.01c6.26 0 11.36-5.1 11.36-11.37 0-3.04-1.18-5.9-3.33-8.04z" />
    </svg>
  );
}

function lotLabel(lot: CatalogItem): string {
  return lot.lotNumber === "-100" ? "Coberturas" : `Lote ${lot.lotNumber}`;
}

export function CatalogPage({ config }: { config: CatalogConfig }) {
  const { lots, cover, introPages, extraPages, pageWidth, pageHeight } = config;
  const viewSent = useRef(false);
  const [utmSource, setUtmSource] = useState("");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<{ lotNumber: string; animalName: string } | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (viewSent.current) return;
    viewSent.current = true;
    setUtmSource(readUtms().utm_source);
    ensureMetaPixel();
    trackCatalogViewContentOnce(config);
    trackInternalEvent("catalog_view");
  }, [config]);

  useEffect(() => {
    const nodes = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const el = visible.target as HTMLElement;
        const lotNumber = el.dataset["lot"] ?? "";
        const animalName = el.dataset["horse"] ?? "";
        if (!lotNumber) return;
        setCurrent({ lotNumber, animalName });
        trackInternalLotViewOnce(lotNumber, animalName);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.15, 0.4] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lots;
    return lots.filter(
      (l) =>
        l.animalName.toLowerCase().includes(q) ||
        l.lotNumber.toLowerCase().includes(q) ||
        String(Number(l.lotNumber)) === q ||
        l.owner.toLowerCase().includes(q),
    );
  }, [query, lots]);

  const goToLot = useCallback((lotNumber: string) => {
    const el = sectionRefs.current[lotNumber];
    if (!el) return;
    setQuery("");
    requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    });
  }, []);

  const globalHref = useMemo(
    () => buildCatalogWhatsAppUrl(utmSource, current, config.catalogKey),
    [utmSource, current, config.catalogKey],
  );

  return (
    <main className="cat">
      <header className="cat-head">
        <img
          src="/martendal-logo.jpg"
          alt="Pecuária Martendal"
          width={64}
          height={64}
          className="cat-logo"
          decoding="async"
        />
        <p className="cat-kicker">Catálogo</p>
        <h1 className="cat-title">
          {config.heading}
          <br />
          Martendal Weekend 2026
        </h1>
        <p className="cat-meta">{config.date} • Vilhena • RO</p>
        <p className="cat-sub">Navegue pelos lotes, assista aos vídeos e fale com a Bárbara.</p>
      </header>

      <div className="cat-tools">
        <input
          type="search"
          inputMode="search"
          className="cat-search"
          placeholder="Buscar por número ou nome do lote"
          aria-label="Buscar lote por número ou nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="cat-listbtn"
          onClick={() => {
            if (lots[0]) goToLot(lots[0].lotNumber);
          }}
        >
          Ver lotes
        </button>

        {query.trim() && (
          <ul className="cat-list">
            {results.map((lot) => (
              <li key={lot.lotNumber}>
                <button type="button" onClick={() => goToLot(lot.lotNumber)}>
                  <span className="cat-list-num">{lotLabel(lot)}</span>
                  <span className="cat-list-name">{lot.animalName}</span>
                </button>
              </li>
            ))}
            {!results.length && <li className="cat-list-empty">Nenhum lote encontrado.</li>}
          </ul>
        )}
      </div>

      <img
        src={cover}
        alt={`Capa do catálogo ${config.catalogName}`}
        width={pageWidth}
        height={pageHeight}
        className="cat-page"
        style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
        decoding="async"
        fetchPriority="high"
      />

      {introPages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Introdução do catálogo (página ${i + 2})`}
          width={pageWidth}
          height={pageHeight}
          className="cat-page"
          style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
          loading="lazy"
          decoding="async"
        />
      ))}
      <div className="cat-lots">
        {lots.map((lot, index) => (
          <section
            key={lot.lotNumber}
            id={`lote-${lot.lotNumber}`}
            className="cat-lot"
            data-lot={lot.lotNumber}
            data-horse={lot.animalName}
            ref={(el) => {
              sectionRefs.current[lot.lotNumber] = el;
            }}
          >
            {lot.pages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${lotLabel(lot)} - ${lot.animalName} (página ${i + 1})`}
                width={pageWidth}
                height={pageHeight}
                className="cat-page"
                style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            ))}

            <div className="cat-lot-actions">
              {lot.videoUrl && (
                <a
                  href={lot.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cat-video"
                  onClick={() => {
                    trackCatalogVideoClick(lot.lotNumber, lot.animalName, lot.videoUrl!, config);
                    trackInternalEvent("catalog_video_click", {
                      lot_number: lot.lotNumber,
                      horse_name: lot.animalName,
                      video_url: lot.videoUrl,
                    });
                  }}
                >
                  ▶ Assistir vídeo do lote
                </a>
              )}
              <a
                href={buildCatalogWhatsAppUrl(utmSource, lot, config.catalogKey)}
                target="_blank"
                rel="noopener noreferrer"
                className="cat-interest"
                onClick={() => {
                  trackCatalogLotInterest(lot.lotNumber, lot.animalName, config);
                  trackInternalEvent("lot_whatsapp_click", {
                    lot_number: lot.lotNumber,
                    horse_name: lot.animalName,
                  });
                }}
              >
                Tenho interesse neste lote
              </a>
            </div>
          </section>
        ))}

        {extraPages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Informações e regulamento do leilão (página ${i + 1})`}
            width={pageWidth}
            height={pageHeight}
            className="cat-page"
            style={{ aspectRatio: `${pageWidth} / ${pageHeight}` }}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      <div className="cat-cta-wrap">
        <a
          href={globalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="cat-cta"
          onClick={() => {
            trackCatalogWhatsAppClick(
              current?.lotNumber ?? null,
              current?.animalName ?? null,
              config,
            );
            trackInternalEvent("catalog_whatsapp_click", {
              lot_number: current?.lotNumber ?? null,
              horse_name: current?.animalName ?? null,
            });
          }}
        >
          <WhatsAppIcon />
          <span>
            {current
              ? current.lotNumber === "-100"
                ? "Falar sobre as coberturas"
                : `Falar sobre o lote ${current.lotNumber}`
              : "Falar com Bárbara"}
          </span>
        </a>
      </div>
    </main>
  );
}
