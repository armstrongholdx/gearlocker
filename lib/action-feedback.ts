import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

type FeedbackKind = "error" | "success";

export type FeedbackState = {
  error?: string;
  success?: string;
};

export function buildFeedbackPath(path: string, feedback: FeedbackState) {
  const params = new URLSearchParams();

  if (feedback.error) {
    params.set("error", feedback.error);
  }

  if (feedback.success) {
    params.set("success", feedback.success);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export async function readFeedback(
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>,
) {
  if (!searchParams) {
    return {};
  }

  const resolved = await searchParams;

  return {
    error: getFirstValue(resolved.error),
    success: getFirstValue(resolved.success),
  } satisfies FeedbackState;
}

export function getActionErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return "Please review the form fields and correct any missing or invalid values.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const targets = Array.isArray(error.meta?.target) ? error.meta?.target.map(String) : [];

      if (targets.some((target) => target.includes("assetId"))) {
        return "Asset ID already exists. Please choose a different Asset ID.";
      }

      if (targets.some((target) => target.includes("code"))) {
        return "That code is already in use. Please choose a different code.";
      }

      if (targets.some((target) => target.includes("name"))) {
        return "That name is already in use. Please choose a different name.";
      }

      return "A record with one of these unique values already exists.";
    }

    if (error.code === "P2003") {
      return "A referenced record could not be linked. Please refresh and choose a valid related record.";
    }

    if (error.code === "P2025") {
      return "The record you tried to update no longer exists or could not be found.";
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return "The request could not be processed because some submitted values were invalid.";
  }

  if (error instanceof Error) {
    if (error.message.includes("Invalid status transition")) {
      return "That status change is not allowed from the current item state.";
    }

    if (error.message.includes("does not belong to this kit")) {
      return "That item is not part of this kit.";
    }

    if (error.message.includes("No active return verification")) {
      return "Start a kit return verification session before confirming kit items.";
    }

    if (error.message.includes("must complete item-level return verification")) {
      return "Kits must complete item-level return verification before becoming available again.";
    }

    return error.message;
  }

  return "Something unexpected went wrong. Please try again.";
}

export function buildActionFailurePath(path: string, error: unknown) {
  return buildFeedbackPath(path, { error: getActionErrorMessage(error) });
}

export function buildActionSuccessPath(path: string, message: string) {
  return buildFeedbackPath(path, { success: message });
}

function getFirstValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
