import {
  CATALOG_COVER,
  CATALOG_EXTRA_PAGES,
  CATALOG_LOTS,
  CATALOG_OG_IMAGE,
  PAGE_HEIGHT,
  PAGE_WIDTH,
} from "./catalog-data";
import { FEMEAS_LOTS } from "./catalog-femeas-data";
import { MATRIZES_LOTS } from "./catalog-matrizes-data";
import { CATALOGS, type CatalogContext } from "./catalog-tracking-contract";
export type CatalogItem = {
  lotNumber: string;
  animalName: string;
  animalNames?: string[];
  owner: string;
  pages: string[];
  videoUrl: string | null;
};
export type CatalogConfig = CatalogContext & {
  title: string;
  description: string;
  heading: string;
  date: string;
  cover: string;
  ogImage: string;
  introPages: string[];
  lots: CatalogItem[];
  extraPages: string[];
  pageWidth: number;
  pageHeight: number;
};
export const MACHOS_CATALOG: CatalogConfig = {
  ...CATALOGS.machos,
  title: "Catálogo Quarto de Milha | Martendal Weekend 2026",
  description:
    "Catálogo digital do Leilão Martendal Weekend 2026 - Quarto de Milha, 12 de setembro, Vilhena/RO. Veja os lotes, vídeos e fale com Bárbara pelo WhatsApp.",
  cover: CATALOG_COVER,
  ogImage: CATALOG_OG_IMAGE,
  introPages: [],
  lots: CATALOG_LOTS.map(({ horseName, ...lot }) => ({ ...lot, animalName: horseName })),
  extraPages: CATALOG_EXTRA_PAGES,
  pageWidth: PAGE_WIDTH,
  pageHeight: PAGE_HEIGHT,
};
export const FEMEAS_CATALOG: CatalogConfig = {
  ...CATALOGS.femeas,
  title: "Catálogo Fêmeas Elite | Martendal Weekend 2026",
  description:
    "Catálogo digital Fêmeas Elite do Leilão Martendal Weekend 2026, 11 de setembro, em Vilhena/RO. Veja os lotes, vídeos e fale com Bárbara pelo WhatsApp.",
  cover: "/catalogo-femeas/p01.webp",
  ogImage: "/catalogo-femeas/og.webp",
  introPages: ["/catalogo-femeas/p02.webp", "/catalogo-femeas/p03.webp"],
  lots: FEMEAS_LOTS,
  extraPages: [31, 32, 33, 34, 35].map((page) => `/catalogo-femeas/p${page}.webp`),
  pageWidth: 1080,
  pageHeight: 1920,
};
export const MATRIZES_CATALOG: CatalogConfig = {
  ...CATALOGS.matrizes,
  title: "Catálogo de Matrizes | Martendal Weekend 2026",
  description:
    "Catálogo digital de Matrizes do Leilão Martendal Weekend 2026, 13 de setembro, em Vilhena/RO. Veja os lotes, vídeos e fale com Bárbara pelo WhatsApp.",
  cover: "/catalogo-matrizes/p01.webp",
  ogImage: "/catalogo-matrizes/og.webp",
  introPages: ["/catalogo-matrizes/p02.webp"],
  lots: MATRIZES_LOTS,
  extraPages: [170, 171, 172, 173, 174].map((page) => `/catalogo-matrizes/p${page}.webp`),
  pageWidth: 1080,
  pageHeight: 1920,
};
export function catalogHead(
  config: Pick<CatalogConfig, "title" | "description" | "ogImage"> & { path: string },
) {
  const site = "https://pecuariamartendal.kauadev.net.br";
  return {
    meta: [
      { title: config.title },
      { name: "description", content: config.description },
      { property: "og:title", content: config.title },
      { property: "og:description", content: config.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: site + config.path },
      { property: "og:image", content: site + config.ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: site + config.ogImage },
      { name: "twitter:title", content: config.title },
      { name: "twitter:description", content: config.description },
      { name: "theme-color", content: "#050706" },
    ],
    links: [{ rel: "canonical", href: site + config.path }],
  };
}
