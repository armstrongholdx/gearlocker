import Link from "next/link";
import { prisma } from "@/lib/prisma";

import { StatusBadge } from "@/components/inventory/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalItems, categories, statuses, recentItems, recentHistory] = await Promise.all([
    prisma.item.count(),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.item.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.item.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true },
    }),
    prisma.itemHistoryEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 5,
      include: { item: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardDescription>Dashboard</CardDescription>
            <CardTitle className="text-3xl">Gear overview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-semibold">{totalItems}</div>
              <p className="text-sm text-muted-foreground">Tracked inventory items</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/items/new">Add item</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/inventory">Open inventory</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle>Current state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statuses.map((entry) => (
              <div key={entry.status} className="flex items-center justify-between">
                <StatusBadge status={entry.status} />
                <span className="font-medium">{entry._count.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Category mix</CardDescription>
            <CardTitle>By department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.slice(0, 5).map((category) => (
              <div key={category.id} className="flex items-center justify-between text-sm">
                <span>{category.name}</span>
                <span className="font-medium">{category._count.items}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recently added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                <div>
                  <Link href={`/items/${item.id}`} className="font-medium hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {item.assetId} · {item.category?.name ?? "Uncategorized"}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentHistory.map((event) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{event.summary}</p>
                  <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">{event.item.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
