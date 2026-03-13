import { ItemHistoryType, ItemStatus, KitHistoryType, KitStatus, KitVerificationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildQrCodeValue } from "@/lib/paths";
import {
  addPackageChecklistContentSchema,
  addPackageContentSchema,
  addItemToKitSchema,
  assertAllowedTransition,
  createItemSchema,
  createKitSchema,
  createLocationSchema,
  moveItemSchema,
  removePackageChecklistContentSchema,
  removeItemFromKitSchema,
  removePackageContentSchema,
  updateItemSchema,
  verifyKitItemSchema,
} from "@/lib/inventory/validators";

function parseList(value?: string) {
  if (!value) return [];
  return [...new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean))];
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upsertTags(tagNames: string[]) {
  return Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { slug: toSlug(name) },
        update: { name },
        create: { name, slug: toSlug(name) },
      });

      return { tagId: tag.id };
    }),
  );
}

function formDataToItemPayload(formData: FormData) {
  return {
    assetId: formData.get("assetId"),
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status") ?? ItemStatus.available,
    locationId: formData.get("locationId"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    serialNumber: formData.get("serialNumber"),
    ownerName: formData.get("ownerName"),
    replacementValue: formData.get("replacementValue") || undefined,
    purchasePrice: formData.get("purchasePrice") || undefined,
    purchaseDate: formData.get("purchaseDate"),
    purchaseSource: formData.get("purchaseSource"),
    purchaseReference: formData.get("purchaseReference"),
    warrantyExpiresAt: formData.get("warrantyExpiresAt"),
    subcategory: formData.get("subcategory"),
    description: formData.get("description"),
    conditionGrade: formData.get("conditionGrade") || undefined,
    conditionNotes: formData.get("conditionNotes"),
    quantity: formData.get("quantity") || 1,
    isConsumable: formData.get("isConsumable") === "on",
    notes: formData.get("notes"),
    tagNames: formData.get("tagNames"),
  };
}

async function buildItemWriteData(parsed: ReturnType<typeof createItemSchema.parse>) {
  const tagNames = parseList(parsed.tagNames);

  return {
    assetId: parsed.assetId,
    name: parsed.name,
    subcategory: parsed.subcategory || null,
    brand: parsed.brand || null,
    model: parsed.model || null,
    serialNumber: parsed.serialNumber || null,
    description: parsed.description || null,
    conditionGrade: parsed.conditionGrade || null,
    conditionNotes: parsed.conditionNotes || null,
    status: parsed.status,
    purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
    purchasePrice: parsed.purchasePrice ? new Prisma.Decimal(parsed.purchasePrice) : null,
    replacementValue: parsed.replacementValue ? new Prisma.Decimal(parsed.replacementValue) : null,
    purchaseSource: parsed.purchaseSource || null,
    purchaseReference: parsed.purchaseReference || null,
    warrantyExpiresAt: parsed.warrantyExpiresAt ? new Date(parsed.warrantyExpiresAt) : null,
    notes: parsed.notes || null,
    ownerName: parsed.ownerName || null,
    qrCodeValue: buildQrCodeValue(parsed.assetId),
    isConsumable: parsed.isConsumable,
    quantity: parsed.quantity,
    tagConnectData: tagNames.length ? await upsertTags(tagNames) : [],
    categoryId: parsed.categoryId || null,
    locationId: parsed.locationId || null,
  };
}

export async function createItemRecord(formData: FormData) {
  const parsed = createItemSchema.parse(formDataToItemPayload(formData));
  const data = await buildItemWriteData(parsed);
  const { tagConnectData, categoryId, locationId, ...itemData } = data;

  const item = await prisma.item.create({
    data: {
      ...itemData,
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(locationId ? { location: { connect: { id: locationId } } } : {}),
      tags: tagConnectData.length ? { create: tagConnectData } : undefined,
    },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: item.id,
      type: ItemHistoryType.created,
      summary: `Created ${item.assetId}`,
      details: "Item was created from the inventory form.",
      statusTo: item.status,
      locationId: item.locationId,
      note: parsed.notes || null,
      metadata: { source: "createItemRecord" },
    },
  });

  return item;
}

