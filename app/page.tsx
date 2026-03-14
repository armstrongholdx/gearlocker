import Link from "next/link";
import { AlertTriangle, ArrowRight, ScanSearch, Wrench } from "lucide-react";
import type { ComponentType } from "react";

import { AutoRefresh } from "@/components/realtime/auto-refresh";
import { StatusBadge } from "@/components/inventory/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getDashboardSummary } from "@/lib/inventory/queries";
import { itemDetailPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { getWorkspaceContext } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { totalItems, categories, statuses, recentItems, recentHistory, totalKits, totalLocations, activeKits, incompleteKits } =
    await getDashboardSummary();
  const workspaceContext = await getWorkspaceContext();
  const activeCount = statuses.find((entry) => entry.status === "active")?._count.status ?? 0;
  const repairCount = statuses.find((entry) => entry.status === "in_repair")?._count.status ?? 0;
  const missingCount = statuses.find((entry) => entry.status === "missing")?._count.status ?? 0;

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={30000} tables={["Item", "Kit", "KitVerificationSession", "ItemHistoryEvent", "KitHistoryEvent"]} />
      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardDescription>Dashboard</CardDescription>
            <CardTitle className="text-4xl leading-tight">Gear status at a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard href="/inventory?status=active" label="Active items" value={String(activeCount)} icon={ScanSearch} tone="active" detail="Out on a job or deployed" />
              {repairCount > 0 ? <MetricCard href="/inventory?status=in_repair" label="Needs repair" value={String(repairCount)} icon={Wrench} tone="repair" detail="Hold for service" /> : null}
              {missingCount > 0 ? <MetricCard href="/inventory?status=missing" label="Missing items" value={String(missingCount)} icon={AlertTriangle} tone="missing" detail="Needs follow-up" /> : null}
              {incompleteKits > 0 ? <MetricCard href="/kits" label="Incomplete kits" value={String(incompleteKits)} icon={AlertTriangle} tone="incomplete" detail="Return still pending" /> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-950 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
                    <div className="mt-2 text-2xl font-semibold">Scan, move, and return gear quickly</div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <QuickActionCard href="/inventory?status=active" title="Active gear" body="See what is out right now." />
                  <QuickActionCard href="/kits" title="Return kits" body="Find kits that still need item checks." />
                  <QuickActionCard href="/scan" title="Scan gear" body="Open the camera and act fast." />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild className="bg-accent text-slate-950 hover:bg-accent/90">
                    <Link href="/scan">Scan</Link>
                  </Button>
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/inventory">Inventory</Link>
                  </Button>
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/kits">Kits</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4">
                <MiniPanel title="Inventory" value={String(totalItems)} description="Tracked gear records" />
                <MiniPanel title="Kits" value={String(totalKits)} description="Ready to scan and return" />
                <MiniPanel title="Locations" value={String(totalLocations)} description="Storage paths in use" />
                <MiniPanel title="Active kits" value={String(activeKits)} description="Currently deployed" />
                <MiniPanel
                  title="Workspace"
                  value={workspaceContext.currentWorkspace?.name ?? "Solo"}
                  description={workspaceContext.authUser?.email ?? "Current setup"}
                />
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
            <CardDescription>Go to</CardDescription>
            <CardTitle>Start where the work is</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickLink href="/inventory" title="Inventory" body="Search and act on gear." />
            <QuickLink href="/kits" title="Kits" body="Check readiness and returns." />
            <QuickLink href="/locations" title="Locations" body="See where gear lives." />
            <QuickLink href="/manage" title="Manage" body="Categories and setup." />
            <QuickLink href="/manage/workspace" title="Workspace" body="Team and access." />
            <QuickLink href="/auth" title="Access" body="Sign in and out." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>At a glance</CardDescription>
            <CardTitle>Status guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Available</span> means at rest in storage or studio.
            </p>
            <p>
              <span className="font-semibold text-foreground">Active</span> means deployed, on truck, or out on a job.
            </p>
            <p>Kits can move as units, but returns still require item-level verification.</p>
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
  href,
  detail,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "light" | "dark" | "active" | "repair" | "missing" | "incomplete";
  href?: string;
  detail?: string;
}) {
  const toneClass =
    tone === "dark"
      ? "rounded-[1.2rem] bg-slate-950 p-4 text-white"
      : tone === "active"
        ? "rounded-[1.2rem] border border-emerald-300 bg-[linear-gradient(180deg,rgba(236,253,245,1),rgba(209,250,229,0.84))] p-4 text-emerald-950 shadow-[0_14px_28px_rgba(16,185,129,0.08)]"
        : tone === "repair"
          ? "rounded-[1.2rem] border border-sky-300 bg-[linear-gradient(180deg,rgba(240,249,255,1),rgba(224,242,254,0.84))] p-4 text-sky-950 shadow-[0_14px_28px_rgba(14,165,233,0.08)]"
          : tone === "missing"
            ? "rounded-[1.2rem] border border-rose-300 bg-[linear-gradient(180deg,rgba(255,241,242,1),rgba(255,228,230,0.9))] p-4 text-rose-950 shadow-[0_14px_28px_rgba(244,63,94,0.08)]"
            : tone === "incomplete"
              ? "rounded-[1.2rem] border border-amber-300 bg-[linear-gradient(180deg,rgba(255,251,235,1),rgba(254,243,199,0.9))] p-4 text-amber-950 shadow-[0_14px_28px_rgba(245,158,11,0.08)]"
              : "rounded-[1.2rem] border border-slate-200 bg-white/75 p-4";

  const content = (
    <div className={cn(toneClass, "transition-transform duration-150 hover:-translate-y-0.5")}>
      <div className="flex items-start justify-between gap-3">
        <div className={tone === "dark" ? "text-sm text-slate-300" : "text-sm font-medium opacity-80"}>{label}</div>
        <div className={cn("rounded-full border px-2 py-2", tone === "dark" ? "border-white/10 bg-white/10" : "border-black/5 bg-white/70")}>
          <Icon className={tone === "dark" ? "h-4 w-4 text-accent" : "h-4 w-4"} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      {detail ? <div className="mt-2 text-xs font-medium uppercase tracking-[0.14em] opacity-70">{detail}</div> : null}
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
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
