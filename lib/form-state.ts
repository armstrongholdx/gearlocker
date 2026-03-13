import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { getActionErrorMessage } from "@/lib/action-feedback";

export type FormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export function createEmptyFormState(): FormState {
  return { status: "idle", fieldErrors: {}, values: {} };
}

export function createErrorFormState(
  error: unknown,
  values: Record<string, string>,
): FormState {
  return {
    status: "error",
    message: getActionErrorMessage(error),
    fieldErrors: getFieldErrors(error),
    values,
  };
}

export function extractFormValues(formData: FormData, fieldNames: string[]) {
  return Object.fromEntries(
    fieldNames.map((fieldName) => [fieldName, stringifyFormValue(formData.get(fieldName))]),
  );
}

function getFieldErrors(error: unknown) {
  if (error instanceof ZodError) {
    const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
    return Object.fromEntries(
      Object.entries(flattened)
        .map(([key, value]) => [key, value?.[0]])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];

    if (targets.some((target) => target.includes("assetId"))) {
      return { assetId: "Asset ID already exists." };
    }

    if (targets.some((target) => target.includes("code"))) {
      return { code: "Code already exists." };
    }

    if (targets.some((target) => target.includes("name"))) {
      return { name: "Name already exists." };
    }
  }

  return {};
}

function stringifyFormValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value;
}
