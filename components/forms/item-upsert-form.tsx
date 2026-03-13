"use client";

import { useActionState } from "react";

import { ItemFormFields, type ItemFormValues } from "@/components/items/item-form-fields";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { createEmptyFormState, type FormState } from "@/lib/form-state";

type Option = {
  id: string;
  name: string;
  prefix?: string;
  parentLocation?: { name: string; parentLocation?: { name: string } | null } | null;
};

export function ItemUpsertForm({
  action,
  categories,
  locations,
  initialValues,
  submitLabel,
  hiddenFields,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: Option[];
  locations: Option[];
  initialValues?: ItemFormValues;
  submitLabel: string;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  const [state, formAction, isPending] = useActionState(action, createEmptyFormState());

  const values = {
    ...initialValues,
    ...(state.values ?? {}),
    isConsumable:
      state.values && "isConsumable" in state.values
        ? state.values.isConsumable === "on"
        : initialValues?.isConsumable ?? false,
    quantity: Number(state.values?.quantity ?? initialValues?.quantity ?? 1),
  } satisfies ItemFormValues;

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {hiddenFields?.map((field) => <input key={field.name} type="hidden" name={field.name} value={field.value} />)}
      <div className="md:col-span-2">
        <FeedbackBanner error={state.status === "error" ? state.message : undefined} />
      </div>
      <ItemFormFields categories={categories} locations={locations} values={values} errors={state.fieldErrors} />
      <div className="rounded-xl border border-dashed bg-secondary/50 px-4 py-3 text-sm text-muted-foreground md:col-span-2">
        Attachments upload is still pending. The rest of the record is ready for real inventory use.
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