export async function updateItemRecord(formData: FormData) {
  const parsed = updateItemSchema.parse({
    currentAssetId: formData.get("currentAssetId"),
    ...formDataToItemPayload(formData),
  });

  const existing = await prisma.item.findUniqueOrThrow({ where: { assetId: parsed.currentAssetId } });
  const data = await buildItemWriteData(parsed);
  const { tagConnectData, categoryId, locationId, ...itemData } = data;

  const item = await prisma.item.update({
    where: { assetId: parsed.currentAssetId },
    data: {
      ...itemData,
      category: categoryId ? { connect: { id: categoryId } } : { disconnect: true },
      location: locationId ? { connect: { id: locationId } } : { disconnect: true },
      tags: {
        deleteMany: {},
        ...(tagConnectData.length ? { create: tagConnectData } : {}),
      },
    },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: item.id,
      type: ItemHistoryType.updated,
      summary: `Updated ${item.assetId}`,
      details: "Item record was edited.",
      statusFrom: existing.status,
      statusTo: item.status,
      locationId: item.locationId,
      metadata: { source: "updateItemRecord", previousAssetId: existing.assetId },
    },
  });

  return item;
}

export async function transitionItemStatus(formData: FormData) {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as ItemStatus;
  const note = String(formData.get("note") ?? "").trim() || null;
  const locationId = String(formData.get("locationId") ?? "").trim() || null;

  const item = await prisma.item.findUniqueOrThrow({ where: { assetId } });
  assertAllowedTransition(item.status, nextStatus);

  const updated = await prisma.item.update({
    where: { assetId },
    data: {
      status: nextStatus,
      ...(locationId
        ? { location: { connect: { id: locationId } } }
        : {}),
    },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: updated.id,
      type: statusToHistoryType(nextStatus),
      summary: `${updated.assetId} set to ${nextStatus.replaceAll("_", " ")}`,
      details: note,
      note,
      statusFrom: item.status,
      statusTo: nextStatus,
      locationId: updated.locationId,
      metadata: { source: "transitionItemStatus" },
    },
  });

  return updated;
}

export async function moveItemToLocation(formData: FormData) {
  const parsed = moveItemSchema.parse({
    assetId: formData.get("assetId"),
    locationId: formData.get("locationId"),
    note: formData.get("note"),
  });

  const item = await prisma.item.findUniqueOrThrow({
    where: { assetId: parsed.assetId },
    include: { location: true },
  });

  const updated = await prisma.item.update({
    where: { assetId: parsed.assetId },
    data: {
      location: parsed.locationId ? { connect: { id: parsed.locationId } } : { disconnect: true },
    },
    include: { location: true },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: updated.id,
      type: ItemHistoryType.moved,
      summary: `${updated.assetId} moved location`,
      details: parsed.note || null,
      note: parsed.note || null,
      locationId: parsed.locationId || null,
      metadata: {
        source: "moveItemToLocation",
        fromLocationId: item.locationId,
        toLocationId: parsed.locationId || null,
      },
    },
  });

  return updated;
}

function statusToHistoryType(status: ItemStatus): ItemHistoryType {
  if (status === ItemStatus.active) return ItemHistoryType.checked_out;
  if (status === ItemStatus.available) return ItemHistoryType.checked_in;
  if (status === ItemStatus.in_repair) return ItemHistoryType.repair;
  if (status === ItemStatus.missing) return ItemHistoryType.missing;
  if (status === ItemStatus.stolen) return ItemHistoryType.stolen;
  if (status === ItemStatus.sold) return ItemHistoryType.sold;
  return ItemHistoryType.updated;
}

