import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { FEMEAS_CATALOG, catalogHead } from "@/lib/catalog-config";
export const Route = createFileRoute("/catalago/leilao-martendal-weekend-2026_/femeas")({
  head: () => catalogHead(FEMEAS_CATALOG),
  component: () => <CatalogPage config={FEMEAS_CATALOG} />,
});
