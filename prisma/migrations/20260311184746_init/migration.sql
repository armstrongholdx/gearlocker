-- CreateEnum
CREATE TYPE "ConditionGrade" AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('available', 'active', 'in_repair', 'missing', 'stolen', 'sold', 'retired');

-- CreateEnum
CREATE TYPE "KitStatus" AS ENUM ('available', 'active', 'incomplete', 'retired');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('photo', 'receipt', 'serial_photo', 'manual', 'warranty', 'misc');

-- CreateEnum
CREATE TYPE "AttachmentStorageProvider" AS ENUM ('supabase', 'external', 'local_placeholder');

-- CreateEnum
CREATE TYPE "ItemHistoryType" AS ENUM ('created', 'updated', 'checked_in', 'checked_out', 'moved', 'repair', 'missing', 'stolen', 'sold', 'note');

-- CreateEnum
CREATE TYPE "KitHistoryType" AS ENUM ('created', 'updated', 'checked_out', 'return_started', 'return_completed', 'incomplete', 'note');

-- CreateEnum
CREATE TYPE "KitVerificationStatus" AS ENUM ('in_progress', 'completed', 'incomplete');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategory" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "description" TEXT,
    "conditionGrade" "ConditionGrade",
    "conditionNotes" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'available',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "replacementValue" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "purchaseSource" TEXT,
    "purchaseReference" TEXT,
    "warrantyExpiresAt" TIMESTAMP(3),
    "locationId" TEXT,
    "notes" TEXT,
    "ownerName" TEXT,
    "qrCodeValue" TEXT NOT NULL,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "imageCoverUrl" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageProvider" "AttachmentStorageProvider" NOT NULL DEFAULT 'supabase',
    "storageBucket" TEXT,
    "storagePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "status" "KitStatus" NOT NULL DEFAULT 'available',
    "locationId" TEXT,
    "notes" TEXT,
    "qrCodeValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemKit" (
    "itemId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemKit_pkey" PRIMARY KEY ("itemId","kitId")
);

-- CreateTable
CREATE TABLE "ItemHistoryEvent" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "ItemHistoryType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "note" TEXT,
    "statusFrom" "ItemStatus",
    "statusTo" "ItemStatus",
    "locationId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ItemHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitHistoryEvent" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "type" "KitHistoryType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "note" TEXT,
    "statusFrom" "KitStatus",
    "statusTo" "KitStatus",
    "metadata" JSONB,

    CONSTRAINT "KitHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitVerificationSession" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "status" "KitVerificationStatus" NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "startedNote" TEXT,
    "completionNote" TEXT,

    CONSTRAINT "KitVerificationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitVerificationItem" (
    "sessionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "expected" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "isPresent" BOOLEAN,
    "note" TEXT,

    CONSTRAINT "KitVerificationItem_pkey" PRIMARY KEY ("sessionId","itemId")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentLocationId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Item_assetId_key" ON "Item"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_qrCodeValue_key" ON "Item"("qrCodeValue");

-- CreateIndex
CREATE INDEX "Item_status_createdAt_idx" ON "Item"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Item_categoryId_status_idx" ON "Item"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Item_locationId_status_idx" ON "Item"("locationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Attachment_itemId_type_idx" ON "Attachment"("itemId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_assetId_key" ON "Kit"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_code_key" ON "Kit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_qrCodeValue_key" ON "Kit"("qrCodeValue");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_name_locationId_key" ON "Kit"("name", "locationId");

-- CreateIndex
CREATE INDEX "ItemHistoryEvent_itemId_timestamp_idx" ON "ItemHistoryEvent"("itemId", "timestamp");

-- CreateIndex
CREATE INDEX "KitHistoryEvent_kitId_timestamp_idx" ON "KitHistoryEvent"("kitId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_parentLocationId_key" ON "Location"("name", "parentLocationId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kit" ADD CONSTRAINT "Kit_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemKit" ADD CONSTRAINT "ItemKit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemKit" ADD CONSTRAINT "ItemKit_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemHistoryEvent" ADD CONSTRAINT "ItemHistoryEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemHistoryEvent" ADD CONSTRAINT "ItemHistoryEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitHistoryEvent" ADD CONSTRAINT "KitHistoryEvent_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitVerificationSession" ADD CONSTRAINT "KitVerificationSession_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitVerificationItem" ADD CONSTRAINT "KitVerificationItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KitVerificationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitVerificationItem" ADD CONSTRAINT "KitVerificationItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
