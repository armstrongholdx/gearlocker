import Link from "next/link";
import { Boxes, FolderCog, Layers3, ShieldCheck, Users } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const [workspaceContext, categoryCount, itemCount, kitCount, locationCount] = await Promise.all([
    getWorkspaceContext(),
    prisma.category.count(),
    prisma.item.count(),
    prisma.kit.count(),
    prisma.location.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Manage</div>
          <h1 className="text-3xl font-semibold tracking-tight">System and product maintenance</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ManageStat label="Categories" value={String(categoryCount)} icon={Layers3} />
          <ManageStat label="Items" value={String(itemCount)} icon={Boxes} />
          <ManageStat label="Kits" value={String(kitCount)} icon={FolderCog} />
          <ManageStat label="Locations" value={String(locationCount)} icon={FolderCog} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="space-y-4 bg-slate-950 p-6 text-white">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Management surfaces</div>
            <div className="text-2xl font-semibold">Operate daily, manage deeply when needed</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ManageLink href="/manage/categories" title="Categories" body="Prefixes, grouping, and browse structure." />
              <ManageLink href="/manage/workspace" title="Workspace" body="Workspace and membership foundations." />
              <ManageLink href="/auth" title="Access" body="Magic-link auth scaffold and session status." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Workspace foundation</CardDescription>
            <CardTitle>{workspaceContext.currentWorkspace?.name ?? "Solo / legacy mode"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              {workspaceContext.workspaceSupportReady
                ? `${workspaceContext.workspaces.length} workspace record(s) available.`
                : "Workspace tables are scaffolded in code, but the database migration may not be applied yet."}
            </div>
            <div>
              Auth session: <span className="font-medium text-foreground">{workspaceContext.authUser?.email ?? "signed out"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ManageStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-white/75 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ManageLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{body}</div>
    </Link>
  );
}
