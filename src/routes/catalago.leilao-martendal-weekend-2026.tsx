import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { catalogHead, MACHOS_CATALOG } from "@/lib/catalog-config";
import { CATALOG_BASE_PATH, CATALOGS } from "@/lib/catalog-tracking-contract";
import { trackCatalogSelected } from "@/lib/catalog-pixel";
import { trackInternalEvent } from "@/lib/internal-tracking";
import { ensureMetaPixel } from "@/lib/meta-pixel";

export const Route = createFileRoute("/catalago/leilao-martendal-weekend-2026")({
  head: () =>
    catalogHead({
      title: "Catálogos | Martendal Weekend 2026",
      description: "Escolha o catálogo Machos ou Fêmeas Elite do Martendal Weekend 2026.",
      path: CATALOG_BASE_PATH,
      ogImage: MACHOS_CATALOG.ogImage,
    }),
  component: CatalogSelector,
});
function CatalogSelector() {
  const [search, setSearch] = useState("");
  const sent = useRef(false);
  useEffect(() => {
    setSearch(window.location.search);
    ensureMetaPixel();
    if (sent.current) return;
    sent.current = true;
    trackInternalEvent("catalog_selector_view");
  }, []);
  return (
    <main className="cat cat-select">
      <header className="cat-head cat-select-head">
        <img
          src="/martendal-logo.jpg"
          alt="Pecuária Martendal"
          width={64}
          height={64}
          className="cat-logo"
        />
        <p className="cat-kicker">Catálogos</p>
        <h1 className="cat-title">Martendal Weekend 2026</h1>
        <p className="cat-sub">Escolha o catálogo que deseja explorar.</p>
      </header>
      <div className="cat-select-grid">
        {Object.values(CATALOGS).map((catalog) => (
          <a
            key={catalog.catalogKey}
            className="cat-select-card"
            href={catalog.path + search}
            onClick={() => {
              trackCatalogSelected(catalog);
              trackInternalEvent("catalog_selected", { catalog_key: catalog.catalogKey });
            }}
          >
            <span className="cat-kicker">
              {catalog.catalogKey === "machos" ? "12 de setembro" : "11 de setembro"}
            </span>
            <h2>{catalog.catalogKey === "machos" ? "Machos" : "Fêmeas Elite"}</h2>
            <span className="cat-sub">
              {catalog.catalogKey === "machos" ? "Quarto de Milha" : "Seleção de elite"}
            </span>
            <span className="cat-select-action">Explorar catálogo →</span>
          </a>
        ))}
      </div>
    </main>
  );
}
