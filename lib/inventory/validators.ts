import { z } from "zod";
import { ConditionGrade, ItemStatus } from "@prisma/client";

import { allowedStatusTransitions } from "@/lib/inventory/domain";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().trim().optional());

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().nonnegative().optional());

const optionalPositiveInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().int().positive().optional());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().date().optional());

export const createItemSchema = z.object({
  assetId: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  categoryId: optionalText,
  status: z.nativeEnum(ItemStatus).default(ItemStatus.available),
  locationId: optionalText,
  brand: optionalText,
  model: optionalText,
  serialNumber: optionalText,
  ownerName: optionalText,
  replacementValue: optionalNumber,
  purchasePrice: optionalNumber,
  purchaseDate: optionalDate,
  purchaseSource: optionalText,
  purchaseReference: optionalText,
  warrantyExpiresAt: optionalDate,
  subcategory: optionalText,
  description: optionalText,
  conditionGrade: z.nativeEnum(ConditionGrade).optional(),
  conditionNotes: optionalText,
  quantity: optionalPositiveInt.default(1),
  isConsumable: z.coerce.boolean().default(false),
  notes: optionalText,
  tagNames: optionalText,
});

export const updateItemSchema = createItemSchema.extend({
  currentAssetId: z.string().trim().min(1),
});

export function assertAllowedTransition(from: ItemStatus, to: ItemStatus) {
  if (!canTransitionStatus(from, to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}.`);
  }
}

function canTransitionStatus(from: ItemStatus, to: ItemStatus) {
  return from === to || allowedStatusTransitions[from].includes(to);
}

export const createKitSchema = z.object({
  name: z.string().trim().min(1).max(160),
  assetId: z.string().trim().min(1).max(64),
  code: optionalText,
  description: optionalText,
  locationId: optionalText,
  notes: optionalText,
  assetIds: optionalText,
});

export const addItemToKitSchema = z.object({
  assetId: z.string().trim().min(1),
  kitId: z.string().trim().min(1),
  quantity: optionalPositiveInt.default(1),
  notes: optionalText,
});

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  code: optionalText,
  description: optionalText,
  parentLocationId: optionalText,
});

export const moveItemSchema = z.object({
  assetId: z.string().trim().min(1),
  locationId: optionalText,
  note: optionalText,
});

export const removeItemFromKitSchema = z.object({
  assetId: z.string().trim().min(1),
  kitId: z.string().trim().min(1),
});

export const addPackageContentSchema = z.object({
  parentAssetId: z.string().trim().min(1),
  childAssetId: z.string().trim().min(1),
  quantity: optionalPositiveInt.default(1),
  notes: optionalText,
});

export const removePackageContentSchema = z.object({
  parentAssetId: z.string().trim().min(1),
  childAssetId: z.string().trim().min(1),
});

export const addPackageChecklistContentSchema = z.object({
  parentAssetId: z.string().trim().min(1),
  label: z.string().trim().min(1).max(160),
  quantity: optionalPositiveInt.default(1),
  notes: optionalText,
});

export const removePackageChecklistContentSchema = z.object({
  parentAssetId: z.string().trim().min(1),
  checklistContentId: z.string().trim().min(1),
});

export const verifyKitItemSchema = z.object({
  assetId: z.string().trim().min(1),
  itemId: z.string().trim().min(1),
  isPresent: z.enum(["present", "missing"]),
  note: optionalText,
});
