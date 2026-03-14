import { NextRequest, NextResponse } from "next/server";
import { KitStatus } from "@prisma/client";

import { setKitStatusByAssetId, startKitReturnVerification, verifyKitReturnItemByAssetIdInput } from "@/lib/inventory/mutations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assetId = String(body.assetId ?? "").trim();
    const action = String(body.action ?? "").trim();
    const note = String(body.note ?? "").trim() || null;

    if (!assetId || !action) {
      return NextResponse.json({ message: "Kit asset ID and action are required." }, { status: 400 });
    }

    if (action === "check_out") {
      await setKitStatusByAssetId({ assetId, nextStatus: KitStatus.active, note });
      return NextResponse.json({ ok: true, message: "Kit checked out." });
    }

    if (action === "start_return") {
      await startKitReturnVerification(assetId, note ?? undefined);
      return NextResponse.json({ ok: true, message: "Return started." });
    }

    if (action === "verify_member") {
      const itemAssetId = String(body.itemAssetId ?? "").trim();
      if (!itemAssetId) {
        return NextResponse.json({ message: "Item asset ID is required." }, { status: 400 });
      }

      await verifyKitReturnItemByAssetIdInput({
        assetId,
        itemAssetId,
        isPresent: "present",
        note,
      });

      const kit = await prisma.kit.findUnique({
        where: { assetId },
        select: { status: true },
      });

      const kitComplete = kit?.status === KitStatus.available;

      return NextResponse.json({ ok: true, message: kitComplete ? "Kit complete." : "Returned to kit.", kitComplete });
    }

    return NextResponse.json({ message: "Unsupported kit action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update kit.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
