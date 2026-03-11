import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ScanResolverPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const item = await prisma.item.findUnique({
    where: { assetId: decodeURIComponent(assetId) },
  });

  if (!item) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Item not found</h1>
        <p className="text-muted-foreground">No item matched asset ID {decodeURIComponent(assetId)}.</p>
      </div>
    );
  }

  redirect(`/items/${item.id}`);
}