export async function createKitRecord(formData: FormData) {
  const parsed = createKitSchema.parse({
    name: formData.get("name"),
    assetId: formData.get("assetId"),
    code: formData.get("code"),
    description: formData.get("description"),
    locationId: formData.get("locationId"),
    notes: formData.get("notes"),
    assetIds: formData.get("assetIds"),
  });

  const kit = await prisma.kit.create({
    data: {
      name: parsed.name,
      assetId: parsed.assetId,
      code: parsed.code || null,
      description: parsed.description || null,
      locationId: parsed.locationId || null,
      notes: parsed.notes || null,
      status: KitStatus.available,
      qrCodeValue: buildQrCodeValue(parsed.assetId),
    },
  });

  await prisma.kitHistoryEvent.create({
    data: {
      kitId: kit.id,
      type: KitHistoryType.created,
      summary: `Created ${kit.assetId}`,
      details: "Kit was created from the kits page.",
      statusTo: kit.status,
      metadata: { source: "createKitRecord" },
    },
  });

  const assetIds = parseList(parsed.assetIds);
  for (const assetId of assetIds) {
    const item = await prisma.item.findUnique({ where: { assetId } });
    if (!item) continue;

    await prisma.itemKit.upsert({
      where: { itemId_kitId: { itemId: item.id, kitId: kit.id } },
      update: {},
      create: { itemId: item.id, kitId: kit.id },
    });
  }

  return kit;
}

export async function addItemMembershipToKit(formData: FormData) {
  const parsed = addItemToKitSchema.parse({
    assetId: formData.get("assetId"),
    kitId: formData.get("kitId"),
    quantity: formData.get("quantity") || 1,
    notes: formData.get("notes"),
  });

  const item = await prisma.item.findUniqueOrThrow({ where: { assetId: parsed.assetId } });
  const kit = await prisma.kit.findUniqueOrThrow({ where: { id: parsed.kitId } });

  await prisma.itemKit.upsert({
    where: { itemId_kitId: { itemId: item.id, kitId: kit.id } },
    update: { quantity: parsed.quantity, notes: parsed.notes || null },
    create: { itemId: item.id, kitId: kit.id, quantity: parsed.quantity, notes: parsed.notes || null },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: item.id,
      type: ItemHistoryType.updated,
      summary: `${item.assetId} assigned to kit ${kit.assetId}`,
      details: parsed.notes || null,
      metadata: { kitId: kit.id, source: "addItemMembershipToKit" },
    },
  });
}

export async function removeItemMembershipFromKit(formData: FormData) {
  const parsed = removeItemFromKitSchema.parse({
    assetId: formData.get("assetId"),
    kitId: formData.get("kitId"),
  });

  const item = await prisma.item.findUniqueOrThrow({ where: { assetId: parsed.assetId } });
  const kit = await prisma.kit.findUniqueOrThrow({ where: { id: parsed.kitId } });

  await prisma.itemKit.delete({
    where: { itemId_kitId: { itemId: item.id, kitId: kit.id } },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: item.id,
      type: ItemHistoryType.updated,
      summary: `${item.assetId} removed from kit ${kit.assetId}`,
      metadata: { kitId: kit.id, source: "removeItemMembershipFromKit" },
    },
  });
}

export async function addItemPackageContent(formData: FormData) {
  const parsed = addPackageContentSchema.parse({
    parentAssetId: formData.get("parentAssetId"),
    childAssetId: formData.get("childAssetId"),
    quantity: formData.get("quantity") || 1,
    notes: formData.get("notes"),
  });

  if (parsed.parentAssetId === parsed.childAssetId) {
    throw new Error("An item cannot contain itself.");
  }

  const [parentItem, childItem] = await Promise.all([
    prisma.item.findUniqueOrThrow({ where: { assetId: parsed.parentAssetId } }),
    prisma.item.findUniqueOrThrow({ where: { assetId: parsed.childAssetId } }),
  ]);

  await prisma.itemContent.upsert({
    where: { parentItemId_childItemId: { parentItemId: parentItem.id, childItemId: childItem.id } },
    update: { quantity: parsed.quantity, notes: parsed.notes || null },
    create: {
      parentItemId: parentItem.id,
      childItemId: childItem.id,
      quantity: parsed.quantity,
      notes: parsed.notes || null,
    },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: parentItem.id,
      type: ItemHistoryType.updated,
      summary: `${childItem.assetId} added to package contents`,
      details: parsed.notes || null,
      metadata: { childItemId: childItem.id, source: "addItemPackageContent" },
    },
  });
}

