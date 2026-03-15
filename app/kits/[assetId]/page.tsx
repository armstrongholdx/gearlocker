import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { KitStatus } from "@prisma/client";
import { ArrowRight, CheckCircle2, ClipboardCheck, PackageMinus, PackagePlus, PencilLine, ScanLine } from "lucide-react";

import { KitStatusBadge } from "@/components/kits/kit-status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { buildLocationPath, itemStatusMeta, kitHistoryTypeMeta } from "@/lib/inventory/domain";
import { addItemMembershipToKit, removeItemMembershipFromKit, setKitStatus, startKitReturnVerification, updateKitDetails } from "@/lib/inventory/mutations";
import { prisma } from "@/lib/prisma";
import { getItemFormOptions, getKitByAssetId } from "@/lib/inventory/queries";
import { itemDetailPath, itemScanPath, kitDetailPath, kitLabelPath, kitReturnPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

async function updateKitStatus(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    const kit = await setKitStatus(formData);
    redirect(buildActionSuccessPath(kitDetailPath(kit.assetId), "Kit status updated."));
  } catch (error) {
    redirect(buildActionFailurePath(kitDetailPath(assetId), error));
  }
}

async function beginReturn(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await startKitReturnVerification(assetId);
    redirect(buildActionSuccessPath(kitReturnPath(assetId), "Kit return verification started."));
  } catch (error) {
    redirect(buildActionFailurePath(kitDetailPath(assetId), error));
  }
}

async function addToKit(formData: FormData) {
  "use server";

  const kitId = String(formData.get("kitId") ?? "");

  try {
    await addItemMembershipToKit(formData);
    const kit = await getKitByIdForRedirect(kitId);
    redirect(buildActionSuccessPath(kitDetailPath(kit.assetId), "Item added to kit."));
  } catch (error) {
    const fallbackAssetId = String(formData.get("kitAssetId") ?? "");
    redirect(buildActionFailurePath(kitDetailPath(fallbackAssetId), error));
  }
}

async function removeFromKit(formData: FormData) {
  "use server";

  const kitAssetId = String(formData.get("kitAssetId") ?? "");

  try {
    await removeItemMembershipFromKit(formData);
    redirect(buildActionSuccessPath(kitDetailPath(kitAssetId), "Item removed from kit."));
  } catch (error) {
    redirect(buildActionFailurePath(kitDetailPath(kitAssetId), error));
  }
}

async function saveKitDetails(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await updateKitDetails(formData);
    redirect(buildActionSuccessPath(kitDetailPath(assetId), "Kit details updated."));
  } catch (error) {
    redirect(buildActionFailurePath(kitDetailPath(assetId), error));
  }
}

