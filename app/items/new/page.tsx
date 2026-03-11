import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

async function createItem(formData: FormData) {
  "use server";

  const assetId = String(formData.get("assetId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "active");
  const locationId = String(formData.get("locationId") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null;
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null;
  const replacementValueRaw = String(formData.get("replacementValue") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!assetId || !name) {
    throw new Error("Asset ID and name are required.");
  }

  const item = await prisma.item.create({
    data: {
      assetId,
      name,
      categoryId,
      status: status as never,
      locationId,
      brand,
      model,
      serialNumber,
      ownerName,
      notes,
      qrCodeValue: `/scan/${assetId}`,
      replacementValue: replacementValueRaw ? Number(replacementValueRaw) : undefined,
    },
  });

  await prisma.itemHistoryEvent.create({
    data: {
      itemId: item.id,
      type: "created",
      summary: `Item created: ${item.name}`,
      details: "Created from Gear Locker web form.",
    },
  });

  redirect(`/items/${item.id}`);
}

export default async function NewItemPage() {
  const [categories, locations] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add item</h1>
        <p className="text-muted-foreground">Pragmatic v1 form for creating inventory records quickly.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New inventory item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createItem} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assetId">Asset ID</Label>
              <Input id="assetId" name="assetId" placeholder="CAM-001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Item name</Label>
              <Input id="name" name="name" placeholder="Sony FX6" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select id="categoryId" name="categoryId" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" defaultValue="active">
                <option value="active">Active</option>
                <option value="checked_out">Checked out</option>
                <option value="in_repair">In repair</option>
                <option value="missing">Missing</option>
                <option value="stolen">Stolen</option>
                <option value="sold">Sold</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" placeholder="Sony" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" placeholder="FX6" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input id="serialNumber" name="serialNumber" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <select id="locationId" name="locationId" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Unassigned</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner</Label>
              <Input id="ownerName" name="ownerName" placeholder="William Armstrong" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replacementValue">Replacement value</Label>
              <Input id="replacementValue" name="replacementValue" type="number" min="0" step="0.01" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Purchase notes, kit details, or prep notes."
              />
            </div>
            <div className="rounded-xl border border-dashed bg-secondary/50 p-4 text-sm text-muted-foreground md:col-span-2">
              Attachments upload is scaffolded for later Supabase Storage wiring. v1 form focuses on getting clean item records into the database first.
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Create item</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
