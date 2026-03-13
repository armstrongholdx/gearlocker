import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      location: true,
      tags: { include: { tag: true } },
      kits: { include: { kit: true } },
      attachments: true,
    },
  });

  const rows = [
    [
      "assetId",
      "name",
      "category",
      "subcategory",
      "status",
      "conditionGrade",
      "location",
      "serialNumber",
      "replacementValue",
      "purchasePrice",
      "currency",
      "ownerName",
      "purchaseSource",
      "purchaseReference",
      "tags",
      "kits",
      "attachmentCount",
      "itemUrl",
    ],
    ...items.map((item: any) => [
      item.assetId,
      item.name,
      item.category?.name ?? "",
      item.subcategory ?? "",
      item.status,
      item.conditionGrade ?? "",
      item.location?.name ?? "",
      item.serialNumber ?? "",
      item.replacementValue?.toString() ?? "",
      item.purchasePrice?.toString() ?? "",
      item.currency,
      item.ownerName ?? "",
      item.purchaseSource ?? "",
      item.purchaseReference ?? "",
      item.tags.map((entry: any) => entry.tag.name).join(" | "),
      item.kits.map((entry: any) => entry.kit.name).join(" | "),
      String(item.attachments.length),
      `/items/${encodeURIComponent(item.assetId)}`,
    ]),
  ];

  const csv = rows
    .map((row: any[]) => row.map((value: any) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="gear-locker-items.csv"',
    },
  });
}