export async function removeItemPackageContent(formData: FormData) {
  const parsed = removePackageContentSchema.parse({
    parentAssetId: formData.get("parentAssetId"),
    childAssetId: formData.get("childAssetId"),
  });

  const [parentItem, childItem] = await Promise.all([
    prisma.item.findUniqueOrThrow({ where: { assetId: parsed.parentAssetId } }),
    prisma.item.findUniqueOrThrow({ where: { assetId: parsed.childAssetId } }),
  ]);

  await prisma.itemContent.delete({
    where: { parentItemId_childItemId: { parentItemId: parentItem.id, childItemId: childItem.id } },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: parentItem.id,
      type: ItemHistoryType.updated,
      summary: `${childItem.assetId} removed from package contents`,
      metadata: { childItemId: childItem.id, source: "removeItemPackageContent" },
    },
  });
}

export async function addItemChecklistContent(formData: FormData) {
  const parsed = addPackageChecklistContentSchema.parse({
    parentAssetId: formData.get("parentAssetId"),
    label: formData.get("label"),
    quantity: formData.get("quantity") || 1,
    notes: formData.get("notes"),
  });

  const parentItem = await prisma.item.findUniqueOrThrow({ where: { assetId: parsed.parentAssetId } });

  const checklistEntry = await prisma.itemChecklistContent.create({
    data: {
      parentItemId: parentItem.id,
      label: parsed.label,
      quantity: parsed.quantity,
      notes: parsed.notes || null,
    },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: parentItem.id,
      type: ItemHistoryType.updated,
      summary: `${parsed.label} added to checklist contents`,
      details: parsed.notes || null,
      metadata: { checklistContentId: checklistEntry.id, source: "addItemChecklistContent" },
    },
  });

  return checklistEntry;
}

export async function removeItemChecklistContent(formData: FormData) {
  const parsed = removePackageChecklistContentSchema.parse({
    parentAssetId: formData.get("parentAssetId"),
    checklistContentId: formData.get("checklistContentId"),
  });

  const parentItem = await prisma.item.findUniqueOrThrow({ where: { assetId: parsed.parentAssetId } });
  const checklistEntry = await prisma.itemChecklistContent.findUniqueOrThrow({
    where: { id: parsed.checklistContentId },
  });

  if (checklistEntry.parentItemId !== parentItem.id) {
    throw new Error("Checklist entry does not belong to this item.");
  }

  await prisma.itemChecklistContent.delete({
    where: { id: parsed.checklistContentId },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: parentItem.id,
      type: ItemHistoryType.updated,
      summary: `${checklistEntry.label} removed from checklist contents`,
      metadata: { checklistContentId: checklistEntry.id, source: "removeItemChecklistContent" },
    },
  });
}

export async function setKitStatus(formData: FormData) {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim() as KitStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  const kit = await prisma.kit.findUniqueOrThrow({ where: { assetId } });
  if (nextStatus === KitStatus.available && kit.status !== KitStatus.available) {
    throw new Error("Kits must complete item-level return verification before becoming available again.");
  }

  const updated = await prisma.kit.update({
    where: { assetId },
    data: { status: nextStatus },
  });

  await prisma.kitHistoryEvent.create({
    data: {
      kitId: updated.id,
      type:
        nextStatus === KitStatus.active
          ? KitHistoryType.checked_out
          : nextStatus === KitStatus.incomplete
            ? KitHistoryType.incomplete
            : KitHistoryType.updated,
      summary: `${updated.assetId} set to ${nextStatus}`,
      note,
      statusFrom: kit.status,
      statusTo: nextStatus,
      metadata: { source: "setKitStatus" },
    },
  });

  if (nextStatus === KitStatus.active) {
    await prisma.item.updateMany({
      where: { kits: { some: { kitId: updated.id } }, status: ItemStatus.available },
      data: { status: ItemStatus.active },
    });
  }

  return updated;
}

