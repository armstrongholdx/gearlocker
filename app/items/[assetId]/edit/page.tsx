import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Box, FolderTree, Package2, Tags } from "lucide-react";

import { ItemUpsertForm } from "@/components/forms/item-upsert-form";
import { type ItemFormValues } from "@/components/items/item-form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateInput } from "@/lib/format";
import type { FormState } from "@/lib/form-state";
import { createErrorFormState, extractFormValues } from "@/lib/form-state";
import { buildLocationPath, itemStatusMeta } from "@/lib/inventory/domain";
import { updateItemRecord } from "@/lib/inventory/mutations";
import { getItemByAssetId, getItemFormOptions } from "@/lib/inventory/queries";
import { itemDetailPath, itemMovePath } from "@/lib/paths";

export const dynamic = "force-dynamic";

const itemFieldNames = [
  "currentAssetId",
  "assetId",
  "name",
  "categoryId",
  "status",
  "locationId",
  "brand",
  "model",
  "subcategory",
  "serialNumber",
  "description",
  "ownerName",
  "conditionGrade",
  "replacementValue",
  "purchasePrice",
  "purchaseDate",
  "purchaseSource",
  "purchaseReference",
  "warrantyExpiresAt",
  "quantity",
  "tagNames",
  "conditionNotes",
  "notes",
  "isConsumable",
] as const;

async function updateItem(state: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    const item = await updateItemRecord(formData);
    redirect(itemDetailPath(item.assetId));
  } catch (error) {
    return createErrorFormState(error, extractFormValues(formData, [...itemFieldNames]));
  }

  return state;
}

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const [item, { categories, locations }] = await Promise.all([getItemByAssetId(decodedAssetId), getItemFormOptions({ includeKits: false })]);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Edit item</div>
          <h1 className="text-3xl font-semibold tracking-tight">{item.assetId} · {item.name}</h1>
          <p className="mt-2 text-muted-foreground">Update the record. Use move and scan for faster field actions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={itemMovePath(item.assetId)}>Move location</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${itemDetailPath(item.assetId)}#package-contents`}>Manage contents</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={itemDetailPath(item.assetId)}>Back to detail</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Record editor</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemUpsertForm
              action={updateItem}
              categories={categories}
              locations={locations}
              submitLabel="Save changes"
              hiddenFields={[{ name: "currentAssetId", value: item.assetId }]}
              initialValues={{
                assetId: item.assetId,
                name: item.name,
                categoryId: item.categoryId,
                status: item.status,
                brand: item.brand,
                model: item.model,
                subcategory: item.subcategory,
                serialNumber: item.serialNumber,
                description: item.description,
                locationId: item.locationId,
                ownerName: item.ownerName,
                conditionGrade: item.conditionGrade,
                replacementValue: item.replacementValue?.toString() ?? "",
                purchasePrice: item.purchasePrice?.toString() ?? "",
                purchaseDate: formatDateInput(item.purchaseDate),
                purchaseSource: item.purchaseSource,
                purchaseReference: item.purchaseReference,
                warrantyExpiresAt: formatDateInput(item.warrantyExpiresAt),
                quantity: item.quantity,
                tagNames: item.tags.map((entry) => entry.tag.name).join(", "),
                conditionNotes: item.conditionNotes,
                notes: item.notes,
                isConsumable: item.isConsumable,
              }}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href={itemDetailPath(item.assetId)}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">Current snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-mono text-xs tracking-[0.18em] text-slate-400">{item.assetId}</div>
                <div className="mt-2 text-xl font-semibold">{item.name}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                  {itemStatusMeta[item.status].label}
                </Badge>
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                  {item.category?.name ?? "Uncategorized"}
                </Badge>
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                  {buildLocationPath(item.location)}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SnapshotChip label="Kits" value={String(item.kits.length)} />
                <SnapshotChip label="Contents" value={String(item.packageContents.length)} />
                <SnapshotChip label="Contained in" value={String(item.containedIn.length)} />
                <SnapshotChip label="Tags" value={String(item.tags.length)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SnapshotRow icon={FolderTree} label="Location" value={buildLocationPath(item.location)} />
              <SnapshotRow icon={Package2} label="Kits" value={item.kits.length ? item.kits.map((entry) => entry.kit.assetId).join(", ") : "Not in a kit"} />
              <SnapshotRow
                icon={Box}
                label="Package contents"
                value={item.packageContents.length ? item.packageContents.map((entry) => entry.childItem.assetId).join(", ") : "No contained items"}
              />
              <SnapshotRow icon={Tags} label="Tags" value={item.tags.length ? item.tags.map((entry) => entry.tag.name).join(", ") : "No tags"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SnapshotChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderTree;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.05rem] border border-slate-200 bg-white/75 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}
