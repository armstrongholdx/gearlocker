import { AttachmentType, ConditionGrade, ItemHistoryType, ItemStatus, KitHistoryType, KitStatus } from "@prisma/client";

export const itemStatusMeta: Record<
  ItemStatus,
  { label: string; variant: "success" | "warning" | "danger" | "outline" | "default"; canCheckOut: boolean; canCheckIn: boolean }
> = {
  available: { label: "Available", variant: "default", canCheckOut: true, canCheckIn: false },
  active: { label: "Active", variant: "success", canCheckOut: false, canCheckIn: true },
  in_repair: { label: "In repair", variant: "warning", canCheckOut: false, canCheckIn: true },
  missing: { label: "Missing", variant: "danger", canCheckOut: false, canCheckIn: false },
  stolen: { label: "Stolen", variant: "danger", canCheckOut: false, canCheckIn: false },
  sold: { label: "Sold", variant: "outline", canCheckOut: false, canCheckIn: false },
  retired: { label: "Retired", variant: "outline", canCheckOut: false, canCheckIn: false },
};

export const kitStatusMeta: Record<
  KitStatus,
  { label: string; variant: "success" | "warning" | "danger" | "outline" | "default" }
> = {
  available: { label: "Available", variant: "default" },
  active: { label: "Active", variant: "success" },
  incomplete: { label: "Incomplete", variant: "warning" },
  retired: { label: "Retired", variant: "outline" },
};

export const conditionGradeMeta: Record<ConditionGrade, { label: string }> = {
  excellent: { label: "Excellent" },
  good: { label: "Good" },
  fair: { label: "Fair" },
  poor: { label: "Poor" },
  damaged: { label: "Damaged" },
};

export const attachmentTypeMeta: Record<AttachmentType, { label: string; description: string }> = {
  photo: { label: "Photos", description: "Reference images and hero shots." },
  receipt: { label: "Receipts", description: "Proof of purchase and invoices." },
  serial_photo: { label: "Serial Photos", description: "Closeups used for verification." },
  manual: { label: "Manuals", description: "Operating guides and spec sheets." },
  warranty: { label: "Warranty", description: "Coverage documents and registration files." },
  misc: { label: "Misc", description: "Anything that does not fit the standard buckets." },
};

export const historyTypeMeta: Record<ItemHistoryType, { label: string }> = {
  created: { label: "Created" },
  updated: { label: "Updated" },
  checked_in: { label: "Checked in" },
  checked_out: { label: "Checked out" },
  moved: { label: "Moved" },
  repair: { label: "Repair" },
  missing: { label: "Missing" },
  stolen: { label: "Stolen" },
  sold: { label: "Sold" },
  note: { label: "Note" },
};

export const kitHistoryTypeMeta: Record<KitHistoryType, { label: string }> = {
  created: { label: "Created" },
  updated: { label: "Updated" },
  checked_out: { label: "Checked out" },
  return_started: { label: "Return started" },
  return_completed: { label: "Return completed" },
  incomplete: { label: "Incomplete" },
  note: { label: "Note" },
};

export const allowedStatusTransitions: Record<ItemStatus, ItemStatus[]> = {
  available: ["active", "in_repair", "missing", "sold", "retired"],
  active: ["available", "in_repair", "missing"],
  in_repair: ["available", "retired"],
  missing: ["available", "stolen", "retired"],
  stolen: [],
  sold: [],
  retired: [],
};

export function canTransitionStatus(from: ItemStatus, to: ItemStatus) {
  return from === to || allowedStatusTransitions[from].includes(to);
}

export function buildLocationPath(location: { name: string; parentLocation?: { name: string; parentLocation?: unknown } | null } | null): string {
  if (!location) {
    return "Unassigned";
  }

  const names: string[] = [];
  let current: { name: string; parentLocation?: { name: string; parentLocation?: unknown } | null } | null | undefined = location;

  while (current) {
    names.unshift(current.name);
    current = current.parentLocation as typeof current;
  }

  return names.join(" / ");
}
