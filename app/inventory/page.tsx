import { getInventory, getInventoryFilters } from "@/lib/items";

import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";

type SearchParams = Promise<{
  query?: string;
  category?: string;
  status?: string;
  location?: string;
  sort?: "recent" | "name" | "replacementValue";
}>;

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [items, filterData] = await Promise.all([getInventory(params), getInventoryFilters()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Search, sort, and filter gear fast.</p>
      </div>
      <InventoryFilters
        categories={filterData.categories.map((category) => ({ id: category.slug, label: category.name }))}
        locations={filterData.locations.map((location) => ({ id: location.id, label: location.name }))}
      />
      <InventoryTable items={items} />
    </div>
  );
}
