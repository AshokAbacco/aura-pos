-- Floor plan for the billing counter: chairs grouped by floor, each with at most one open ticket.
-- Written to be safe to re-run: every step is skipped if it is already in place (for example when
-- an earlier attempt applied part of it, or the columns were added with `prisma db push`).

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "floor" TEXT NOT NULL DEFAULT 'Ground floor';
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChairTicket" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "customerId" UUID,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "openedById" UUID NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChairTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChairTicket_resourceId_key" ON "ChairTicket"("resourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChairTicket_tenantId_branchId_idx" ON "ChairTicket"("tenantId", "branchId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChairTicket_resourceId_fkey') THEN
    ALTER TABLE "ChairTicket" ADD CONSTRAINT "ChairTicket_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;