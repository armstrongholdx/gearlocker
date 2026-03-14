import { ItemStatus } from "@prisma/client";
import { AlertTriangle, CircleSlash2, ScanSearch, ShieldAlert, Wrench, Warehouse } from "lucide-react";

import { itemStatusMeta } from "@/lib/inventory/domain";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ItemStatus }) {
  const meta = itemStatusMeta[status];
  const iconMap = {
    available: Warehouse,
    active: ScanSearch,
    in_repair: Wrench,
    missing: AlertTriangle,
    stolen: ShieldAlert,
    sold: CircleSlash2,
    retired: CircleSlash2,
  } satisfies Record<ItemStatus, typeof Warehouse>;
  const toneMap = {
    available: "border-slate-300 bg-slate-100 text-slate-700",
    active: "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]",
    in_repair: "border-sky-200 bg-sky-50 text-sky-900 shadow-[0_0_0_1px_rgba(14,165,233,0.08)]",
    missing: "border-rose-200 bg-rose-50 text-rose-800",
    stolen: "border-rose-300 bg-rose-100 text-rose-900",
    sold: "border-slate-300 bg-slate-100 text-slate-700",
    retired: "border-slate-300 bg-slate-100 text-slate-700",
  } satisfies Record<ItemStatus, string>;
  const Icon = iconMap[status];

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]", toneMap[status])}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </div>
  );
}
