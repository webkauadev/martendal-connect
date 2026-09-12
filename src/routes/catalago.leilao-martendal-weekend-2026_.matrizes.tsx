import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { MATRIZES_CATALOG, catalogHead } from "@/lib/catalog-config";
export const Route = createFileRoute("/catalago/leilao-martendal-weekend-2026_/matrizes")({
  head: () => catalogHead(MATRIZES_CATALOG),
  component: () => <CatalogPage config={MATRIZES_CATALOG} />,
});
