import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { buildQrCodeValue } from "../lib/paths";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  { name: "Main Office", code: "LOC-OFFICE", description: "Primary office shelving" },
  { name: "Truck", code: "LOC-TRUCK", description: "Load-out vehicle" },
  { name: "Storage Unit", code: "LOC-STORAGE", description: "Overflow storage" },
  { name: "Studio", code: "LOC-STUDIO", description: "Working studio area" },
] as const;

const tags = ["A-Cam", "Documentary", "Lighting Kit", "Audio Bag", "Prep Ready"];

async function main() {
  for (const [name, slug, prefix] of categories) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, prefix },
      create: { name, slug, prefix, description: `${name} gear and support items.` },
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
      where: { slug: toSlug(name) },
      update: { name },
      create: { name, slug: toSlug(name) },
    });
  }

  const studio = await prisma.location.findFirstOrThrow({ where: { name: "Studio" } });
  const truck = await prisma.location.findFirstOrThrow({ where: { name: "Truck" } });
  const storageUnit = await prisma.location.findFirstOrThrow({ where: { name: "Storage Unit" } });
  const office = await prisma.location.findFirstOrThrow({ where: { name: "Main Office" } });

  const childLocations = [
    { name: "Studio Shelf A", code: "LOC-STUDIO-A", parentLocationId: studio.id, description: "Studio shelving near prep table" },
    { name: "Truck Lighting Bay", code: "LOC-TRUCK-LIGHT", parentLocationId: truck.id, description: "Truck bay for lighting and distro" },
    { name: "Office Camera Shelf", code: "LOC-OFFICE-CAM", parentLocationId: office.id, description: "Primary camera shelf" },
  ];

  for (const location of childLocations) {
    const existing = await prisma.location.findFirst({
      where: { name: location.name, parentLocationId: location.parentLocationId },
    });

    if (existing) {
      await prisma.location.update({ where: { id: existing.id }, data: location });
    } else {
      await prisma.location.create({ data: location });
    }
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

  const studioShelf = await prisma.location.findFirstOrThrow({ where: { name: "Studio Shelf A" } });
  const officeCameraShelf = await prisma.location.findFirstOrThrow({ where: { name: "Office Camera Shelf" } });
  const truckLightingBay = await prisma.location.findFirstOrThrow({ where: { name: "Truck Lighting Bay" } });

  const demoItems = [
    {
      assetId: "CAM-001",
      name: "Sony FX6",
      categoryId: camera.id,
      subcategory: "Cinema camera body",
      brand: "Sony",
      model: "FX6",
      serialNumber: "FX6-28491",
      description: "Full-frame cinema body with top handle and loupe.",
      conditionGrade: "good",
      conditionNotes: "Minor cosmetic wear on handle.",
      status: "available",
      purchaseDate: new Date("2023-04-12"),
      purchasePrice: new Prisma.Decimal(5998),
      purchaseSource: "B&H",
      purchaseReference: "BH-INV-2023-4419",
      warrantyExpiresAt: new Date("2026-04-12"),
      locationId: officeCameraShelf.id,
      ownerName: "William Armstrong",
      qrCodeValue: buildQrCodeValue("CAM-001"),
      replacementValue: new Prisma.Decimal(5998),
      notes: "A-cam body with top handle and LCD loupe.",
    },
    {
      assetId: "CAM-002",
      name: "Leica Q2",
      categoryId: camera.id,
      brand: "Leica",
      model: "Q2",
      serialNumber: "Q2-88320",
      conditionGrade: "good",
      status: "available",
      purchaseDate: new Date("2022-09-21"),
      purchaseSource: "Leica Store SoHo",
      purchaseReference: "LEICA-SOHO-220921",
      locationId: officeCameraShelf.id,
      ownerName: "William Armstrong",
      qrCodeValue: buildQrCodeValue("CAM-002"),
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
      conditionGrade: "fair",
      conditionNotes: "Operational but due for viewfinder service.",
      status: "in_repair",
      locationId: studioShelf.id,
      ownerName: "William Armstrong",
      qrCodeValue: buildQrCodeValue("CAM-003"),
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
      conditionGrade: "excellent",
      status: "available",
      locationId: officeCameraShelf.id,
      qrCodeValue: buildQrCodeValue("LENS-002"),
      replacementValue: new Prisma.Decimal(2298),
    },
    {
      assetId: "LIGHT-003",
      name: "Creamsource Vortex8",
      categoryId: lighting.id,
      brand: "Creamsource",
      model: "Vortex8",
      conditionGrade: "good",
      status: "active",
      locationId: truckLightingBay.id,
      qrCodeValue: buildQrCodeValue("LIGHT-003"),
      replacementValue: new Prisma.Decimal(6499),
      notes: "On shoot truck with power distro.",
    },
    {
      assetId: "LIGHT-004",
      name: "Aputure 600d Pro",
      categoryId: lighting.id,
      brand: "Aputure",
      model: "600d Pro",
      status: "available",
      locationId: truckLightingBay.id,
      qrCodeValue: buildQrCodeValue("LIGHT-004"),
      replacementValue: new Prisma.Decimal(1890),
    },
    {
      assetId: "GRIP-001",
      name: "C-Stand Turtle Base",
      categoryId: grip.id,
      brand: "Matthews",
      status: "available",
      quantity: 4,
      locationId: truck.id,
      qrCodeValue: buildQrCodeValue("GRIP-001"),
      replacementValue: new Prisma.Decimal(250),
    },
    {
      assetId: "PROP-004",
      name: "4x4 Solid",
      categoryId: grip.id,
      status: "available",
      quantity: 2,
      locationId: truck.id,
      qrCodeValue: buildQrCodeValue("PROP-004"),
      replacementValue: new Prisma.Decimal(89),
    },
    {
      assetId: "PWR-001",
      name: "V-Mount Battery 150Wh",
      categoryId: power.id,
      brand: "Core SWX",
      status: "available",
      quantity: 6,
      locationId: truck.id,
      qrCodeValue: buildQrCodeValue("PWR-001"),
      replacementValue: new Prisma.Decimal(379),
    },
    {
      assetId: "AUDIO-001",
      name: "Zoom F6",
      categoryId: audio.id,
      brand: "Zoom",
      model: "F6",
      status: "available",
      locationId: office.id,
      qrCodeValue: buildQrCodeValue("AUDIO-001"),
      replacementValue: new Prisma.Decimal(699),
    },
    {
      assetId: "AUDIO-002",
      name: "Tentacle Sync E",
      categoryId: audio.id,
      brand: "Tentacle",
      status: "available",
      quantity: 3,
      locationId: office.id,
      qrCodeValue: buildQrCodeValue("AUDIO-002"),
      replacementValue: new Prisma.Decimal(229),
    },
    {
      assetId: "TEXT-001",
      name: "Black Duvetyne Curtain",
      categoryId: textiles.id,
      status: "available",
      quantity: 3,
      locationId: storageUnit.id,
      qrCodeValue: buildQrCodeValue("TEXT-001"),
      replacementValue: new Prisma.Decimal(140),
    },
    {
      assetId: "PROP-005",
      name: "Folding Director Chair",
      categoryId: props.id,
      status: "available",
      quantity: 2,
      locationId: truck.id,
      qrCodeValue: buildQrCodeValue("PROP-005"),
      replacementValue: new Prisma.Decimal(95),
    },
    {
      assetId: "PROP-006",
      name: "Prop Crate A",
      categoryId: props.id,
      status: "available",
      locationId: studioShelf.id,
      qrCodeValue: buildQrCodeValue("PROP-006"),
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
        summary: `Created ${created.assetId}`,
        details: "Seeded demo record",
        statusTo: created.status,
        locationId: created.locationId,
        metadata: { source: "seed" },
      },
    });
  }

  const documentaryKit = await prisma.kit.upsert({
    where: { assetId: "KIT-001" },
    update: {
      name: "Documentary A-Cam Kit",
      code: "KIT-DOC-A",
      locationId: officeCameraShelf.id,
      description: "Fast-turn documentary camera package.",
      assetId: "KIT-001",
      qrCodeValue: buildQrCodeValue("KIT-001"),
      status: "available",
    },
    create: {
      name: "Documentary A-Cam Kit",
      assetId: "KIT-001",
      code: "KIT-DOC-A",
      locationId: officeCameraShelf.id,
      description: "Fast-turn documentary camera package.",
      notes: "Core owner-operated doc kit.",
      qrCodeValue: buildQrCodeValue("KIT-001"),
      status: "available",
    },
  });

  const lightingKit = await prisma.kit.upsert({
    where: { assetId: "KIT-002" },
    update: {
      name: "Truck Lighting Core",
      code: "KIT-LIGHT-TRUCK",
      locationId: truckLightingBay.id,
      description: "Core lighting package that lives in the truck.",
      assetId: "KIT-002",
      qrCodeValue: buildQrCodeValue("KIT-002"),
      status: "active",
    },
    create: {
      name: "Truck Lighting Core",
      assetId: "KIT-002",
      code: "KIT-LIGHT-TRUCK",
      locationId: truckLightingBay.id,
      description: "Core lighting package that lives in the truck.",
      qrCodeValue: buildQrCodeValue("KIT-002"),
      status: "active",
    },
  });

  const fx6 = await prisma.item.findUniqueOrThrow({ where: { assetId: "CAM-001" } });
  const gmLens = await prisma.item.findUniqueOrThrow({ where: { assetId: "LENS-002" } });
  const vortex = await prisma.item.findUniqueOrThrow({ where: { assetId: "LIGHT-003" } });
  const aputure = await prisma.item.findUniqueOrThrow({ where: { assetId: "LIGHT-004" } });

  for (const membership of [
    { itemId: fx6.id, kitId: documentaryKit.id, quantity: 1, notes: "Primary body" },
    { itemId: gmLens.id, kitId: documentaryKit.id, quantity: 1, notes: "Default zoom" },
    { itemId: vortex.id, kitId: lightingKit.id, quantity: 1, notes: "Main source" },
    { itemId: aputure.id, kitId: lightingKit.id, quantity: 1, notes: "Secondary daylight source" },
  ]) {
    await prisma.itemKit.upsert({
      where: { itemId_kitId: { itemId: membership.itemId, kitId: membership.kitId } },
      update: membership,
      create: membership,
    });
  }

  await prisma.kitHistoryEvent.upsert({
    where: { id: `${documentaryKit.id}-created` },
    update: {},
    create: {
      id: `${documentaryKit.id}-created`,
      kitId: documentaryKit.id,
      type: "created",
      summary: `Created ${documentaryKit.assetId}`,
      statusTo: documentaryKit.status,
      metadata: { source: "seed" },
    },
  });

  await prisma.kitHistoryEvent.upsert({
    where: { id: `${lightingKit.id}-created` },
    update: {},
    create: {
      id: `${lightingKit.id}-created`,
      kitId: lightingKit.id,
      type: "created",
      summary: `Created ${lightingKit.assetId}`,
      statusTo: lightingKit.status,
      metadata: { source: "seed" },
    },
  });
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
