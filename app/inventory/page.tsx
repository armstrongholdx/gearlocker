import { getInventory, getInventoryFilters } from "@/lib/items";

import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { buildLocationPath } from "@/lib/inventory/domain";
import Link from "next/link";

type SearchParams = Promise<{
  query?: string;
  category?: string;
  status?: string;
  location?: string;
  tag?: string;
  sort?: "recent" | "name" | "replacementValue";
}>;

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [items, filterData] = await Promise.all([getInventory(params), getInventoryFilters()]);
  const activeCount = items.filter((item) => item.status === "active").length;
  const availableCount = items.filter((item) => item.status === "available").length;
  const topCategories = filterData.categories.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inventory</div>
          <h1 className="text-3xl font-semibold tracking-tight">Find gear fast and act with confidence</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">This is the daily operating surface for storage, prep, handoff, and deployment. Asset IDs, statuses, categories, and locations should all read instantly.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {topCategories.map((category) => (
              <span key={category.id} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600">
                {category.name}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
          <div className="grid grid-cols-3 gap-3">
            <StatChip label="Visible" value={String(items.length)} />
            <StatChip label="Available" value={String(availableCount)} />
            <StatChip label="Active" value={String(activeCount)} />
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-white/80 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Operational shortcuts</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/inventory?status=active" className="rounded-full border border-slate-200 bg-secondary/60 px-3 py-1.5 text-sm">
                View active
              </Link>
              <Link href="/scan" className="rounded-full border border-slate-200 bg-secondary/60 px-3 py-1.5 text-sm">
                Open scan
              </Link>
            </div>
          </div>
        </div>
      </div>
      <InventoryFilters
        categories={filterData.categories.map((category) => ({ id: category.slug, label: category.name }))}
        locations={filterData.locations.map((location) => ({ id: location.id, label: buildLocationPath(location) }))}
        tags={filterData.tags.map((tag) => ({ id: tag.slug, label: tag.name }))}
      />
      <div className="rounded-[1.2rem] border border-slate-200 bg-white/75 p-4 text-sm text-muted-foreground">
        Categories define the broad gear type for filtering, browsing, and suggested asset-ID prefixes. Use them consistently so inventory views stay predictable.
      </div>
      <InventoryTable items={items} />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-white/75 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
