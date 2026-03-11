import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, location: true },
  });

  const rows = [
    ["assetId", "name", "category", "status", "location", "serialNumber", "replacementValue", "currency", "ownerName"],
    ...items.map((item) => [
      item.assetId,
      item.name,
      item.category?.name ?? "",
      item.status,
      item.location?.name ?? "",
      item.serialNumber ?? "",
      item.replacementValue?.toString() ?? "",
      item.currency,
      item.ownerName ?? "",
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="gear-locker-items.csv"',
    },
  });
}
