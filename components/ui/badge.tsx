import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]", {
  variants: {
    variant: {
      default: "bg-slate-100 text-slate-700",
      success: "bg-emerald-100 text-emerald-700",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-rose-100 text-rose-700",
      outline: "border border-slate-300 bg-white/70 text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
