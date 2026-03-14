import { KitStatus } from "@prisma/client";
import { AlertTriangle, Boxes, CircleSlash2, ScanSearch } from "lucide-react";

import { kitStatusMeta } from "@/lib/inventory/domain";
import { cn } from "@/lib/utils";

export function KitStatusBadge({ status }: { status: KitStatus }) {
  const meta = kitStatusMeta[status];
  const iconMap = {
    available: Boxes,
    active: ScanSearch,
    incomplete: AlertTriangle,
    retired: CircleSlash2,
  } satisfies Record<KitStatus, typeof Boxes>;
  const toneMap = {
    available: "border-slate-300 bg-slate-100 text-slate-700",
    active: "border-emerald-200 bg-emerald-50 text-emerald-800",
    incomplete: "border-amber-200 bg-amber-50 text-amber-900 shadow-[0_0_0_1px_rgba(245,158,11,0.08)]",
    retired: "border-slate-300 bg-slate-100 text-slate-700",
  } satisfies Record<KitStatus, string>;
  const Icon = iconMap[status];

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]", toneMap[status])}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </div>
  );
}
