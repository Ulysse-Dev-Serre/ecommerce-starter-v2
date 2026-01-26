-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUND_REQUESTED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN',
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "dimensions" JSONB,
ADD COLUMN     "exportExplanation" TEXT,
ADD COLUMN     "incoterm" TEXT,
ADD COLUMN     "weight" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "incoterm" TEXT NOT NULL DEFAULT 'DDU';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT,
    "path" TEXT,
    "userId" TEXT,
    "anonymousId" TEXT,
    "metadata" JSONB,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_eventType_createdAt_idx" ON "analytics_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_anonymousId_createdAt_idx" ON "analytics_events"("anonymousId", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_createdAt_idx" ON "analytics_events"("userId", "createdAt");
