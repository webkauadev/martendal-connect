import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { MACHOS_CATALOG, catalogHead } from "@/lib/catalog-config";
export const Route = createFileRoute("/catalago/leilao-martendal-weekend-2026_/machos")({
  head: () => catalogHead(MACHOS_CATALOG),
  component: () => <CatalogPage config={MACHOS_CATALOG} />,
});
