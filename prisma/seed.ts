import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";

const categories = [
  ["Camera", "camera", "CAM"],
  ["Lens", "lens", "LENS"],
  ["Lighting", "lighting", "LIGHT"],
  ["Grip", "grip", "GRIP"],
  ["Audio", "audio", "AUDIO"],
  ["Monitor / Wireless", "monitor-wireless", "MON"],
  ["Power", "power", "PWR"],
  ["Media / Storage", "media-storage", "MEDIA"],
  ["Bags / Cases", "bags-cases", "CASE"],
  ["Tools", "tools", "TOOL"],
  ["Props", "props", "PROP"],
  ["Curtains / Textiles", "curtains-textiles", "TEXT"],
  ["Rigging", "rigging", "RIG"],
  ["Misc Production", "misc-production", "MISC"],
] as const;

const locations = [
  { name: "Main Office", description: "Primary office shelving" },
  { name: "Truck", description: "Load-out vehicle" },
  { name: "Storage Unit", description: "Overflow storage" },
  { name: "Studio Shelf A", description: "Studio shelving near prep table" },
] as const;

const tags = ["A-Cam", "Documentary", "Lighting Kit", "Audio Bag", "Prep Ready"];

async function main() {
  for (const [name, slug, prefix] of categories) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, prefix },
      create: { name, slug, prefix },
    });
  }

  for (const location of locations) {
    const existing = await prisma.location.findFirst({
      where: { name: location.name, parentLocationId: null },
    });

    if (existing) {
      await prisma.location.update({
        where: { id: existing.id },
        data: location,
      });
    } else {
      await prisma.location.create({
        data: location,
      });
    }
  }

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const [camera, lens, lighting, grip, power, audio, props, textiles] = await Promise.all([
    prisma.category.findUniqueOrThrow({ where: { slug: "camera" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "lens" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "lighting" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "grip" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "power" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "audio" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "props" } }),
    prisma.category.findUniqueOrThrow({ where: { slug: "curtains-textiles" } }),
  ]);

  const office = await prisma.location.findFirstOrThrow({ where: { name: "Main Office" } });
  const truck = await prisma.location.findFirstOrThrow({ where: { name: "Truck" } });
  const storageUnit = await prisma.location.findFirstOrThrow({ where: { name: "Storage Unit" } });
  const studioShelf = await prisma.location.findFirstOrThrow({ where: { name: "Studio Shelf A" } });

  const demoItems = [
    {
      assetId: "CAM-001",
      name: "Sony FX6",
      categoryId: camera.id,
      brand: "Sony",
      model: "FX6",
      serialNumber: "FX6-28491",
      status: "active",
      locationId: office.id,
      ownerName: "William Armstrong",
      qrCodeValue: "/scan/CAM-001",
      replacementValue: new Prisma.Decimal(5998),
      purchasePrice: new Prisma.Decimal(5998),
      notes: "A-cam body with top handle and LCD loupe.",
    },
    {
      assetId: "CAM-002",
      name: "Leica Q2",
      categoryId: camera.id,
      brand: "Leica",
      model: "Q2",
      serialNumber: "Q2-88320",
      status: "active",
      locationId: office.id,
      ownerName: "William Armstrong",
      qrCodeValue: "/scan/CAM-002",
      replacementValue: new Prisma.Decimal(5795),
      purchasePrice: new Prisma.Decimal(5295),
    },
    {
      assetId: "CAM-003",
      name: "ARRI SR2",
      categoryId: camera.id,
      brand: "ARRI",
      model: "SR2",
      serialNumber: "SR2-16-1934",
      status: "in_repair",
      locationId: studioShelf.id,
      ownerName: "William Armstrong",
      qrCodeValue: "/scan/CAM-003",
      replacementValue: new Prisma.Decimal(8500),
      notes: "Waiting on viewfinder service.",
    },
    {
      assetId: "LENS-002",
      name: "Sony FE 24-70mm f/2.8 GM II",
      categoryId: lens.id,
      brand: "Sony",
      model: "FE 24-70mm f/2.8 GM II",
      serialNumber: "SEL2470GM2-301",
      status: "active",
      locationId: office.id,
      qrCodeValue: "/scan/LENS-002",
      replacementValue: new Prisma.Decimal(2298),
    },
    {
      assetId: "LIGHT-003",
      name: "Creamsource Vortex8",
      categoryId: lighting.id,
      brand: "Creamsource",
      model: "Vortex8",
      status: "checked_out",
      locationId: truck.id,
      qrCodeValue: "/scan/LIGHT-003",
      replacementValue: new Prisma.Decimal(6499),
      notes: "On shoot truck with power distro.",
    },
    {
      assetId: "LIGHT-004",
      name: "Aputure 600d Pro",
      categoryId: lighting.id,
      brand: "Aputure",
      model: "600d Pro",
      status: "active",
      locationId: truck.id,
      qrCodeValue: "/scan/LIGHT-004",
      replacementValue: new Prisma.Decimal(1890),
    },
    {
      assetId: "GRIP-001",
      name: "C-Stand Turtle Base",
      categoryId: grip.id,
      brand: "Matthews",
      status: "active",
      quantity: 4,
      locationId: truck.id,
      qrCodeValue: "/scan/GRIP-001",
      replacementValue: new Prisma.Decimal(250),
    },
    {
      assetId: "PROP-004",
      name: "4x4 Solid",
      categoryId: grip.id,
      status: "active",
      quantity: 2,
      locationId: truck.id,
      qrCodeValue: "/scan/PROP-004",
      replacementValue: new Prisma.Decimal(89),
    },
    {
      assetId: "PWR-001",
      name: "V-Mount Battery 150Wh",
      categoryId: power.id,
      brand: "Core SWX",
      status: "active",
      quantity: 6,
      locationId: truck.id,
      qrCodeValue: "/scan/PWR-001",
      replacementValue: new Prisma.Decimal(379),
    },
    {
      assetId: "AUDIO-001",
      name: "Zoom F6",
      categoryId: audio.id,
      brand: "Zoom",
      model: "F6",
      status: "active",
      locationId: office.id,
      qrCodeValue: "/scan/AUDIO-001",
      replacementValue: new Prisma.Decimal(699),
    },
    {
      assetId: "AUDIO-002",
      name: "Tentacle Sync E",
      categoryId: audio.id,
      brand: "Tentacle",
      status: "active",
      quantity: 3,
      locationId: office.id,
      qrCodeValue: "/scan/AUDIO-002",
      replacementValue: new Prisma.Decimal(229),
    },
    {
      assetId: "TEXT-001",
      name: "Black Duvetyne Curtain",
      categoryId: textiles.id,
      status: "active",
      quantity: 3,
      locationId: storageUnit.id,
      qrCodeValue: "/scan/TEXT-001",
      replacementValue: new Prisma.Decimal(140),
    },
    {
      assetId: "PROP-005",
      name: "Folding Director Chair",
      categoryId: props.id,
      status: "active",
      quantity: 2,
      locationId: truck.id,
      qrCodeValue: "/scan/PROP-005",
      replacementValue: new Prisma.Decimal(95),
    },
    {
      assetId: "PROP-006",
      name: "Prop Crate A",
      categoryId: props.id,
      status: "active",
      locationId: studioShelf.id,
      qrCodeValue: "/scan/PROP-006",
      replacementValue: new Prisma.Decimal(120),
    },
  ] as const;

  for (const item of demoItems) {
    const created = await prisma.item.upsert({
      where: { assetId: item.assetId },
      update: item,
      create: item,
    });

    await prisma.itemHistoryEvent.upsert({
      where: {
        id: `${created.id}-created`,
      },
      update: {},
      create: {
        id: `${created.id}-created`,
        itemId: created.id,
        type: "created",
        summary: `Item created: ${created.name}`,
        details: "Seeded demo record",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
