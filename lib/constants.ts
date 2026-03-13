export const itemStatuses = [
  "available",
  "active",
  "in_repair",
  "missing",
  "stolen",
  "sold",
  "retired",
] as const;

export const attachmentTypes = [
  "photo",
  "receipt",
  "serial_photo",
  "manual",
  "warranty",
  "misc",
] as const;

export const historyEventTypes = [
  "created",
  "updated",
  "checked_in",
  "checked_out",
  "moved",
  "repair",
  "missing",
  "stolen",
  "sold",
  "note",
] as const;
