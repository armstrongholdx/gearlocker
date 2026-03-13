import { ConditionGrade, ItemStatus } from "@prisma/client";
import { CircleDollarSign, MapPinned, Package2, StickyNote } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildLocationPath } from "@/lib/inventory/domain";

type Option = { id: string; name: string; prefix?: string; parentLocation?: { name: string; parentLocation?: { name: string } | null } | null };

export type ItemFormValues = {
  assetId?: string;
  name?: string;
  categoryId?: string | null;
  status?: ItemStatus;
  brand?: string | null;
  model?: string | null;
  subcategory?: string | null;
  serialNumber?: string | null;
  description?: string | null;
  locationId?: string | null;
  ownerName?: string | null;
  conditionGrade?: ConditionGrade | null;
  replacementValue?: string | null;
  purchasePrice?: string | null;
  purchaseDate?: string | null;
  purchaseSource?: string | null;
  purchaseReference?: string | null;
  warrantyExpiresAt?: string | null;
  quantity?: number;
  tagNames?: string;
  conditionNotes?: string | null;
  notes?: string | null;
  isConsumable?: boolean;
};

type ItemFormErrors = Partial<Record<keyof ItemFormValues | "categoryId" | "locationId", string>>;

export function ItemFormFields({
  categories,
  locations,
  values = {},
  errors = {},
}: {
  categories: Option[];
  locations: Option[];
  values?: ItemFormValues;
  errors?: ItemFormErrors;
}) {
  return (
    <>
      <FormSection
        title="Identity"
        description="Asset ID, category, and core gear details."
        icon={Package2}
      >
        <Field>
          <Label htmlFor="assetId">Asset ID</Label>
          <Input id="assetId" name="assetId" placeholder="CAM-001" required defaultValue={values.assetId ?? ""} />
          <FieldError message={errors.assetId} />
        </Field>
        <Field>
          <Label htmlFor="name">Item name</Label>
          <Input id="name" name="name" placeholder="Sony FX6" required defaultValue={values.name ?? ""} />
          <FieldError message={errors.name} />
        </Field>
        <Field>
          <Label htmlFor="categoryId">Category</Label>
          <select id="categoryId" name="categoryId" defaultValue={values.categoryId ?? ""} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} {category.prefix ? `(${category.prefix})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Used for grouping, filters, and suggested ID prefixes.</p>
          <FieldError message={errors.categoryId} />
        </Field>
        <Field>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm" defaultValue={values.status ?? ItemStatus.available}>
            {Object.values(ItemStatus).map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldError message={errors.status} />
        </Field>
        <Field>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" placeholder="Sony" defaultValue={values.brand ?? ""} />
          <FieldError message={errors.brand} />
        </Field>
        <Field>
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" placeholder="FX6" defaultValue={values.model ?? ""} />
          <FieldError message={errors.model} />
        </Field>
        <Field>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input id="subcategory" name="subcategory" placeholder="Cinema camera body" defaultValue={values.subcategory ?? ""} />
          <FieldError message={errors.subcategory} />
        </Field>
        <Field>
          <Label htmlFor="serialNumber">Serial number</Label>
          <Input id="serialNumber" name="serialNumber" defaultValue={values.serialNumber ?? ""} />
          <FieldError message={errors.serialNumber} />
        </Field>
      </FormSection>

      <FormSection
        title="Storage and Condition"
        description="Location, condition, and stock behavior."
        icon={MapPinned}
      >
        <Field>
          <Label htmlFor="locationId">Location</Label>
          <select id="locationId" name="locationId" defaultValue={values.locationId ?? ""} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {buildLocationPath({ name: location.name, parentLocation: location.parentLocation })}
              </option>
            ))}
          </select>
          <FieldError message={errors.locationId} />
        </Field>
        <Field>
          <Label htmlFor="conditionGrade">Condition</Label>
          <select id="conditionGrade" name="conditionGrade" defaultValue={values.conditionGrade ?? ""} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
            <option value="">Not set</option>
            {Object.values(ConditionGrade).map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
          <FieldError message={errors.conditionGrade} />
        </Field>
        <Field>
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue={String(values.quantity ?? 1)} />
          <FieldError message={errors.quantity} />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="conditionNotes">Condition notes</Label>
          <Input id="conditionNotes" name="conditionNotes" placeholder="Minor wear on handle, serviced in 2025" defaultValue={values.conditionNotes ?? ""} />
          <FieldError message={errors.conditionNotes} />
        </Field>
        <label className="flex items-center gap-3 rounded-[1.05rem] border border-dashed border-slate-300 bg-white/70 p-4 text-sm md:col-span-2">
          <input type="checkbox" name="isConsumable" className="h-4 w-4" defaultChecked={values.isConsumable ?? false} />
          Treat this as a consumable or grouped stock entry instead of a single serialized asset.
        </label>
      </FormSection>

      <FormSection
        title="Ownership and Value"
        description="Owner, cost, and replacement context."
        icon={CircleDollarSign}
      >
        <Field>
          <Label htmlFor="ownerName">Owner</Label>
          <Input id="ownerName" name="ownerName" placeholder="William Armstrong" defaultValue={values.ownerName ?? ""} />
          <FieldError message={errors.ownerName} />
        </Field>
        <Field>
          <Label htmlFor="replacementValue">Replacement value</Label>
          <Input id="replacementValue" name="replacementValue" type="number" min="0" step="0.01" defaultValue={values.replacementValue ?? ""} />
          <FieldError message={errors.replacementValue} />
        </Field>
        <Field>
          <Label htmlFor="purchasePrice">Purchase price</Label>
          <Input id="purchasePrice" name="purchasePrice" type="number" min="0" step="0.01" defaultValue={values.purchasePrice ?? ""} />
          <FieldError message={errors.purchasePrice} />
        </Field>
        <Field>
          <Label htmlFor="purchaseDate">Purchase date</Label>
          <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={values.purchaseDate ?? ""} />
          <FieldError message={errors.purchaseDate} />
        </Field>
        <Field>
          <Label htmlFor="purchaseSource">Purchased from</Label>
          <Input id="purchaseSource" name="purchaseSource" placeholder="B&H / Used market / Rental house" defaultValue={values.purchaseSource ?? ""} />
          <FieldError message={errors.purchaseSource} />
        </Field>
        <Field>
          <Label htmlFor="purchaseReference">Purchase reference</Label>
          <Input id="purchaseReference" name="purchaseReference" placeholder="Invoice number / listing URL / order ID" defaultValue={values.purchaseReference ?? ""} />
          <FieldError message={errors.purchaseReference} />
        </Field>
        <Field>
          <Label htmlFor="warrantyExpiresAt">Warranty expires</Label>
          <Input id="warrantyExpiresAt" name="warrantyExpiresAt" type="date" defaultValue={values.warrantyExpiresAt ?? ""} />
          <FieldError message={errors.warrantyExpiresAt} />
        </Field>
      </FormSection>

      <FormSection
        title="Operational Notes"
        description="Tags and working notes."
        icon={StickyNote}
      >
        <Field className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Configuration, color, accessories, distinguishing details" defaultValue={values.description ?? ""} />
          <FieldError message={errors.description} />
        </Field>
        <Field>
          <Label htmlFor="tagNames">Tags</Label>
          <Input id="tagNames" name="tagNames" placeholder="A-Cam, Documentary, Prep Ready" defaultValue={values.tagNames ?? ""} />
          <FieldError message={errors.tagNames} />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea id="notes" name="notes" className="min-h-32 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Purchase notes, kit details, prep notes, or field reminders." defaultValue={values.notes ?? ""} />
          <FieldError message={errors.notes} />
        </Field>
      </FormSection>
    </>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 rounded-[1.35rem] border border-slate-200 bg-white/80 p-5 md:col-span-2 md:grid-cols-2">
      <div className="md:col-span-2 flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-secondary/80 p-2.5">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`space-y-2 ${className ?? ""}`.trim()}>{children}</div>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-amber-700">{message}</p>;
}
