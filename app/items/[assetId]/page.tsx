import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ComponentType, InputHTMLAttributes } from "react";
import { AttachmentType, ItemStatus } from "@prisma/client";
import { FileStack, FolderTree, Package2, PencilLine, QrCode, Route, Shield } from "lucide-react";

import { StatusBadge } from "@/components/inventory/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import {
  allowedStatusTransitions,
  attachmentTypeMeta,
  buildLocationPath,
  conditionGradeMeta,
  historyTypeMeta,
  itemStatusMeta,
} from "@/lib/inventory/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  addItemChecklistContent,
  addItemMembershipToKit,
  addItemPackageContent,
  moveItemToLocation,
  removeItemChecklistContent,
  removeItemMembershipFromKit,
  removeItemPackageContent,
  transitionItemStatus,
} from "@/lib/inventory/mutations";
import { getItemByAssetId, getItemFormOptions } from "@/lib/inventory/queries";
import {
  buildPublicScanUrl,
  chooseReachableOrigin,
  describeScanReachability,
  isUsingFallbackOrigin,
  itemDetailPath,
  itemEditPath,
  itemLabelPath,
  itemMovePath,
} from "@/lib/paths";
import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

async function updateItemStatus(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await transitionItemStatus(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Item status updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function addToKit(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await addItemMembershipToKit(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Item added to kit."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function removeFromKit(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await removeItemMembershipFromKit(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Item removed from kit."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function moveLocation(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await moveItemToLocation(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Location updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function addPackageContent(formData: FormData) {
  "use server";

  const assetId = String(formData.get("parentAssetId") ?? "");

  try {
    await addItemPackageContent(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Package contents updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function removePackageContent(formData: FormData) {
  "use server";

  const assetId = String(formData.get("parentAssetId") ?? "");

  try {
    await removeItemPackageContent(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Package content removed."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function addChecklistContent(formData: FormData) {
  "use server";

  const assetId = String(formData.get("parentAssetId") ?? "");

  try {
    await addItemChecklistContent(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Checklist contents updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

async function removeChecklistContent(formData: FormData) {
  "use server";

  const assetId = String(formData.get("parentAssetId") ?? "");

  try {
    await removeItemChecklistContent(formData);
    redirect(buildActionSuccessPath(itemDetailPath(assetId), "Checklist content removed."));
  } catch (error) {
    redirect(buildActionFailurePath(itemDetailPath(assetId), error));
  }
}

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const [item, formOptions, requestOrigin] = await Promise.all([
    getItemByAssetId(decodedAssetId),
    getItemFormOptions({ includeItems: true }),
    getRequestOrigin(),
  ]);
  const feedback = await readFeedback(searchParams);

  if (!item) notFound();

  const scanOrigin = chooseReachableOrigin(requestOrigin);
  const publicScanUrl = buildPublicScanUrl(item.assetId, scanOrigin);
  const scanReachability = describeScanReachability(requestOrigin);
  const qrCode = await generateQrCodeDataUrl(publicScanUrl);
  const availableTransitions = Object.entries(itemStatusMeta)
    .filter(([status]) => status !== item.status)
    .map(([status]) => status as ItemStatus)
    .filter((status) => allowedStatusTransitions[item.status].includes(status));
  const attachmentsByType = Object.values(AttachmentType).map((type) => ({
    type,
    ...attachmentTypeMeta[type],
    items: item.attachments.filter((attachment) => attachment.type === type),
  }));
  const packageContentsCount = item.packageContents.length;
  const checklistContentsCount = item.checklistContents.length;
  const containedInCount = item.containedIn.length;

  return (
    <div className="space-y-6">
      <FeedbackBanner {...feedback} />
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="font-mono text-xs tracking-[0.22em] text-slate-400">{item.assetId}</div>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight">{item.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                      {item.category?.name ?? "Uncategorized"}
                    </Badge>
                    <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                      {buildLocationPath(item.location)}
                    </Badge>
                    <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                      {packageContentsCount + checklistContentsCount} contents
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href={itemEditPath(item.assetId)}>
                      <PencilLine className="h-4 w-4" />
                      Edit item
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href="#package-contents">
                      <Package2 className="h-4 w-4" />
                      Contents
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href={itemLabelPath(item.assetId)}>
                      <QrCode className="h-4 w-4" />
                      Print label
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <WorkBadge label="Status" value={itemStatusMeta[item.status].label} />
                  <WorkBadge label="Location" value={buildLocationPath(item.location)} />
                  <WorkBadge label="Kits" value={String(item.kits.length)} />
                  <WorkBadge label="Tracked contents" value={String(packageContentsCount)} />
                  <WorkBadge label="Checklist" value={String(checklistContentsCount)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                <DetailPanel label="Brand / model" value={[item.brand, item.model].filter(Boolean).join(" ") || "Not set"} icon={Package2} />
                <DetailPanel label="Serial number" value={item.serialNumber ?? "Not set"} icon={Shield} />
                <DetailPanel label="Condition" value={item.conditionGrade ? conditionGradeMeta[item.conditionGrade].label : "Not set"} icon={Route} />
                <DetailPanel label="Location path" value={buildLocationPath(item.location)} icon={FolderTree} />
                <DetailPanel label="Owner" value={item.ownerName ?? "Not set"} icon={Shield} />
                <DetailPanel label="Quantity" value={String(item.quantity)} icon={Package2} />
                <DetailPanel label="Consumable" value={item.isConsumable ? "Yes" : "No"} icon={Package2} />
                <DetailPanel label="Subcategory" value={item.subcategory ?? "Not set"} icon={Package2} />
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-secondary/55 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Physical label</div>
                    <div className="mt-1 text-lg font-semibold">Asset ID, item name, QR</div>
                  </div>
                  <QrCode className="h-5 w-5 text-slate-500" />
                </div>
                <div className="mt-5 flex justify-center rounded-[1.1rem] bg-white p-3">
                  <Image src={qrCode} alt={`QR for ${item.assetId}`} width={220} height={220} className="rounded-lg" />
                </div>
                <div className="mt-4">
                  <div className="font-mono text-sm font-semibold">{item.assetId}</div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Scans resolve to <span className="font-mono">{publicScanUrl}</span>
                  </div>
                  {scanReachability.needsLanHostForPhone ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      This QR is still resolving to a loopback address. For iPhone camera scanning, open Gear Locker on your Mac using its LAN address or set NEXT_PUBLIC_APP_URL to that LAN URL instead.
                    </div>
                  ) : null}
                  {isUsingFallbackOrigin(requestOrigin) ? (
                    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                      QR origin is currently being inferred from the active request host: <span className="font-mono">{scanOrigin}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="overflow-hidden">
            <CardContent className="space-y-4 bg-slate-950 p-5 text-white">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Operational controls</div>
                <div className="mt-2 text-2xl font-semibold">Act on this asset first</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickStat label="Status" value={itemStatusMeta[item.status].label} />
                <QuickStat label="Kits" value={String(item.kits.length)} />
                <QuickStat label="Location" value={buildLocationPath(item.location)} />
                <QuickStat label="Contents" value={`${packageContentsCount + checklistContentsCount} inside`} />
              </div>
              <div className="grid gap-3">
                <Button asChild>
                  <Link href={`/scan/${encodeURIComponent(item.assetId)}`}>
                    <QrCode className="h-4 w-4" />
                    Open scan action panel
                  </Link>
                </Button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href={itemMovePath(item.assetId)}>
                      <Route className="h-4 w-4" />
                      Move item
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href={itemLabelPath(item.assetId)}>
                      <QrCode className="h-4 w-4" />
                      Print label
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Record maintenance</CardDescription>
              <CardTitle>Edit and administrative actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" asChild>
                <Link href={itemEditPath(item.assetId)}>
                  <PencilLine className="h-4 w-4" />
                  Edit record
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card id="package-contents">
            <CardHeader>
              <CardDescription>Status</CardDescription>
              <CardTitle>Deploy or return this item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.15rem] border border-slate-200 bg-white/75 p-4 text-sm">
                Current status: <span className="font-semibold">{itemStatusMeta[item.status].label}</span>
              </div>
              {availableTransitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">This item is in a terminal state and cannot transition from the current UI.</p>
              ) : (
                <form action={updateItemStatus} className="space-y-3">
                  <input type="hidden" name="assetId" value={item.assetId} />
                  <select name="nextStatus" className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm" defaultValue={availableTransitions[0]}>
                    {availableTransitions.map((status) => (
                      <option key={status} value={status}>
                        {itemStatusMeta[status].label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="note"
                    className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                    placeholder="On job / back in storage / sent to repair"
                  />
                  <Button type="submit" className="w-full">
                    Save status update
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Movement</CardDescription>
              <CardTitle>Reassign storage location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[1.15rem] border border-slate-200 bg-white/75 p-4 text-sm">
                Current location: <span className="font-semibold">{buildLocationPath(item.location)}</span>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href={itemMovePath(item.assetId)}>
                  Open dedicated move workflow
                </Link>
              </Button>
              <form action={moveLocation} className="space-y-3">
                <input type="hidden" name="assetId" value={item.assetId} />
                <select name="locationId" className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm" defaultValue={item.locationId ?? ""}>
                  <option value="">Unassigned</option>
                  {formOptions.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {buildLocationPath(location)}
                    </option>
                  ))}
                </select>
                <textarea
                  name="note"
                  className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Moved after prep / re-shelved / transferred to truck"
                />
                <Button type="submit" variant="outline" className="w-full">
                  Save location move
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Package contents</CardDescription>
              <CardTitle>Case / box contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Tracked" value={String(packageContentsCount)} hint="Linked inventory items" />
                <SummaryCard label="Checklist" value={String(checklistContentsCount)} hint="Expected accessories" />
                <SummaryCard label="Contained in" value={String(containedInCount)} hint="Parent package records" />
                <SummaryCard label="Shared with kits" value={String(item.packageContents.filter((entry) => entry.childItem.kits.length > 0).length)} hint="Tracked contents also in kits" />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tracked contents</div>
                      <Badge variant="outline">{packageContentsCount}</Badge>
                    </div>
                  {item.packageContents.length === 0 ? (
                    <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-secondary/40 p-4 text-sm text-muted-foreground">
                      No linked tracked contents yet.
                    </div>
                  ) : (
                    item.packageContents.map((entry) => (
                      <div key={entry.childItemId} className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={itemDetailPath(entry.childItem.assetId)} className="font-semibold hover:underline">
                              {entry.childItem.assetId} · {entry.childItem.name}
                            </Link>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge>Qty {entry.quantity}</Badge>
                              <Badge variant="outline">{buildLocationPath(entry.childItem.location)}</Badge>
                              {entry.childItem.kits.length > 0 ? <Badge variant="outline">In kit</Badge> : null}
                            </div>
                          </div>
                          <form action={removePackageContent}>
                            <input type="hidden" name="parentAssetId" value={item.assetId} />
                            <input type="hidden" name="childAssetId" value={entry.childItem.assetId} />
                            <ConfirmSubmitButton
                              type="submit"
                              variant="ghost"
                              size="sm"
                              message={`Remove ${entry.childItem.assetId} from the package contents of ${item.assetId}?`}
                            >
                              Remove
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                        {entry.notes ? <p className="mt-3 text-sm text-muted-foreground">{entry.notes}</p> : null}
                      </div>
                    ))
                  )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Checklist contents</div>
                      <Badge variant="outline">{checklistContentsCount}</Badge>
                    </div>
                    {item.checklistContents.length === 0 ? (
                      <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-secondary/40 p-4 text-sm text-muted-foreground">
                        No checklist entries yet.
                      </div>
                    ) : (
                      item.checklistContents.map((entry) => (
                        <div key={entry.id} className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold">{entry.label}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge>Qty {entry.quantity}</Badge>
                                <Badge variant="outline">Checklist</Badge>
                              </div>
                            </div>
                            <form action={removeChecklistContent}>
                              <input type="hidden" name="parentAssetId" value={item.assetId} />
                              <input type="hidden" name="checklistContentId" value={entry.id} />
                              <ConfirmSubmitButton
                                type="submit"
                                variant="ghost"
                                size="sm"
                                message={`Remove checklist entry ${entry.label} from ${item.assetId}?`}
                              >
                                Remove
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                          {entry.notes ? <p className="mt-3 text-sm text-muted-foreground">{entry.notes}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-secondary/40 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Add tracked item</div>
                    <form action={addPackageContent} className="mt-3 space-y-3">
                      <input type="hidden" name="parentAssetId" value={item.assetId} />
                      <label className="space-y-2 text-sm font-medium">
                        <span>Item</span>
                        <select name="childAssetId" className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
                          {formOptions.items
                            .filter((candidate) => candidate.assetId !== item.assetId)
                            .map((candidate) => (
                              <option key={candidate.id} value={candidate.assetId}>
                                {candidate.assetId} · {candidate.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                        <label className="space-y-2 text-sm font-medium">
                          <span>Qty</span>
                          <InputLike name="quantity" type="number" defaultValue="1" min="1" />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                          <span>Note</span>
                          <InputLike name="notes" placeholder="Cable in lid pouch" />
                        </label>
                      </div>
                      <Button type="submit" variant="outline" className="w-full">
                        Add content
                      </Button>
                    </form>
                  </div>

                  <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-secondary/40 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Add checklist entry</div>
                    <form action={addChecklistContent} className="mt-3 space-y-3">
                      <input type="hidden" name="parentAssetId" value={item.assetId} />
                      <label className="space-y-2 text-sm font-medium">
                        <span>Name</span>
                        <InputLike name="label" placeholder="Cone reflector" />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                        <label className="space-y-2 text-sm font-medium">
                          <span>Qty</span>
                          <InputLike name="quantity" type="number" defaultValue="1" min="1" />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                          <span>Note</span>
                          <InputLike name="notes" placeholder="Small accessory / not tracked individually" />
                        </label>
                      </div>
                      <Button type="submit" variant="outline" className="w-full">
                        Add checklist content
                      </Button>
                    </form>
                  </div>

                  <div className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Contained in</div>
                    <div className="mt-3 space-y-3">
                      {item.containedIn.length === 0 ? (
                        <div className="text-sm text-muted-foreground">This item is not listed inside another package.</div>
                      ) : (
                        item.containedIn.map((entry) => (
                          <div key={entry.parentItemId} className="rounded-xl bg-secondary/55 p-3">
                            <Link href={itemDetailPath(entry.parentItem.assetId)} className="font-medium hover:underline">
                              {entry.parentItem.assetId} · {entry.parentItem.name}
                            </Link>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Qty {entry.quantity}
                              {entry.notes ? ` · ${entry.notes}` : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Ownership and value</CardDescription>
              <CardTitle>Purchase / insurance context</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <DetailPanel label="Purchase date" value={formatDate(item.purchaseDate)} icon={Shield} />
              <DetailPanel label="Purchase price" value={formatCurrency(item.purchasePrice ? Number(item.purchasePrice) : null, item.currency)} icon={Shield} />
              <DetailPanel label="Replacement value" value={formatCurrency(item.replacementValue ? Number(item.replacementValue) : null, item.currency)} icon={Shield} />
              <DetailPanel label="Purchased from" value={item.purchaseSource ?? "Not set"} icon={Shield} />
              <DetailPanel label="Purchase reference" value={item.purchaseReference ?? "Not set"} icon={Shield} />
              <DetailPanel label="Warranty expires" value={formatDate(item.warrantyExpiresAt)} icon={Shield} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Attachments</CardDescription>
              <CardTitle>Documents and visual records</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {attachmentsByType.map((group) => (
                <div key={group.type} className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{group.label}</p>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                    <FileStack className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {group.items.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No files yet.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {group.items.map((attachment) => (
                        <div key={attachment.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
                          <p className="font-medium">{attachment.title ?? attachment.fileName}</p>
                          <p className="text-muted-foreground">
                            {attachment.mimeType ?? "Unknown type"}
                            {attachment.storageBucket ? ` · ${attachment.storageBucket}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Kit membership</CardDescription>
              <CardTitle>Where this item belongs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.kits.length === 0 ? (
                <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-secondary/50 p-4 text-sm text-muted-foreground">
                  No kits assigned yet.
                </div>
              ) : (
                item.kits.map((entry) => (
                  <div key={entry.kitId} className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{entry.kit.assetId} · {entry.kit.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {buildLocationPath(entry.kit.location)} · Qty {entry.quantity}
                        </p>
                      </div>
                      <form action={removeFromKit}>
                        <input type="hidden" name="assetId" value={item.assetId} />
                        <input type="hidden" name="kitId" value={entry.kitId} />
                        <ConfirmSubmitButton
                          type="submit"
                          variant="ghost"
                          size="sm"
                          message={`Remove ${item.assetId} from kit ${entry.kit.assetId}?`}
                        >
                          Remove
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                    {entry.notes ? <p className="mt-3 text-sm text-muted-foreground">{entry.notes}</p> : null}
                  </div>
                ))
              )}

              {formOptions.kits.length > 0 ? (
                <form action={addToKit} className="space-y-3 rounded-[1.15rem] border border-dashed border-slate-300 bg-secondary/40 p-4">
                  <input type="hidden" name="assetId" value={item.assetId} />
                  <label className="space-y-2 text-sm font-medium">
                    <span>Kit</span>
                    <select name="kitId" className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm">
                      {formOptions.kits.map((kit) => (
                        <option key={kit.id} value={kit.id}>
                          {kit.assetId} · {kit.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Quantity</span>
                    <InputLike name="quantity" type="number" defaultValue="1" min="1" />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Kit note</span>
                    <textarea name="notes" className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Optional kit-specific note" />
                  </label>
                  <Button type="submit" variant="outline" className="w-full">
                    Add to kit
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>History</CardDescription>
              <CardTitle>Operational timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.historyEvents.map((event) => (
                <div key={event.id} className="relative pl-5">
                  <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                  <div className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{event.summary}</p>
                      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{formatDate(event.timestamp)}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {historyTypeMeta[event.type].label}
                      {event.statusFrom && event.statusTo ? ` · ${itemStatusMeta[event.statusFrom].label} -> ${itemStatusMeta[event.statusTo].label}` : ""}
                      {event.location ? ` · ${buildLocationPath(event.location)}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{event.note ?? event.details ?? "No additional notes"}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function DetailPanel({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-3 text-sm font-medium">{value}</p>
    </div>
  );
}

function WorkBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white/70 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.05rem] border border-slate-200 bg-white/70 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
    </div>
  );
}

function InputLike(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm" />;
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
