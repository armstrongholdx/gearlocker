import { redirect } from "next/navigation";

import { ItemUpsertForm } from "@/components/forms/item-upsert-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormState } from "@/lib/form-state";
import { createErrorFormState, extractFormValues } from "@/lib/form-state";
import { createItemRecord } from "@/lib/inventory/mutations";
import { getItemFormOptions } from "@/lib/inventory/queries";
import { itemDetailPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

const itemFieldNames = [
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

async function createItem(state: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    const item = await createItemRecord(formData);
    redirect(itemDetailPath(item.assetId));
  } catch (error) {
    return createErrorFormState(error, extractFormValues(formData, [...itemFieldNames]));
  }

  return state;
}

export default async function NewItemPage({
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { categories, locations } = await getItemFormOptions({ includeKits: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add item</h1>
        <p className="text-muted-foreground">Pragmatic v1 form for creating inventory records quickly.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New inventory item</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemUpsertForm
            action={createItem}
            categories={categories}
            locations={locations}
            submitLabel="Create item"
            initialValues={{ status: "available", quantity: 1 }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
