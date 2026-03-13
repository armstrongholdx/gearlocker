import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, MapPinned, PackagePlus, QrCode, ScanSearch, Warehouse } from "lucide-react";
import type { ComponentType } from "react";

import { StatusBadge } from "@/components/inventory/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getDashboardSummary } from "@/lib/inventory/queries";
import { itemDetailPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { totalItems, categories, statuses, recentItems, recentHistory, totalKits, totalLocations, activeKits } =
    await getDashboardSummary();
  const availableCount = statuses.find((entry) => entry.status === "available")?._count.status ?? 0;
  const activeCount = statuses.find((entry) => entry.status === "active")?._count.status ?? 0;
  const repairCount = statuses.find((entry) => entry.status === "in_repair")?._count.status ?? 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardDescription>Dashboard</CardDescription>
            <CardTitle className="text-4xl leading-tight">Production inventory command center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Tracked items" value={String(totalItems)} icon={Boxes} tone="dark" />
              <MetricCard label="Available" value={String(availableCount)} icon={MapPinned} />
              <MetricCard label="Active" value={String(activeCount)} icon={ScanSearch} />
              <MetricCard label="Active kits" value={String(activeKits)} icon={QrCode} />
            </div>
            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-950 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Operations</div>
                    <div className="mt-2 text-2xl font-semibold">Run prep, deploy, and returns from one place</div>
                    <p className="mt-3 max-w-xl text-sm text-slate-300">
                      Inventory is the main operating surface. Kits and scan flows support repeatable packages and fast field actions.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 lg:block">
                    <PackagePlus className="h-7 w-7 text-accent" />
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <QuickActionCard href="/inventory?status=active" title="Active gear" body="Review deployed gear and what is out right now." />
                  <QuickActionCard href="/kits" title="Kit readiness" body="Check package completeness and return status." />
                  <QuickActionCard href="/scan" title="Scan actions" body="Jump into action-first mobile and field workflows." />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/inventory">Open inventory</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/items/new">Add item</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4">
                <MiniPanel title="Kits" value={String(totalKits)} description="Scannable packages and completeness checks" />
                <MiniPanel title="Locations" value={String(totalLocations)} description="Nested storage paths and movement history" />
                <MiniPanel title="Needs attention" value={String(repairCount)} description="Items currently marked in repair" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Status overview</CardDescription>
            <CardTitle>Operational mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statuses.map((entry) => (
              <div key={entry.status} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={entry.status} />
                  <span className="text-lg font-semibold">{entry._count.status}</span>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-slate-300 bg-secondary/50 p-4 text-sm text-muted-foreground">
              Asset IDs remain the public identifier used in labels, scan resolution, exports, and URLs. Internal IDs stay hidden.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardDescription>Storage coverage</CardDescription>
            <CardTitle>Inventory by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.slice(0, 8).map((category) => (
              <div key={category.id} className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.max(12, Math.min(100, (category._count.items / Math.max(totalItems, 1)) * 100))}%` }}
                  />
                </div>
                <div className="w-32 text-sm">{category.name}</div>
                <div className="w-10 text-right text-sm font-semibold">{category._count.items}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Recent additions</CardDescription>
            <CardTitle>Fresh records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={itemDetailPath(item.assetId)}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/70 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.assetId} · {item.category?.name ?? "Uncategorized"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Recent activity</CardDescription>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentHistory.slice(0, 5).map((event) => (
              <div key={event.id} className="relative pl-5">
                <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
                  <p className="font-medium">{event.summary}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.item.assetId}
                    {event.location ? ` · ${event.location.name}` : ""}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardDescription>Entry points</CardDescription>
            <CardTitle>Jump into the right workflow</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickLink href="/inventory" title="Inventory" body="Search, filter, inspect, and act on gear records quickly." />
            <QuickLink href="/kits" title="Kits" body="Track repeatable packages, readiness, and return workflows." />
            <QuickLink href="/locations" title="Locations" body="Use the storage map to understand where gear actually lives." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Operational note</CardDescription>
            <CardTitle>Status semantics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Available</span> means at rest in storage or studio.
            </p>
            <p>
              <span className="font-semibold text-foreground">Active</span> means deployed, on truck, or out on a job.
            </p>
            <p>Kits can move as units, but returns still require item-level verification.</p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>Operational actions should generally start from Inventory, Kits, or Scan. Creation remains secondary.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "light",
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "light" | "dark";
}) {
  return (
    <div className={tone === "dark" ? "rounded-[1.2rem] bg-slate-950 p-4 text-white" : "rounded-[1.2rem] border border-slate-200 bg-white/75 p-4"}>
      <div className="flex items-center justify-between">
        <div className={tone === "dark" ? "text-sm text-slate-300" : "text-sm text-muted-foreground"}>{label}</div>
        <Icon className={tone === "dark" ? "h-4 w-4 text-accent" : "h-4 w-4 text-slate-500"} />
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function MiniPanel({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white/75 p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{description}</div>
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-[1.2rem] border border-slate-200 bg-white/75 p-4 transition hover:border-slate-300 hover:bg-white">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}

function QuickActionCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{body}</div>
    </Link>
  );
}
