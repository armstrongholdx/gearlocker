import { getInventory, getInventoryFilters } from "@/lib/items";

import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AutoRefresh } from "@/components/realtime/auto-refresh";
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
      <AutoRefresh intervalMs={30000} tables={["Item", "ItemHistoryEvent"]} />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inventory</div>
          <h1 className="text-3xl font-semibold tracking-tight">Inventory</h1>
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
              <Link href="/manage/categories" className="rounded-full border border-slate-200 bg-secondary/60 px-3 py-1.5 text-sm">
                Manage categories
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
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <span className="font-semibold">Active</span> means gear is currently deployed or out on a job.
        </div>
        <div className="rounded-[1.2rem] border border-slate-200 bg-white/75 p-4 text-sm text-muted-foreground">
          Filter by category, status, location, or tag.
        </div>
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
