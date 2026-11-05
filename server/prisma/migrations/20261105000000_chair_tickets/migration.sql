-- Floor plan for the billing counter: chairs grouped by floor, each with at most one open ticket.

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "floor" TEXT NOT NULL DEFAULT 'Ground floor',
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ChairTicket" (
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
CREATE UNIQUE INDEX "ChairTicket_resourceId_key" ON "ChairTicket"("resourceId");

-- CreateIndex
CREATE INDEX "ChairTicket_tenantId_branchId_idx" ON "ChairTicket"("tenantId", "branchId");

-- AddForeignKey
ALTER TABLE "ChairTicket" ADD CONSTRAINT "ChairTicket_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;