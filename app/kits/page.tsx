import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, ClipboardCheck, FolderTree } from "lucide-react";
import type { ComponentType } from "react";

import { KitCreateForm } from "@/components/forms/kit-create-form";
import { KitStatusBadge } from "@/components/kits/kit-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildLocationPath } from "@/lib/inventory/domain";
import type { FormState } from "@/lib/form-state";
import { createErrorFormState, extractFormValues } from "@/lib/form-state";
import { createKitRecord } from "@/lib/inventory/mutations";
import { getKitPageData } from "@/lib/inventory/queries";
import { itemDetailPath, itemScanPath, kitDetailPath, kitReturnPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

const kitFieldNames = ["name", "assetId", "code", "description", "locationId", "notes", "assetIds"] as const;

async function createKit(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  try {
    const kit = await createKitRecord(formData);
    redirect(`${kitDetailPath(kit.assetId)}?success=${encodeURIComponent("Kit created.")}`);
  } catch (error) {
    return createErrorFormState(error, extractFormValues(formData, [...kitFieldNames]));
  }

  return state;
}

export default async function KitsPage({
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { kits, locations, items, completenessMap } = await getKitPageData();
  const incompleteKits = [...completenessMap.values()].filter((entry) => entry.completenessStatus === "incomplete").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kits</div>
          <h1 className="text-3xl font-semibold tracking-tight">Package management for repeatable gear sets</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Understand kit readiness, location context, shared items, and return completeness at a glance.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KitStat label="Kits" value={String(kits.length)} icon={Boxes} />
          <KitStat label="Incomplete" value={String(incompleteKits)} icon={ClipboardCheck} />
          <KitStat label="Locations" value={String(locations.length)} icon={FolderTree} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {kits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No kits yet. Use the form above to create your first repeatable package.</CardContent>
          </Card>
        ) : (
          kits.map((kit) => (
            <Card key={kit.id}>
              <CardHeader className="pb-4">
                <CardTitle>
                  <Link href={kitDetailPath(kit.assetId)} className="hover:underline">
                    {kit.assetId} · {kit.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <KitStatusBadge status={kit.status} />
                  <div className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{kit.code ?? "No kit code"}</div>
                </div>
                <p className="text-muted-foreground">{kit.description ?? "No description"}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoTile label="Home location" value={buildLocationPath(kit.location)} />
                  <InfoTile label="Member items" value={`${kit.items.length} items`} />
                </div>
                {(() => {
                  const completeness = completenessMap.get(kit.id);
                  if (!completeness) return null;

                  return (
                    <div className="rounded-[1.1rem] border border-slate-200 bg-secondary/60 p-4">
                      <p>
                        Completeness: <span className="font-medium">{completeness.completenessStatus}</span>
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Missing {completeness.missingItems} · Shared {completeness.sharedItems} · Active {completeness.activeItems}
                      </p>
                    </div>
                  );
                })()}
                {kit.items.length > 0 ? (
                  <div className="rounded-[1.1rem] border border-slate-200 bg-white/70 p-3">
                    {kit.items.map((entry) => (
                      <div key={entry.itemId} className="flex items-center justify-between gap-3 py-2">
                        <Link href={itemDetailPath(entry.item.assetId)} className="hover:underline">
                          {entry.item.assetId} · {entry.item.name}
                        </Link>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">Qty {entry.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={kitDetailPath(kit.assetId)}>Open kit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={kitReturnPath(kit.assetId)}>Return workflow</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={itemScanPath(kit.assetId)}>Scan actions</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create kit</CardTitle>
          <p className="text-sm text-muted-foreground">Creation is secondary to operations here. Use this after you understand the packages that already exist and how they behave.</p>
        </CardHeader>
        <CardContent className="border-t border-dashed border-slate-200 pt-6">
          <KitCreateForm action={createKit} locations={locations} items={items} />
        </CardContent>
      </Card>
    </div>
  );
}

function KitStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-white/75 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.05rem] border border-slate-200 bg-white/75 p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}
