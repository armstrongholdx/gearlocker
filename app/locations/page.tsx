import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationCreateForm } from "@/components/forms/location-create-form";
import { Label } from "@/components/ui/label";
import { LocationTree } from "@/components/locations/location-tree";
import type { FormState } from "@/lib/form-state";
import { createErrorFormState, extractFormValues } from "@/lib/form-state";
import { createLocationRecord } from "@/lib/inventory/mutations";
import { getLocationPageData } from "@/lib/inventory/queries";
import { buildLocationTree, flattenLocationTreeOptions } from "@/lib/locations";
import { FolderTree, MapPinned, Package2 } from "lucide-react";
import type { ComponentType } from "react";

export const dynamic = "force-dynamic";

const locationFieldNames = ["name", "code", "description", "parentLocationId"] as const;

async function createLocation(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  "use server";

  try {
    await createLocationRecord(formData);
    redirect(`/locations?success=${encodeURIComponent("Location created.")}`);
  } catch (error) {
    return createErrorFormState(error, extractFormValues(formData, [...locationFieldNames]));
  }

  return state;
}

export default async function LocationsPage({
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locations = await getLocationPageData();
  const roots = buildLocationTree(
    locations.map((location) => ({
      id: location.id,
      name: location.name,
      code: location.code,
      description: location.description,
      parentLocationId: location.parentLocationId,
      itemCount: location._count.items,
      kitCount: location._count.kits,
    })),
  );
  const parentOptions = flattenLocationTreeOptions(roots);
  const totalItems = locations.reduce((sum, location) => sum + location._count.items, 0);
  const totalKits = locations.reduce((sum, location) => sum + location._count.kits, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Locations</div>
          <h1 className="text-3xl font-semibold tracking-tight">Storage hierarchy and physical organization</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Treat locations like folders. The tree should make it obvious where gear lives and how storage is structured.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <LocationStat label="Locations" value={String(locations.length)} icon={FolderTree} />
          <LocationStat label="Assigned items" value={String(totalItems)} icon={Package2} />
          <LocationStat label="Kits placed" value={String(totalKits)} icon={MapPinned} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Hierarchy</CardTitle>
          <p className="text-sm text-muted-foreground">Read this like a storage map. The hierarchy should tell you where gear can actually be found, not just what locations exist.</p>
        </CardHeader>
        <CardContent>
          <LocationTree nodes={roots} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Future map / layout view</CardTitle>
          <p className="text-sm text-muted-foreground">This area is reserved for room maps, rack layouts, shelf zones, and larger facility visualization once Gear Locker expands beyond tree-based browsing.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-[1.05rem] border border-dashed border-slate-300 bg-secondary/40 p-4">Room map overlays</div>
          <div className="rounded-[1.05rem] border border-dashed border-slate-300 bg-secondary/40 p-4">Rack / bay layouts</div>
          <div className="rounded-[1.05rem] border border-dashed border-slate-300 bg-secondary/40 p-4">Shelf / zone visualization</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Create location</CardTitle>
          <p className="text-sm text-muted-foreground">Add new folders to the storage map after checking whether the structure already exists.</p>
        </CardHeader>
        <CardContent className="border-t border-dashed border-slate-200 pt-6">
          <LocationCreateForm action={createLocation} parentOptions={parentOptions} />
        </CardContent>
      </Card>
    </div>
  );
}

function LocationStat({
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
