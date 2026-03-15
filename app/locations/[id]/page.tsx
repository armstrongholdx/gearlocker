import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FolderTree, Package2, PencilLine } from "lucide-react";

import { InventoryTable } from "@/components/inventory/inventory-table";
import { KitStatusBadge } from "@/components/kits/kit-status-badge";
import { LocationCreateForm } from "@/components/forms/location-create-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import type { FormState } from "@/lib/form-state";
import { createErrorFormState, createSuccessFormState, extractFormValues } from "@/lib/form-state";
import { buildLocationPath } from "@/lib/inventory/domain";
import { updateLocationRecord } from "@/lib/inventory/mutations";
import { getLocationById, getLocationPageData } from "@/lib/inventory/queries";
import { buildLocationTree, flattenLocationTreeOptions } from "@/lib/locations";
import { locationDetailPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

const locationFieldNames = ["locationId", "name", "code", "description", "parentLocationId"] as const;

async function updateLocation(state: FormState, formData: FormData): Promise<FormState> {
  "use server";

  const locationId = String(formData.get("locationId") ?? "");

  try {
    await updateLocationRecord(formData);
    return createSuccessFormState(
      "Location successfully updated.",
      buildActionSuccessPath(locationDetailPath(locationId), "Location successfully updated."),
    );
  } catch (error) {
    return createErrorFormState(error, extractFormValues(formData, [...locationFieldNames]));
  }
}

export default async function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const feedback = await readFeedback(searchParams);
  const [location, allLocations] = await Promise.all([getLocationById(id), getLocationPageData()]);

  if (!location) notFound();

  const roots = buildLocationTree(
    allLocations.map((entry) => ({
      id: entry.id,
      name: entry.name,
      code: entry.code,
      description: entry.description,
      parentLocationId: entry.parentLocationId,
      itemCount: entry._count.items,
      kitCount: entry._count.kits,
    })),
  );
  const parentOptions = flattenLocationTreeOptions(roots).filter((option) => option.id !== location.id);

  return (
    <div className="space-y-6">
      <FeedbackBanner {...feedback} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</div>
          <h1 className="text-3xl font-semibold tracking-tight">{location.name}</h1>
          <p className="mt-2 text-muted-foreground">{buildLocationPath(location)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/locations" className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-medium">
            Back to locations
          </Link>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What is here</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <MetricTile label="Items" value={String(location.items.length)} />
              <MetricTile label="Kits" value={String(location.kits.length)} />
              <MetricTile label="Sub-locations" value={String(location.childLocations.length)} />
            </CardContent>
          </Card>

          {location.kits.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Kits in this location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.kits.map((kit) => (
                  <Link
                    key={kit.id}
                    href={`/kits/${encodeURIComponent(kit.assetId)}`}
                    className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-slate-200 bg-white/80 p-4 transition hover:border-slate-300"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold">{kit.assetId} · {kit.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{kit.items.length} items</div>
                      {kit.notes ? <div className="mt-2 text-sm text-muted-foreground line-clamp-2">{kit.notes}</div> : null}
                    </div>
                    <KitStatusBadge status={kit.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Items in this location</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable items={location.items} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit location</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationCreateForm
                action={updateLocation}
                parentOptions={parentOptions}
                hiddenFields={[{ name: "locationId", value: location.id }]}
                submitLabel="Save location"
                initialValues={{
                  name: location.name,
                  code: location.code ?? "",
                  description: location.description ?? "",
                  parentLocationId: location.parentLocationId ?? "",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ContextRow label="Path" value={buildLocationPath(location)} />
              <ContextRow label="Code" value={location.code ?? "No code"} />
              <ContextRow label="Notes" value={location.description ?? "No notes"} />
            </CardContent>
          </Card>

          {location.childLocations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sub-locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.childLocations.map((child) => (
                  <Link
                    key={child.id}
                    href={locationDetailPath(child.id)}
                    className="flex items-center justify-between gap-3 rounded-[1.05rem] border border-slate-200 bg-white/80 p-3 transition hover:border-slate-300"
                  >
                    <div>
                      <div className="font-medium">{child.name}</div>
                      <div className="text-sm text-muted-foreground">{child._count.items} items · {child._count.kits} kits</div>
                    </div>
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-white/80 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.05rem] border border-slate-200 bg-white/75 p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}
