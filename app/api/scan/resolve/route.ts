import { NextRequest, NextResponse } from "next/server";

import { buildLocationPath, itemStatusMeta, kitStatusMeta } from "@/lib/inventory/domain";
import { getGlobalOperationalAlerts, getItemFormOptions, resolveScannableEntity } from "@/lib/inventory/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const assetId = request.nextUrl.searchParams.get("assetId")?.trim();

  if (!assetId) {
    return NextResponse.json({ message: "Asset ID is required." }, { status: 400 });
  }

  const [resolved, alerts, options] = await Promise.all([
    resolveScannableEntity(assetId),
    getGlobalOperationalAlerts(),
    getItemFormOptions({ includeKits: false }),
  ]);

  if (!resolved) {
    return NextResponse.json({ message: "Item not recognized." }, { status: 404 });
  }

  const activeReturn = alerts.activeReturnSessions[0]
    ? {
        id: alerts.activeReturnSessions[0].id,
        kitAssetId: alerts.activeReturnSessions[0].kit.assetId,
        kitName: alerts.activeReturnSessions[0].kit.name,
        verifiedCount: 0,
        expectedCount: 0,
        pendingCount: 0,
      }
    : null;

  if (activeReturn) {
    const activeSession = await prisma.kitVerificationSession.findUnique({
      where: { id: activeReturn.id },
      include: { items: true },
    });

    if (activeSession) {
      activeReturn.expectedCount = activeSession.items.length;
      activeReturn.verifiedCount = activeSession.items.filter((entry) => entry.verifiedAt).length;
      activeReturn.pendingCount = activeSession.items.filter((entry) => !entry.verifiedAt).length;
    }
  }

  if (resolved.type === "item") {
    let returnContext:
      | {
          state: "expected_item" | "already_verified" | "other_kit" | "unexpected";
          message: string;
        }
      | undefined;

    if (activeReturn) {
      const [activeSession, itemMembership] = await Promise.all([
        prisma.kitVerificationSession.findUnique({
          where: { id: activeReturn.id },
          include: {
            items: {
              include: {
                item: {
                  select: { assetId: true },
                },
              },
            },
            kit: { select: { assetId: true } },
          },
        }),
        prisma.item.findUnique({
          where: { assetId },
          select: {
            kits: {
              include: {
                kit: {
                  select: { assetId: true, name: true },
                },
              },
            },
          },
        }),
      ]);

      if (activeSession) {
        const sessionEntry = activeSession.items.find((entry) => entry.item.assetId === assetId);
        const otherKit = itemMembership?.kits.find((entry) => entry.kit.assetId !== activeSession.kit.assetId);

        if (sessionEntry?.verifiedAt) {
          returnContext = {
            state: "already_verified",
            message: "Already verified for this kit.",
          };
        } else if (sessionEntry) {
          returnContext = {
            state: "expected_item",
            message: `Ready to verify for ${activeReturn.kitAssetId}.`,
          };
        } else if (otherKit) {
          returnContext = {
            state: "other_kit",
            message: `Belongs to ${otherKit.kit.assetId}.`,
          };
        } else {
          returnContext = {
            state: "unexpected",
            message: "Not part of this kit.",
          };
        }
      }
    }

    return NextResponse.json({
      type: "item",
      entity: {
        assetId: resolved.entity.assetId,
        name: resolved.entity.name,
        status: resolved.entity.status,
        statusLabel: itemStatusMeta[resolved.entity.status].label,
        locationId: resolved.entity.location?.id ?? null,
        locationLabel: buildLocationPath(resolved.entity.location),
        kitsCount: resolved.entity._count.kits,
        trackedContentsCount: resolved.entity._count.packageContents,
        checklistContentsCount: resolved.entity._count.checklistContents,
        containedInCount: resolved.entity._count.containedIn,
        packageRole:
          resolved.entity._count.packageContents > 0
            ? "parent"
            : resolved.entity._count.containedIn > 0
              ? "contained"
              : "standalone",
      },
      locations: options.locations.map((location) => ({
        id: location.id,
        label: buildLocationPath(location),
      })),
      activeReturn,
      returnContext,
    });
  }

  const latestVerification = resolved.entity.verificationSessions[0] ?? null;
  const pendingCount = latestVerification?.items.filter((entry) => !entry.verifiedAt).length ?? 0;
  const missingCount = latestVerification?.items.filter((entry) => entry.isPresent === false).length ?? 0;

  return NextResponse.json({
    type: "kit",
    entity: {
      assetId: resolved.entity.assetId,
      name: resolved.entity.name,
      status: resolved.entity.status,
      statusLabel: kitStatusMeta[resolved.entity.status].label,
      locationLabel: buildLocationPath(resolved.entity.location),
      memberCount: resolved.entity._count.items,
      verificationLabel: latestVerification ? (pendingCount > 0 ? `${pendingCount} pending` : missingCount > 0 ? `${missingCount} missing` : "Complete") : "Not started",
    },
    activeReturn,
  });
}
