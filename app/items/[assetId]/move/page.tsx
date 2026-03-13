import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRightLeft, FolderTree, History, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { buildLocationPath } from "@/lib/inventory/domain";
import { moveItemToLocation } from "@/lib/inventory/mutations";
import { getItemMovePageData } from "@/lib/inventory/queries";
import { itemDetailPath, itemEditPath, itemMovePath } from "@/lib/paths";

export const dynamic = "force-dynamic";

async function submitMove(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "");

  try {
    const item = await moveItemToLocation(formData);
    redirect(buildActionSuccessPath(itemDetailPath(item.assetId), "Location updated."));
  } catch (error) {
    redirect(buildActionFailurePath(itemMovePath(assetId), error));
  }
}

export default async function MoveItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assetId } = await params;
  const feedback = await readFeedback(searchParams);
  const data = await getItemMovePageData(decodeURIComponent(assetId));

  if (!data.item) {
    notFound();
  }

  const item = data.item;
  const locationOptions = data.locations.filter((location) => location.id !== item.locationId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Move item</div>
          <h1 className="text-3xl font-semibold tracking-tight">{item.assetId} · {item.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Use this screen for deliberate storage moves. Every reassignment writes structured history so you can reconstruct where gear last lived.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={itemEditPath(item.assetId)}>Edit record</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={itemDetailPath(item.assetId)}>Back to detail</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Reassign storage location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FeedbackBanner {...feedback} />
            <div className="grid gap-3 md:grid-cols-2">
              <MoveTile label="Current path" value={buildLocationPath(item.location)} icon={FolderTree} />
              <MoveTile label="History events" value={String(item.historyEvents.length)} icon={History} />
            </div>
            <form action={submitMove} className="space-y-4">
              <input type="hidden" name="assetId" value={item.assetId} />
              <div className="space-y-2">
                <label htmlFor="locationId" className="text-sm font-medium">Destination</label>
                <select id="locationId" name="locationId" defaultValue="" className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm">
                  <option value="">Unassigned / in transit</option>
                  {locationOptions.map((location) => (
                    <option key={location.id} value={location.id}>
                      {buildLocationPath(location)}
                    </option>
                  ))}
                  {item.locationId ? <option value={item.locationId}>Keep current: {buildLocationPath(item.location)}</option> : null}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium">Move note</label>
                <textarea
                  id="note"
                  name="note"
                  className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Moved after prep / loaded into truck / returned to shelf / staged for job"
                />
              </div>
              <Button type="submit" className="w-full">
                <ArrowRightLeft className="h-4 w-4" />
                Save location move
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">Movement guidance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>Use dedicated move actions when the main change is physical placement, not condition or status.</p>
              <p>Locations behave like folder paths, so the destination should represent where the item can realistically be found next.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent movement trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.historyEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recorded movement yet.</p>
              ) : (
                item.historyEvents.map((event) => (
                  <div key={event.id} className="rounded-[1.05rem] border border-slate-200 bg-white/75 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{buildLocationPath(event.location)}</div>
                      <div className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-1 text-muted-foreground">{event.note ?? event.details ?? event.summary}</div>
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

function MoveTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof MapPinned;
}) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-secondary/55 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-base font-semibold">{value}</div>
    </div>
  );
}
