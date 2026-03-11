import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { generateQrCodeDataUrl } from "@/lib/qrcode";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/inventory/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function updateItemStatus(formData: FormData) {
  "use server";

  const itemId = String(formData.get("itemId"));
  const status = String(formData.get("status"));
  const note = String(formData.get("note") ?? "").trim();

  const item = await prisma.item.update({
    where: { id: itemId },
    data: { status: status as never },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId,
      type: status === "checked_out" ? "checked_out" : "checked_in",
      summary: status === "checked_out" ? `Checked out ${item.name}` : `Checked in ${item.name}`,
      details: note || null,
    },
  });
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      attachments: true,
      kits: { include: { kit: true } },
      historyEvents: { orderBy: { timestamp: "desc" } },
      tags: { include: { tag: true } },
    },
  });

  if (!item) {
    notFound();
  }

  const qrCode = await generateQrCodeDataUrl(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${item.qrCodeValue}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{item.assetId}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="text-sm text-muted-foreground">{item.category?.name ?? "Uncategorized"}</span>
            <span className="text-sm text-muted-foreground">{item.location?.name ?? "Unassigned"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={`/labels/${item.assetId}`}>Print label</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Fast-read asset information for prep or scan lookup.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <DetailRow label="Brand / Model" value={[item.brand, item.model].filter(Boolean).join(" ") || "Not set"} />
                <DetailRow label="Serial number" value={item.serialNumber ?? "Not set"} />
                <DetailRow label="Condition" value={item.condition ?? "Not set"} />
                <DetailRow label="Owner" value={item.ownerName ?? "Not set"} />
                <DetailRow label="Quantity" value={String(item.quantity)} />
                <DetailRow label="Notes" value={item.notes ?? "No notes"} />
              </div>
              <div className="rounded-2xl border bg-secondary/40 p-4">
                <div className="mb-3 text-sm font-medium">QR label</div>
                <Image src={qrCode} alt={`QR for ${item.assetId}`} width={220} height={220} className="rounded-lg bg-white p-2" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Scans resolve to <span className="font-mono">{item.qrCodeValue}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ownership / Purchase</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Purchase date" value={formatDate(item.purchaseDate)} />
              <DetailRow label="Purchase price" value={formatCurrency(item.purchasePrice ? Number(item.purchasePrice) : null, item.currency)} />
              <DetailRow label="Replacement value" value={formatCurrency(item.replacementValue ? Number(item.replacementValue) : null, item.currency)} />
              <DetailRow label="Receipt summary" value={item.attachments.filter((attachment) => attachment.type === "receipt").length ? "Receipt uploaded" : "No receipt yet"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Supabase Storage integration point for photos, receipts, manuals, and serial documentation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments yet. Upload flow is scaffolded for the next milestone.</p>
              ) : (
                item.attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{attachment.fileName}</p>
                    <p className="text-muted-foreground">{attachment.type}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Check in / out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={updateItemStatus} className="space-y-3">
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="status" value="checked_out" />
                <textarea name="note" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Loaned to John / On shoot / In truck" />
                <Button type="submit" className="w-full">
                  Check out
                </Button>
              </form>
              <form action={updateItemStatus} className="space-y-3">
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="status" value="active" />
                <textarea name="note" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Returned from job / Back on shelf" />
                <Button type="submit" variant="outline" className="w-full">
                  Check in
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.kits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No kits assigned yet.</p>
              ) : (
                item.kits.map((entry) => (
                  <div key={entry.kitId} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{entry.kit.name}</p>
                    <p className="text-muted-foreground">{entry.kit.location ?? "No kit location"}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.historyEvents.map((event) => (
                <div key={event.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.summary}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                  </div>
                  <p className="text-muted-foreground">{event.details ?? event.type}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm">{value}</p>
    </div>
  );
}
