-- CreateTable
CREATE TABLE "ItemContent" (
    "parentItemId" TEXT NOT NULL,
    "childItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemContent_pkey" PRIMARY KEY ("parentItemId","childItemId")
);

-- AddForeignKey
ALTER TABLE "ItemContent" ADD CONSTRAINT "ItemContent_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContent" ADD CONSTRAINT "ItemContent_childItemId_fkey" FOREIGN KEY ("childItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
