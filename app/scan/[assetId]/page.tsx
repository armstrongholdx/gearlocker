import Link from "next/link";
import { redirect } from "next/navigation";
import { KitStatus } from "@prisma/client";
import { ArrowRight, Boxes, ClipboardCheck, Eye, MapPinned, QrCode, Wrench } from "lucide-react";
import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";

import { StatusBadge } from "@/components/inventory/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { allowedStatusTransitions, buildLocationPath, itemStatusMeta } from "@/lib/inventory/domain";
import { moveItemToLocation, setKitStatus, startKitReturnVerification, transitionItemStatus } from "@/lib/inventory/mutations";
import { getItemFormOptions, resolveScannableEntity } from "@/lib/inventory/queries";
import { itemDetailPath, itemMovePath, itemScanPath, kitDetailPath, kitReturnPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

async function scanTransitionItem(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await transitionItemStatus(formData);
    redirect(buildActionSuccessPath(itemScanPath(assetId), "Item updated from scan actions."));
  } catch (error) {
    redirect(buildActionFailurePath(itemScanPath(assetId), error));
  }
}

async function scanMoveItem(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await moveItemToLocation(formData);
    redirect(buildActionSuccessPath(itemScanPath(assetId), "Item location updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemScanPath(assetId), error));
  }
}

async function scanUpdateKit(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await setKitStatus(formData);
    redirect(buildActionSuccessPath(itemScanPath(assetId), "Kit status updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemScanPath(assetId), error));
  }
}

async function scanStartKitReturn(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    await startKitReturnVerification(assetId);
    redirect(buildActionSuccessPath(kitReturnPath(assetId), "Kit return verification started."));
  } catch (error) {
    redirect(buildActionFailurePath(itemScanPath(assetId), error));
  }
}

export default async function ScanResolverPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assetId } = await params;
  const decodedAssetId = decodeURIComponent(assetId);
  const [resolved, options] = await Promise.all([resolveScannableEntity(decodedAssetId), getItemFormOptions({ includeKits: false })]);
  const feedback = await readFeedback(searchParams);

  if (!resolved) {
    return (
      <div className="space-y-4">
        <FeedbackBanner {...feedback} />
        <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white/75 p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Scan</div>
          <h1 className="mt-2 text-2xl font-semibold">Asset not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">No item or kit matched {decodedAssetId}.</p>
        </div>
      </div>
    );
  }

  if (resolved.type === "item") {
    const transitions = allowedStatusTransitions[resolved.entity.status];
    const canCheckOut = transitions.includes("active");
    const canCheckIn = transitions.includes("available");
    const canRepair = transitions.includes("in_repair");
    const canMarkMissing = transitions.includes("missing");

    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <FeedbackBanner {...feedback} />
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="space-y-4 bg-slate-950 p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Item scan</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{resolved.entity.assetId}</h1>
                <div className="mt-1 text-sm text-slate-300 sm:text-base">{resolved.entity.name}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={resolved.entity.status} />
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                  {buildLocationPath(resolved.entity.location)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <ScanMetaPill label="Location" value={buildLocationPath(resolved.entity.location)} />
              <ScanMetaPill label="Kits" value={String(resolved.entity._count.kits)} />
              <ScanMetaPill label="Tracked" value={String(resolved.entity._count.packageContents)} />
              <ScanMetaPill label="Checklist" value={String(resolved.entity._count.checklistContents)} />
              <ScanMetaPill label="Status" value={itemStatusMeta[resolved.entity.status].label} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {canCheckOut ? (
            <ActionCard title="Check out" icon={QrCode}>
              <form action={scanTransitionItem} className="space-y-2">
                <input type="hidden" name="assetId" value={resolved.entity.assetId} />
                <input type="hidden" name="nextStatus" value="active" />
                <CompactInput name="note" placeholder="On job / deployed" />
                <Button type="submit" className="w-full">Check out</Button>
              </form>
            </ActionCard>
          ) : null}

          {canCheckIn ? (
            <ActionCard title="Check in" icon={ClipboardCheck}>
              <form action={scanTransitionItem} className="space-y-2">
                <input type="hidden" name="assetId" value={resolved.entity.assetId} />
                <input type="hidden" name="nextStatus" value="available" />
                <CompactInput name="note" placeholder="Returned to storage" />
                <Button type="submit" className="w-full">Check in</Button>
              </form>
            </ActionCard>
          ) : null}

          <ActionCard title="Move" icon={MapPinned}>
            <form action={scanMoveItem} className="space-y-2">
              <input type="hidden" name="assetId" value={resolved.entity.assetId} />
              <select
                name="locationId"
                defaultValue={resolved.entity.location?.id ?? ""}
                className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {options.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {buildLocationPath(location)}
                  </option>
                ))}
              </select>
              <CompactInput name="note" placeholder="Moved after scan" />
              <Button type="submit" variant="outline" className="w-full">Move now</Button>
            </form>
          </ActionCard>

          <ActionCard title="Inspect" icon={Eye}>
            <div className="grid gap-2">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={itemDetailPath(resolved.entity.assetId)}>
                  Full item detail
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`${itemDetailPath(resolved.entity.assetId)}#package-contents`}>
                  Package contents
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={itemMovePath(resolved.entity.assetId)}>
                  Dedicated move workflow
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </ActionCard>

          {canRepair ? (
            <ActionCard title="Repair" icon={Wrench}>
              <form action={scanTransitionItem} className="space-y-2">
                <input type="hidden" name="assetId" value={resolved.entity.assetId} />
                <input type="hidden" name="nextStatus" value="in_repair" />
                <CompactInput name="note" placeholder="Repair note" />
                <Button type="submit" variant="outline" className="w-full">Mark repair</Button>
              </form>
            </ActionCard>
          ) : null}

          {canMarkMissing ? (
            <ActionCard title="Missing" icon={Boxes}>
              <form action={scanTransitionItem} className="space-y-2">
                <input type="hidden" name="assetId" value={resolved.entity.assetId} />
                <input type="hidden" name="nextStatus" value="missing" />
                <CompactInput name="note" placeholder="Missing note" />
                <Button type="submit" variant="outline" className="w-full">Mark missing</Button>
              </form>
            </ActionCard>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <FeedbackBanner {...feedback} />
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="space-y-4 bg-slate-950 p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Kit scan</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{resolved.entity.assetId}</h1>
              <div className="mt-1 text-sm text-slate-300 sm:text-base">{resolved.entity.name}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                {resolved.entity.status.replaceAll("_", " ")}
              </Badge>
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                {buildLocationPath(resolved.entity.location)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <ScanMetaPill label="Members" value={String(resolved.entity._count.items)} />
            <ScanMetaPill label="Location" value={buildLocationPath(resolved.entity.location)} />
            <ScanMetaPill label="Status" value={resolved.entity.status.replaceAll("_", " ")} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard title="Check out whole kit" icon={QrCode}>
          <form action={scanUpdateKit} className="space-y-2">
            <input type="hidden" name="assetId" value={resolved.entity.assetId} />
            <input type="hidden" name="nextStatus" value={KitStatus.active} />
            <CompactInput name="note" placeholder="On truck / deployed" />
            <Button type="submit" className="w-full">Check out kit</Button>
          </form>
        </ActionCard>

        <ActionCard title="Return verification" icon={ClipboardCheck}>
          <form action={scanStartKitReturn} className="space-y-2">
            <input type="hidden" name="assetId" value={resolved.entity.assetId} />
            <Button type="submit" className="w-full">Begin return verification</Button>
          </form>
        </ActionCard>

        <ActionCard title="Inspect kit" icon={Eye}>
          <div className="grid gap-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={kitDetailPath(resolved.entity.assetId)}>
                Kit detail
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={kitReturnPath(resolved.entity.assetId)}>
                Return workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ActionCard>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-slate-200 bg-secondary/55 p-2">
            <Icon className="h-4 w-4 text-slate-700" />
          </div>
          <div className="text-sm font-semibold">{title}</div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function ScanMetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function CompactInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm" />;
}
