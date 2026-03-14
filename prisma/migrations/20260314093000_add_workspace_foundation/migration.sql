CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMembership" (
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("workspaceId","userId")
);

CREATE UNIQUE INDEX "AppUser_supabaseUserId_key" ON "AppUser"("supabaseUserId");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

ALTER TABLE "Category" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Item" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Tag" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Kit" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "ItemHistoryEvent" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "KitHistoryEvent" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "KitVerificationSession" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Location" ADD COLUMN "workspaceId" TEXT;

ALTER TABLE "Workspace"
ADD CONSTRAINT "Workspace_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMembership"
ADD CONSTRAINT "WorkspaceMembership_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMembership"
ADD CONSTRAINT "WorkspaceMembership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category"
ADD CONSTRAINT "Category_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Item"
ADD CONSTRAINT "Item_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tag"
ADD CONSTRAINT "Tag_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Kit"
ADD CONSTRAINT "Kit_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ItemHistoryEvent"
ADD CONSTRAINT "ItemHistoryEvent_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KitHistoryEvent"
ADD CONSTRAINT "KitHistoryEvent_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KitVerificationSession"
ADD CONSTRAINT "KitVerificationSession_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Location"
ADD CONSTRAINT "Location_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
