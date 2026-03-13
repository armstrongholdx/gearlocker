"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Label } from "@/components/ui/label";
import { createEmptyFormState, type FormState } from "@/lib/form-state";

type LocationCreateValues = {
  name?: string;
  code?: string;
  description?: string;
  parentLocationId?: string;
};

export function LocationCreateForm({
  action,
  parentOptions,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  parentOptions: Array<{ id: string; label: string }>;
}) {
  const [state, formAction, isPending] = useActionState(action, createEmptyFormState());

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <FeedbackBanner error={state.status === "error" ? state.message : undefined} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location-name">Location name</Label>
        <input id="location-name" name="name" defaultValue={state.values?.name ?? ""} placeholder="Camera Shelf B" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" required />
        <FieldError message={state.fieldErrors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location-code">Location code</Label>
        <input id="location-code" name="code" defaultValue={state.values?.code ?? ""} placeholder="LOC-CAM-B" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <FieldError message={state.fieldErrors?.code} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="location-parent">Parent location</Label>
        <select id="location-parent" name="parentLocationId" defaultValue={state.values?.parentLocationId ?? ""} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">No parent location</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Parent locations are shown in hierarchy order so nested storage is easier to understand.</p>
        <FieldError message={state.fieldErrors?.parentLocationId} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="location-description">Description</Label>
        <textarea id="location-description" name="description" defaultValue={state.values?.description ?? ""} placeholder="What is stored here and how it is organized." className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <FieldError message={state.fieldErrors?.description} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create location"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-amber-700">{message}</p>;
}