export default async function KitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const [kit, { locations }] = await Promise.all([getKitByAssetId(decodedAssetId), getItemFormOptions({ includeKits: false })]);
  const feedback = await readFeedback(searchParams);

  if (!kit) notFound();

  const latestVerification = kit.verificationSessions.find((session) => session.status === "in_progress") ?? kit.verificationSessions[0] ?? null;
  const missingEntries =
    latestVerification?.items.filter((entry) => entry.isPresent === false || !entry.verifiedAt).map((entry) => entry.item) ??
    kit.items.filter((entry) => ["missing", "stolen"].includes(entry.item.status)).map((entry) => entry.item);

  return (
    <div className="space-y-6">
      <FeedbackBanner {...feedback} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{kit.assetId}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{kit.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <KitStatusBadge status={kit.status} />
            <span className="text-sm text-muted-foreground">{buildLocationPath(kit.location)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={itemScanPath(kit.assetId)}>
              <ScanLine className="h-4 w-4" />
              Open scan
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={kitLabelPath(kit.assetId)}>Print label</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={kitReturnPath(kit.assetId)}>
              <ClipboardCheck className="h-4 w-4" />
              Return verification
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kit contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kit.items.map((entry) => (
                <details key={entry.itemId} className="group rounded-xl border bg-white/80 p-3 text-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{entry.item.assetId} · {entry.item.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Qty {entry.quantity} · {entry.item.kits.length > 1 ? "Shared item" : "Dedicated"} · {itemStatusMeta[entry.item.status].label}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
                  </summary>
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <div className="text-muted-foreground">
                      {buildLocationPath(entry.item.location)} · {itemStatusMeta[entry.item.status].label}
                    </div>
                    {entry.notes ? <div className="mt-2 text-sm text-muted-foreground">{entry.notes}</div> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={itemDetailPath(entry.item.assetId)}>
                          View item
                        </Link>
                      </Button>
                      <form action={removeFromKit}>
                        <input type="hidden" name="assetId" value={entry.item.assetId} />
                        <input type="hidden" name="kitId" value={kit.id} />
                        <input type="hidden" name="kitAssetId" value={kit.assetId} />
                        <ConfirmSubmitButton
                          type="submit"
                          variant="outline"
                          size="sm"
                          message={`Remove ${entry.item.assetId} from kit ${kit.assetId}?`}
                        >
                          <PackageMinus className="h-3.5 w-3.5" />
                          Remove
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </details>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membership workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add items by asset ID so physical labels and operational references stay aligned with kit membership.
              </p>
              <form action={addToKit} className="grid gap-3 md:grid-cols-[1.2fr_0.5fr]">
                <input type="hidden" name="kitId" value={kit.id} />
                <input type="hidden" name="kitAssetId" value={kit.assetId} />
                <label className="space-y-2 text-sm font-medium">
                  <span>Item asset ID</span>
                  <input
                    name="assetId"
                    placeholder="Enter item asset ID, e.g. CAM-001"
                    className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Quantity</span>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium md:col-span-2">
                  <span>Membership note</span>
                  <textarea
                    name="notes"
                    placeholder="Optional membership note: stays in front pouch / swap body only / backup lens"
                    className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <Button type="submit" className="md:col-span-2">
                  <PackagePlus className="h-4 w-4" />
                  Add item to kit
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Return verification readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>The kit is not considered fully returned until every expected item is verified individually.</p>
              {missingEntries.length === 0 ? (
                <p className="text-muted-foreground">No missing items currently flagged.</p>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="font-medium">Items requiring attention</p>
                  <div className="mt-2 space-y-1">
                    {missingEntries.map((entry) => (
                      <div key={entry.id}>
                        {entry.assetId} · {entry.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link href={kitReturnPath(kit.assetId)}>
                  Open return verification workflow
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kit notes and setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={saveKitDetails} className="space-y-3">
                <input type="hidden" name="assetId" value={kit.assetId} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    <span>Kit name</span>
                    <input name="name" defaultValue={kit.name} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Kit code</span>
                    <input name="code" defaultValue={kit.code ?? ""} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="space-y-2 text-sm font-medium">
                  <span>Home location</span>
                  <select name="locationId" defaultValue={kit.locationId ?? ""} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="">No default location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {buildLocationPath(location)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Description</span>
                  <textarea name="description" defaultValue={kit.description ?? ""} className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Notes</span>
                  <textarea name="notes" defaultValue={kit.notes ?? ""} className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Packing note, missing piece note, prep reminder" />
                </label>
                <Button type="submit" className="w-full">
                  <PencilLine className="h-4 w-4" />
                  Save kit details
                </Button>
              </form>
              {kit.notes ? (
                <div className="rounded-[1rem] border border-slate-200 bg-white/80 p-4 text-sm text-muted-foreground">
                  {kit.notes}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action={updateKitStatus} className="space-y-3">
                <input type="hidden" name="assetId" value={kit.assetId} />
                <select
                  name="nextStatus"
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={kit.status === KitStatus.active ? KitStatus.incomplete : KitStatus.active}
                >
                  {kit.status !== KitStatus.active ? <option value={KitStatus.active}>Check out whole kit</option> : null}
                  <option value={KitStatus.incomplete}>Mark incomplete</option>
                  {kit.status === KitStatus.incomplete ? <option value={KitStatus.available}>Mark complete</option> : null}
                  <option value={KitStatus.retired}>Retire kit</option>
                </select>
                <textarea name="note" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="On truck / out on job / partial return" />
                <Button type="submit" className="w-full">Save kit status</Button>
              </form>
              <form action={beginReturn} className="space-y-3">
                <input type="hidden" name="assetId" value={kit.assetId} />
                <Button type="submit" variant="outline" className="w-full">Begin kit return verification</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kit.historyEvents.map((event) => (
                <div key={event.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.summary}</p>
                    <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-muted-foreground">{kitHistoryTypeMeta[event.type].label}</p>
                  {event.note ? <p className="text-muted-foreground">{event.note}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

async function getKitByIdForRedirect(kitId: string) {
  return prisma.kit.findUniqueOrThrow({
    where: { id: kitId },
    select: { assetId: true },
  });
}
