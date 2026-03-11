import Link from "next/link";
import { Item } from "@prisma/client";

import { StatusBadge } from "@/components/inventory/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type InventoryItem = Item & {
  category: { name: string } | null;
  location: { name: string } | null;
};

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4">Item</th>
              <th className="pb-3 pr-4">Asset ID</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Replacement</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="py-4 pr-4">
                  <Link href={`/items/${item.id}`} className="font-medium hover:underline">
                    {item.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {[item.brand, item.model].filter(Boolean).join(" ")}
                  </div>
                </td>
                <td className="py-4 pr-4">{item.assetId}</td>
                <td className="py-4 pr-4">{item.category?.name ?? "Uncategorized"}</td>
                <td className="py-4 pr-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="py-4 pr-4">{item.location?.name ?? "Unassigned"}</td>
                <td className="py-4 pr-4">{formatCurrency(item.replacementValue ? Number(item.replacementValue) : null, item.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
