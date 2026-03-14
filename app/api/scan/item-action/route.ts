import { NextRequest, NextResponse } from "next/server";
import { ItemStatus } from "@prisma/client";

import { buildLocationPath, itemStatusMeta } from "@/lib/inventory/domain";
import { moveItemToLocationByAssetId, transitionItemByAssetId } from "@/lib/inventory/mutations";
import { getItemByAssetId } from "@/lib/inventory/queries";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assetId = String(body.assetId ?? "").trim();
    const action = String(body.action ?? "").trim();
    const note = String(body.note ?? "").trim() || null;

    if (!assetId || !action) {
      return NextResponse.json({ message: "Asset ID and action are required." }, { status: 400 });
    }

    if (action === "move") {
      const locationId = String(body.locationId ?? "").trim() || null;
      const item = await moveItemToLocationByAssetId({ assetId, locationId, note });
      return NextResponse.json({
        ok: true,
        message: "Location updated.",
        status: item.status,
        statusLabel: itemStatusMeta[item.status].label,
        locationLabel: buildLocationPath(item.location ? { ...item.location, parentLocation: null } : null),
      });
    }

    const actionToStatus: Record<string, ItemStatus> = {
      check_in: ItemStatus.available,
      check_out: ItemStatus.active,
      repair: ItemStatus.in_repair,
      missing: ItemStatus.missing,
    };

    const nextStatus = actionToStatus[action];
    if (!nextStatus) {
      return NextResponse.json({ message: "Unsupported item action." }, { status: 400 });
    }

    await transitionItemByAssetId({ assetId, nextStatus, note });
    const item = await getItemByAssetId(assetId);

    return NextResponse.json({
      ok: true,
      message:
        action === "check_in"
          ? "Checked in."
          : action === "check_out"
            ? "Checked out."
            : action === "repair"
              ? "Marked for repair."
              : "Marked missing.",
      status: item?.status,
      statusLabel: item ? itemStatusMeta[item.status].label : null,
      locationLabel: item ? buildLocationPath(item.location) : "Unassigned",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update item.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
