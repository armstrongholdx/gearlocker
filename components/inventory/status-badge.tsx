import { ItemStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { itemStatusMeta } from "@/lib/inventory/domain";

export function StatusBadge({ status }: { status: ItemStatus }) {
  const meta = itemStatusMeta[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
