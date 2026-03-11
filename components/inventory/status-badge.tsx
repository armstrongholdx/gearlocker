import { Badge } from "@/components/ui/badge";

const variantByStatus = {
  active: "success",
  checked_out: "warning",
  in_repair: "warning",
  missing: "danger",
  stolen: "danger",
  sold: "outline",
  retired: "outline",
} as const;

export function StatusBadge({ status }: { status: keyof typeof variantByStatus }) {
  return <Badge variant={variantByStatus[status]}>{status.replace("_", " ")}</Badge>;
}
