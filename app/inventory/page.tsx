import { getInventory, getInventoryActiveKits, getInventoryFilters } from "@/lib/items";

import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AutoRefresh } from "@/components/realtime/auto-refresh";
import { buildLocationPath } from "@/lib/inventory/domain";
import Link from "next/link";
import { KitStatusBadge } from "@/components/kits/kit-status-badge";
import { kitDetailPath } from "@/lib/paths";

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
  const [items, filterData, activeKits] = await Promise.all([getInventory(params), getInventoryFilters(), getInventoryActiveKits()]);
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
      {activeKits.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Active kits</div>
          <div className="grid gap-3">
            {activeKits.map((kit) => (
              <details key={kit.id} className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50/70 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{kit.assetId} · {kit.name}</div>
                    <div className="mt-1 text-sm text-emerald-900/75">{buildLocationPath(kit.location)} · {kit.items.length} items</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <KitStatusBadge status={kit.status} />
                    <Link href={kitDetailPath(kit.assetId)} className="rounded-full border border-emerald-300 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-900">
                      Open kit
                    </Link>
                  </div>
                </summary>
                <div className="mt-3 grid gap-2 border-t border-emerald-200 pt-3">
                  {kit.items.map((entry) => (
                    <div key={entry.itemId} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm">
                      <span>{entry.item.assetId} · {entry.item.name}</span>
                      <span className="text-muted-foreground">Qty {entry.quantity}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <InventoryFilters
        categories={filterData.categories.map((category) => ({ id: category.slug, label: category.name }))}
        locations={filterData.locations.map((location) => ({ id: location.id, label: buildLocationPath(location) }))}
        tags={filterData.tags.map((tag) => ({ id: tag.slug, label: tag.name }))}
      />
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
