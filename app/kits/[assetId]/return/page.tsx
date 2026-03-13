import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDashed, ClipboardCheck, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { buildLocationPath, itemStatusMeta, kitStatusMeta } from "@/lib/inventory/domain";
import { startKitReturnVerification, verifyKitReturnItem } from "@/lib/inventory/mutations";
import { getKitReturnPageData } from "@/lib/inventory/queries";
import { itemDetailPath, itemScanPath, kitDetailPath, kitReturnPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

async function beginVerification(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await startKitReturnVerification(assetId);
    redirect(buildActionSuccessPath(kitReturnPath(assetId), "Kit return verification started."));
  } catch (error) {
    redirect(buildActionFailurePath(kitReturnPath(assetId), error));
  }
}

async function verifyItem(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await verifyKitReturnItem(formData);
    redirect(buildActionSuccessPath(kitReturnPath(assetId), "Kit verification updated."));
  } catch (error) {
    redirect(buildActionFailurePath(kitReturnPath(assetId), error));
  }
}

export default async function KitReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const kit = await getKitReturnPageData(decodedAssetId);
  const feedback = await readFeedback(searchParams);

  if (!kit) notFound();

  const activeSession = kit.verificationSessions.find((session) => session.status === "in_progress") ?? null;
  const latestSession = activeSession ?? kit.verificationSessions[0] ?? null;
  const verifiedCount = latestSession?.items.filter((entry) => entry.verifiedAt).length ?? 0;
  const expectedCount = latestSession?.items.length ?? kit.items.length;
  const flaggedCount = latestSession?.items.filter((entry) => entry.isPresent === false).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <FeedbackBanner {...feedback} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kit return verification</div>
          <h1 className="text-3xl font-semibold tracking-tight">{kit.assetId} · {kit.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">This workflow treats return as item verification, not a single toggle. The kit is only truly back when every expected item has been confirmed.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={itemScanPath(kit.assetId)}>
              <ScanLine className="h-4 w-4" />
              Scan actions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={kitDetailPath(kit.assetId)}>Back to kit</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ReturnStat label="Kit status" value={kitStatusMeta[kit.status].label} icon={ClipboardCheck} />
        <ReturnStat label="Verified" value={`${verifiedCount} / ${expectedCount}`} icon={CheckCircle2} />
        <ReturnStat label="Flagged missing" value={String(flaggedCount)} icon={AlertTriangle} />
      </div>

      {!activeSession ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Start a return session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">No in-progress verification exists. Start one to confirm each expected item in the kit.</p>
            <form action={beginVerification}>
              <input type="hidden" name="assetId" value={kit.assetId} />
              <Button type="submit">
                <ClipboardCheck className="h-4 w-4" />
                Begin return verification
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Verify expected items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!latestSession ? (
              <p className="text-sm text-muted-foreground">Start a return session to verify kit contents.</p>
            ) : (
              latestSession.items.map((entry) => (
                <div key={entry.itemId} className="rounded-[1.2rem] border border-slate-200 bg-white/80 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <Link href={itemDetailPath(entry.item.assetId)} className="font-medium hover:underline">
                        {entry.item.assetId} · {entry.item.name}
                      </Link>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {buildLocationPath(entry.item.location)} · {itemStatusMeta[entry.item.status].label}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.item.kits.length > 1 ? "Shared across multiple kits" : "Dedicated to this kit"}
                      </div>
                    </div>
                    <VerificationPill
                      state={
                        entry.verifiedAt
                          ? entry.isPresent === false
                            ? "missing"
                            : "present"
                          : "pending"
                      }
                    />
                  </div>

                  {activeSession ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <form action={verifyItem} className="space-y-3 rounded-[1.05rem] border border-emerald-200 bg-emerald-50 p-3">
                        <input type="hidden" name="assetId" value={kit.assetId} />
                        <input type="hidden" name="itemId" value={entry.itemId} />
                        <input type="hidden" name="isPresent" value="present" />
                        <textarea
                          name="note"
                          className="min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                          placeholder="Confirmed in case / returned to shelf / back in studio"
                          defaultValue={entry.note ?? ""}
                        />
                        <Button type="submit" className="w-full">
                          <CheckCircle2 className="h-4 w-4" />
                          Mark present
                        </Button>
                      </form>
                      <form action={verifyItem} className="space-y-3 rounded-[1.05rem] border border-amber-200 bg-amber-50 p-3">
                        <input type="hidden" name="assetId" value={kit.assetId} />
                        <input type="hidden" name="itemId" value={entry.itemId} />
                        <input type="hidden" name="isPresent" value="missing" />
                        <textarea
                          name="note"
                          className="min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                          placeholder="Missing from case / still on truck / not returned yet"
                          defaultValue={entry.note ?? ""}
                        />
                        <Button type="submit" variant="outline" className="w-full">
                          <AlertTriangle className="h-4 w-4" />
                          Mark missing
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">Workflow rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>Scanning or opening a kit return does not automatically check the package back in.</p>
              <p>Each member item must be confirmed present or flagged missing. Once all items are verified, the kit resolves to available or incomplete automatically.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ContextRow label="Home location" value={buildLocationPath(kit.location)} />
              <ContextRow label="Expected items" value={String(kit.items.length)} />
              <ContextRow label="Active session" value={activeSession ? new Date(activeSession.startedAt).toLocaleString() : "No active session"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent kit events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kit.historyEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No kit history yet.</p>
              ) : (
                kit.historyEvents.map((event) => (
                  <div key={event.id} className="rounded-[1.05rem] border border-slate-200 bg-white/75 p-3 text-sm">
                    <div className="font-medium">{event.summary}</div>
                    <div className="mt-1 text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</div>
                    {event.note ? <div className="mt-1 text-muted-foreground">{event.note}</div> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReturnStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ClipboardCheck;
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-white/80 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.05rem] border border-slate-200 bg-white/75 p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}

function VerificationPill({ state }: { state: "pending" | "present" | "missing" }) {
  if (state === "present") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Present
      </div>
    );
  }

  if (state === "missing") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Missing
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-secondary/70 px-3 py-1 text-xs font-medium text-slate-700">
      <CircleDashed className="h-3.5 w-3.5" />
      Pending verification
    </div>
  );
}
