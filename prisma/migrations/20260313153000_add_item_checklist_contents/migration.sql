CREATE TABLE "ItemChecklistContent" (
    "id" TEXT NOT NULL,
    "parentItemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemChecklistContent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ItemChecklistContent_parentItemId_sortOrder_createdAt_idx"
ON "ItemChecklistContent"("parentItemId", "sortOrder", "createdAt");

ALTER TABLE "ItemChecklistContent"
ADD CONSTRAINT "ItemChecklistContent_parentItemId_fkey"
FOREIGN KEY ("parentItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
