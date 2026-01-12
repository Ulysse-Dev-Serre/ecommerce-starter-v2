-- AlterTable
ALTER TABLE "products" ADD COLUMN     "hsCode" TEXT,
ADD COLUMN     "originCountry" CHAR(2),
ADD COLUMN     "shippingOriginId" TEXT;

-- CreateIndex
CREATE INDEX "products_shippingOriginId_idx" ON "products"("shippingOriginId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shippingOriginId_fkey" FOREIGN KEY ("shippingOriginId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
