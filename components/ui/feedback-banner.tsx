import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function FeedbackBanner({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) {
    return null;
  }

  const isError = Boolean(error);
  const message = error ?? success ?? "";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-[1.1rem] border px-4 py-3 text-sm",
        isError
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900",
      )}
    >
      {isError ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>{message}</div>
    </div>
  );
}
