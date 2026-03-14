import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDashed, ClipboardCheck, ScanLine } from "lucide-react";

import { AutoRefresh } from "@/components/realtime/auto-refresh";
import { ReturnSessionScanner } from "@/components/scan/return-session-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { buildLocationPath, itemStatusMeta, kitStatusMeta } from "@/lib/inventory/domain";
import { startKitReturnVerification, verifyKitReturnItem, verifyKitReturnItemByAssetId } from "@/lib/inventory/mutations";
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

async function verifyScannedItem(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await verifyKitReturnItemByAssetId(formData);
    redirect(buildActionSuccessPath(kitReturnPath(assetId), "Scanned kit member verified."));
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
  const pendingCount = latestSession?.items.filter((entry) => !entry.verifiedAt).length ?? kit.items.length;
  const flaggedCount = latestSession?.items.filter((entry) => entry.isPresent === false).length ?? 0;
  const orderedEntries = latestSession
    ? [...latestSession.items].sort((left, right) => {
        const leftRank = left.verifiedAt ? (left.isPresent === false ? 1 : 2) : 0;
        const rightRank = right.verifiedAt ? (right.isPresent === false ? 1 : 2) : 0;
        return leftRank - rightRank;
      })
    : [];
  const progressPercent = expectedCount > 0 ? Math.round((verifiedCount / expectedCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AutoRefresh intervalMs={30000} tables={["Kit", "KitVerificationSession", "KitVerificationItem", "Item", "KitHistoryEvent"]} />
      <FeedbackBanner {...feedback} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Kit return verification</div>
          <h1 className="text-3xl font-semibold tracking-tight">{kit.assetId} · {kit.name}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={itemScanPath(kit.assetId)}>
              <ScanLine className="h-4 w-4" />
              Scan gear
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

      <Card>
        <CardContent
          className={
            pendingCount === 0 && expectedCount > 0
              ? "scan-success-flash space-y-3 p-4"
              : pendingCount > 0
                ? "space-y-3 rounded-[1.25rem] border border-amber-200/70 bg-amber-50/70 p-4"
                : "space-y-3 p-4"
          }
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{pendingCount} still need verification</span>
            <span className="text-muted-foreground">{progressPercent}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={pendingCount === 0 && expectedCount > 0 ? "h-full rounded-full bg-emerald-600 transition-all" : "h-full rounded-full bg-amber-500 transition-all"}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {flaggedCount > 0 ? (
            <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {flaggedCount} item{flaggedCount === 1 ? "" : "s"} currently flagged missing or unreturned.
            </div>
          ) : null}
          {pendingCount > 0 ? (
            <div className="rounded-[1rem] border border-amber-300 bg-amber-100/80 px-3 py-2 text-sm font-medium text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.08)]">
              Kit return is not complete yet. Keep scanning or marking each expected item before moving on.
            </div>
          ) : expectedCount > 0 ? (
            <div className="rounded-[1rem] border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
              Kit complete.
            </div>
          ) : null}
        </CardContent>
      </Card>

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
              orderedEntries.map((entry) => (
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
                        <input
                          name="note"
                          className="flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                          placeholder="Confirmed in case / back on shelf"
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
                        <input
                          name="note"
                          className="flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                          placeholder="Still on truck / missing from case"
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
          <Card className={pendingCount > 0 ? "border-amber-300/70 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)]" : "bg-slate-950 text-white"}>
            <CardHeader>
              <CardTitle className="text-white">{pendingCount > 0 ? "Return in progress" : "Return complete"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {pendingCount > 0 ? (
                <>
                  <p>Keep scanning until every expected item is verified or flagged missing.</p>
                  <p>Anything not verified stays pending.</p>
                </>
              ) : (
                <>
                  <p>All expected items have been accounted for.</p>
                  <p>This kit is ready to go back into storage.</p>
                </>
              )}
            </CardContent>
          </Card>

          {activeSession ? (
            <Card>
              <CardHeader>
                <CardTitle>Scan into session</CardTitle>
              </CardHeader>
              <CardContent>
                <ReturnSessionScanner action={verifyScannedItem} kitAssetId={kit.assetId} />
              </CardContent>
            </Card>
          ) : null}

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