export async function startKitReturnVerification(assetId: string, note?: string) {
  const kit = await prisma.kit.findUniqueOrThrow({
    where: { assetId },
    include: {
      items: true,
      verificationSessions: {
        where: { status: KitVerificationStatus.in_progress },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  const existingSession = kit.verificationSessions[0];
  if (existingSession) {
    return existingSession;
  }

  const session = await prisma.kitVerificationSession.create({
    data: {
      kitId: kit.id,
      startedNote: note || null,
      items: {
        create: kit.items.map((entry) => ({
          itemId: entry.itemId,
          expected: true,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.kit.update({
    where: { id: kit.id },
    data: { status: KitStatus.incomplete },
  });

  await prisma.kitHistoryEvent.create({
    data: {
      kitId: kit.id,
      type: KitHistoryType.return_started,
      summary: `${kit.assetId} return verification started`,
      note: note || null,
      statusFrom: kit.status,
      statusTo: KitStatus.incomplete,
      metadata: { source: "startKitReturnVerification", sessionId: session.id },
    },
  });

  return session;
}

export async function verifyKitReturnItem(formData: FormData) {
  const parsed = verifyKitItemSchema.parse({
    assetId: formData.get("assetId"),
    itemId: formData.get("itemId"),
    isPresent: formData.get("isPresent"),
    note: formData.get("note"),
  });

  const kit = await prisma.kit.findUniqueOrThrow({
    where: { assetId: parsed.assetId },
    include: {
      verificationSessions: {
        where: { status: KitVerificationStatus.in_progress },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
      items: {
        include: { item: true },
      },
    },
  });

  const session = kit.verificationSessions[0];
  if (!session) {
    throw new Error(`No active return verification exists for kit ${parsed.assetId}.`);
  }

  const membership = kit.items.find((entry) => entry.itemId === parsed.itemId);
  if (!membership) {
    throw new Error("Item does not belong to this kit.");
  }

  const isPresent = parsed.isPresent === "present";

  await prisma.kitVerificationItem.update({
    where: { sessionId_itemId: { sessionId: session.id, itemId: parsed.itemId } },
    data: {
      verifiedAt: new Date(),
      isPresent,
      note: parsed.note || null,
    },
  });

  const nextItemStatus = isPresent ? ItemStatus.available : ItemStatus.missing;
  if (membership.item.status !== nextItemStatus) {
    await prisma.item.update({
      where: { id: membership.itemId },
      data: { status: nextItemStatus },
    });

    await prisma.itemHistoryEvent.create({
      data: {
        itemId: membership.itemId,
        type: isPresent ? ItemHistoryType.checked_in : ItemHistoryType.missing,
        summary: `${membership.item.assetId} verified on kit return`,
        details: parsed.note || null,
        note: parsed.note || null,
        statusFrom: membership.item.status,
        statusTo: nextItemStatus,
        locationId: membership.item.locationId,
        metadata: { source: "verifyKitReturnItem", kitId: kit.id, sessionId: session.id },
      },
    });
  }

  const refreshedSession = await prisma.kitVerificationSession.findUniqueOrThrow({
    where: { id: session.id },
    include: { items: true },
  });

  const outstanding = refreshedSession.items.filter((entry) => !entry.verifiedAt);
  const missing = refreshedSession.items.filter((entry) => entry.isPresent === false);

  if (outstanding.length === 0) {
    const completedStatus = missing.length === 0 ? KitVerificationStatus.completed : KitVerificationStatus.incomplete;

    await prisma.kitVerificationSession.update({
      where: { id: session.id },
      data: {
        status: completedStatus,
        completedAt: new Date(),
      },
    });

    const nextKitStatus = missing.length === 0 ? KitStatus.available : KitStatus.incomplete;
    await prisma.kit.update({
      where: { id: kit.id },
      data: { status: nextKitStatus },
    });

    await prisma.kitHistoryEvent.create({
      data: {
        kitId: kit.id,
        type: missing.length === 0 ? KitHistoryType.return_completed : KitHistoryType.incomplete,
        summary:
          missing.length === 0
            ? `${kit.assetId} return completed`
            : `${kit.assetId} return flagged incomplete`,
        note: parsed.note || null,
        statusFrom: kit.status,
        statusTo: nextKitStatus,
        metadata: {
          source: "verifyKitReturnItem",
          sessionId: session.id,
          missingItemCount: missing.length,
        },
      },
    });
  }

  return { sessionId: session.id };
}

export async function createLocationRecord(formData: FormData) {
  const parsed = createLocationSchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description"),
    parentLocationId: formData.get("parentLocationId"),
  });

  return prisma.location.create({
    data: {
      name: parsed.name,
      code: parsed.code || null,
      description: parsed.description || null,
      parentLocationId: parsed.parentLocationId || null,
    },
  });
}
