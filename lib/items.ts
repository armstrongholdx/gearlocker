import { ItemStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type InventoryFilters = {
  query?: string;
  category?: string;
  status?: string;
  location?: string;
  sort?: "recent" | "name" | "replacementValue";
};

export async function getInventory(filters: InventoryFilters = {}) {
  const where: Prisma.ItemWhereInput = {
    AND: [
      filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { assetId: { contains: filters.query, mode: "insensitive" } },
              { serialNumber: { contains: filters.query, mode: "insensitive" } },
              { brand: { contains: filters.query, mode: "insensitive" } },
              { model: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {},
      filters.category ? { category: { slug: filters.category } } : {},
      filters.status ? { status: filters.status as ItemStatus } : {},
      filters.location ? { locationId: filters.location } : {},
    ],
  };

  const orderBy: Prisma.ItemOrderByWithRelationInput =
    filters.sort === "name"
      ? { name: "asc" }
      : filters.sort === "replacementValue"
        ? { replacementValue: "desc" }
        : { createdAt: "desc" };

  return prisma.item.findMany({
    where,
    orderBy,
    include: {
      category: true,
      location: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function getInventoryFilters() {
  const [categories, locations, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { categories, locations, tags };
}
