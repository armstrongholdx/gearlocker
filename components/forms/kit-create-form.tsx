"use client";

import { useActionState, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Label } from "@/components/ui/label";
import { createEmptyFormState, type FormState } from "@/lib/form-state";
import { buildLocationPath } from "@/lib/inventory/domain";

type LocationOption = {
  id: string;
  name: string;
  parentLocation?: { name: string; parentLocation?: { name: string } | null } | null;
};

type ItemOption = {
  assetId: string;
  name: string;
  status: string;
};

type KitCreateValues = {
  name?: string;
  assetId?: string;
  code?: string;
  locationId?: string;
  assetIds?: string;
  description?: string;
  notes?: string;
};

export function KitCreateForm({
  action,
  locations,
  items,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locations: LocationOption[];
  items: ItemOption[];
}) {
  const [state, formAction, isPending] = useActionState(action, createEmptyFormState());
  const [query, setQuery] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    state.values?.assetIds ? String(state.values.assetIds).split(",").map((entry) => entry.trim()).filter(Boolean) : [],
  );

  useEffect(() => {
    const next = state.values?.assetIds ? String(state.values.assetIds).split(",").map((entry) => entry.trim()).filter(Boolean) : [];
    setSelectedAssetIds(next);
  }, [state.values?.assetIds]);

  const selectedItems = items.filter((item) => selectedAssetIds.includes(item.assetId));
  const suggestions = items
    .filter((item) => !selectedAssetIds.includes(item.assetId))
    .filter((item) => {
      const haystack = `${item.assetId} ${item.name}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .slice(0, 6);

  function addAssetId(assetId: string) {
    const next = [...selectedAssetIds, assetId];
    setSelectedAssetIds(next);
    setQuery("");
  }

  function removeAssetId(assetId: string) {
    const next = selectedAssetIds.filter((entry) => entry !== assetId);
    setSelectedAssetIds(next);
  }

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <FeedbackBanner error={state.status === "error" ? state.message : undefined} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kit-name">Kit name</Label>
        <input id="kit-name" name="name" placeholder="Documentary A-Cam" defaultValue={state.values?.name ?? ""} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" required />
        <FieldError message={state.fieldErrors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kit-asset-id">Kit asset ID</Label>
        <input id="kit-asset-id" name="assetId" placeholder="KIT-001" defaultValue={state.values?.assetId ?? ""} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" required />
        <FieldError message={state.fieldErrors?.assetId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kit-code">Kit code</Label>
        <input id="kit-code" name="code" placeholder="KIT-DOC-A" defaultValue={state.values?.code ?? ""} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <FieldError message={state.fieldErrors?.code} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kit-location">Home location</Label>
        <select id="kit-location" name="locationId" defaultValue={state.values?.locationId ?? ""} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">No default location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {buildLocationPath(location)}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.locationId} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="kit-member-search">Kit members</Label>
        <input type="hidden" name="assetIds" value={selectedAssetIds.join(", ")} />
        <div className="rounded-[1rem] border border-slate-200 bg-white/80 p-3">
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              id="kit-member-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search existing items by asset ID or name"
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </div>
          {selectedItems.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <button
                  key={item.assetId}
                  type="button"
                  onClick={() => removeAssetId(item.assetId)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-secondary/70 px-3 py-1 text-sm"
                >
                  {item.assetId} · {item.name}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Selected items will appear here. This speeds up kit creation and reduces asset ID typing errors.</p>
          )}
          {query ? (
            <div className="mt-3 space-y-2 rounded-[1rem] border border-slate-200 bg-white p-2">
              {suggestions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No matching items.</div>
              ) : (
                suggestions.map((item) => (
                  <button
                    key={item.assetId}
                    type="button"
                    onClick={() => addAssetId(item.assetId)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary/70"
                  >
                    <span>{item.assetId} · {item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.status.replaceAll("_", " ")}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        <FieldError message={state.fieldErrors?.assetIds} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="kit-description">Description</Label>
        <textarea id="kit-description" name="description" defaultValue={state.values?.description ?? ""} placeholder="What belongs in the kit and how it is used." className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <FieldError message={state.fieldErrors?.description} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="kit-notes">Notes</Label>
        <textarea id="kit-notes" name="notes" defaultValue={state.values?.notes ?? ""} placeholder="Packing note, prep note, missing pieces, etc." className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <FieldError message={state.fieldErrors?.notes} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create kit"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-amber-700">{message}</p>;
}
