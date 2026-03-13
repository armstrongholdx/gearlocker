import { KitStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { kitStatusMeta } from "@/lib/inventory/domain";

export function KitStatusBadge({ status }: { status: KitStatus }) {
  const meta = kitStatusMeta[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
