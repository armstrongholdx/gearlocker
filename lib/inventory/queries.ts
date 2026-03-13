import { ItemStatus, KitStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getItemByAssetId(assetId: string) {
  return prisma.item.findUnique({
    where: { assetId },
    include: {
      category: true,
      location: { include: { parentLocation: { include: { parentLocation: true } } } },
      attachments: true,
      checklistContents: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      packageContents: {
        include: {
          childItem: {
            include: {
              location: { include: { parentLocation: { include: { parentLocation: true } } } },
              kits: { include: { kit: true } },
            },
          },
        },
      },
      containedIn: {
        include: {
          parentItem: true,
        },
      },
      kits: { include: { kit: { include: { location: { include: { parentLocation: { include: { parentLocation: true } } } } } } } },
      historyEvents: { orderBy: { timestamp: "desc" }, include: { location: { include: { parentLocation: { include: { parentLocation: true } } } } } },
      tags: { include: { tag: true } },
    },
  });
}

export async function getKitByAssetId(assetId: string) {
  return prisma.kit.findUnique({
    where: { assetId },
    include: {
      location: { include: { parentLocation: { include: { parentLocation: true } } } },
      items: {
        include: {
          item: {
            include: {
              location: { include: { parentLocation: { include: { parentLocation: true } } } },
              kits: { include: { kit: true } },
            },
          },
        },
      },
      historyEvents: { orderBy: { timestamp: "desc" } },
      verificationSessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { items: { include: { item: true } } },
      },
    },
  });
}

export async function getItemMovePageData(assetId: string) {
  const [item, options] = await Promise.all([
    prisma.item.findUnique({
      where: { assetId },
      include: {
        location: { include: { parentLocation: { include: { parentLocation: true } } } },
        historyEvents: {
          where: { type: "moved" },
          orderBy: { timestamp: "desc" },
          take: 6,
          include: { location: { include: { parentLocation: { include: { parentLocation: true } } } } },
        },
      },
    }),
    getItemFormOptions({ includeKits: false }),
  ]);

  return {
    item,
    locations: options.locations,
  };
}

export async function resolveScannableEntity(assetId: string) {
  const [item, kit] = await Promise.all([
    prisma.item.findUnique({
      where: { assetId },
      select: {
        assetId: true,
        name: true,
        status: true,
        location: { include: { parentLocation: { include: { parentLocation: true } } } },
        _count: {
          select: {
            kits: true,
            packageContents: true,
            checklistContents: true,
          },
        },
      },
    }),
    prisma.kit.findUnique({
      where: { assetId },
      select: {
        assetId: true,
        name: true,
        status: true,
        location: { include: { parentLocation: { include: { parentLocation: true } } } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  if (item) {
    return { type: "item" as const, entity: item };
  }

  if (kit) {
    return { type: "kit" as const, entity: kit };
  }

  return null;
}

export async function getItemFormOptions({ includeKits = true, includeItems = false }: { includeKits?: boolean; includeItems?: boolean } = {}) {
  const [categories, locations, kits, items] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { parentLocation: { include: { parentLocation: true } } },
    }),
    includeKits ? prisma.kit.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    includeItems
      ? prisma.item.findMany({ orderBy: { assetId: "asc" }, select: { id: true, assetId: true, name: true, status: true } })
      : Promise.resolve([]),
  ]);

  return { categories, locations, kits, items };
}

export async function getDashboardSummary() {
  const [totalItems, categories, statuses, recentItems, recentHistory, totalKits, totalLocations, activeKits] = await Promise.all([
    prisma.item.count(),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.item.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.item.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true },
    }),
    prisma.itemHistoryEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { item: true, location: true },
    }),
    prisma.kit.count(),
    prisma.location.count(),
    prisma.kit.count({ where: { status: KitStatus.active } }),
  ]);

  return { totalItems, categories, statuses, recentItems, recentHistory, totalKits, totalLocations, activeKits };
}

type KitCompleteness = {
  kitId: string;
  missingItems: number;
  activeItems: number;
  sharedItems: number;
  completenessStatus: "complete" | "incomplete";
};

export async function getKitPageData() {
  const [kits, locations, items, memberships] = await Promise.all([
    prisma.kit.findMany({
      orderBy: { name: "asc" },
      include: {
        location: { include: { parentLocation: { include: { parentLocation: true } } } },
        items: {
          include: {
            item: {
              include: {
                location: { include: { parentLocation: { include: { parentLocation: true } } } },
                kits: { include: { kit: true } },
              },
            },
          },
        },
        verificationSessions: {
          orderBy: { startedAt: "desc" },
          take: 1,
          include: { items: { include: { item: true } } },
        },
      },
    }),
    prisma.location.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { parentLocation: { include: { parentLocation: true } } },
    }),
    prisma.item.findMany({ orderBy: { assetId: "asc" }, select: { id: true, assetId: true, name: true, status: true } }),
    prisma.itemKit.findMany({ include: { item: { include: { kits: true } } } }),
  ]);

  const completenessMap = new Map<string, KitCompleteness>();

  for (const kit of kits) {
    const missingItems = kit.items.filter((entry) => entry.item.status === ItemStatus.missing || entry.item.status === ItemStatus.stolen).length;
    const activeItems = kit.items.filter((entry) => entry.item.status === ItemStatus.active).length;
    const sharedItems = kit.items.filter((entry) => entry.item.kits.length > 1).length;

    completenessMap.set(kit.id, {
      kitId: kit.id,
      missingItems,
      activeItems,
      sharedItems,
      completenessStatus: missingItems > 0 ? "incomplete" : "complete",
    });
  }

  return { kits, locations, items, completenessMap, memberships };
}

export async function getKitReturnPageData(assetId: string) {
  return prisma.kit.findUnique({
    where: { assetId },
    include: {
      location: { include: { parentLocation: { include: { parentLocation: true } } } },
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          item: {
            include: {
              location: { include: { parentLocation: { include: { parentLocation: true } } } },
              kits: { include: { kit: true } },
            },
          },
        },
      },
      verificationSessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          items: {
            include: {
              item: {
                include: {
                  location: { include: { parentLocation: { include: { parentLocation: true } } } },
                  kits: { include: { kit: true } },
                },
              },
            },
          },
        },
      },
      historyEvents: {
        orderBy: { timestamp: "desc" },
        take: 8,
      },
    },
  });
}

export async function getLocationPageData() {
  return prisma.location.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      childLocations: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      parentLocation: { include: { parentLocation: true } },
      _count: { select: { items: true, kits: true, childLocations: true } },
    },
  });
}
