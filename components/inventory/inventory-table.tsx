import Link from "next/link";
import { Item } from "@prisma/client";
import { ArrowRight, MapPinned, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/inventory/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildLocationPath } from "@/lib/inventory/domain";
import { formatCurrency } from "@/lib/format";
import { itemDetailPath } from "@/lib/paths";

type InventoryItem = Item & {
  category: { name: string } | null;
  location: { name: string; parentLocation?: { name: string; parentLocation?: { name: string } | null } | null } | null;
  tags: { tag: { name: string } }[];
};

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">
          No items match the current filters. Clear a filter or search for a different asset ID, tag, category, or location path.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inventory view</div>
          <CardTitle className="mt-1">Operational asset list</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">{items.length} visible items</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="scroll-fade hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="pb-3 pr-4">Item</th>
              <th className="pb-3 pr-4">Asset ID</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Location / Tags</th>
              <th className="pb-3 pr-4 text-right">Replacement</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.status === "active" ? "border-b border-slate-200/70 bg-amber-50/55 last:border-b-0" : "border-b border-slate-200/70 last:border-b-0"}>
                <td className="py-4 pr-4">
                  <Link href={itemDetailPath(item.assetId)} className="font-semibold hover:underline">
                    {item.name}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[item.brand, item.model].filter(Boolean).join(" ")}
                  </div>
                </td>
                <td className="py-4 pr-4 font-mono text-xs font-semibold">{item.assetId}</td>
                <td className="py-4 pr-4">
                  <Badge variant="outline">{item.category?.name ?? "Uncategorized"}</Badge>
                </td>
                <td className="py-4 pr-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="py-4 pr-4">
                  <div className="text-sm">{buildLocationPath(item.location)}</div>
                  {item.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((entry) => (
                        <Badge key={entry.tag.name} variant="outline">
                          {entry.tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="py-4 pl-4 pr-0 text-right font-semibold">{formatCurrency(item.replacementValue ? Number(item.replacementValue) : null, item.currency)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.id}
              href={itemDetailPath(item.assetId)}
              className="rounded-[1.2rem] border border-slate-200 bg-white/80 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{item.assetId}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <div>{item.category?.name ?? "Uncategorized"}</div>
                <div className="flex items-start gap-2">
                  <MapPinned className="mt-0.5 h-4 w-4" />
                  <span>{buildLocationPath(item.location)}</span>
                </div>
                {item.tags.length > 0 ? (
                  <div className="flex items-start gap-2">
                    <Tags className="mt-0.5 h-4 w-4" />
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((entry) => (
                        <Badge key={entry.tag.name} variant="outline">
                          {entry.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm font-semibold">{formatCurrency(item.replacementValue ? Number(item.replacementValue) : null, item.currency)}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
