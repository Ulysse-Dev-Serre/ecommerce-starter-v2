-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('ETSY', 'AMAZON', 'EBAY', 'PRINTIFY', 'ALIEXPRESS', 'LOCAL_STOCK', 'DROPSHIPPER', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierOrderStatus" AS ENUM ('PENDING', 'SENT_TO_SUPPLIER', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('DROPSHIPPING', 'LOCAL_STOCK', 'PRINT_ON_DEMAND', 'HYBRID');

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "labelUrl" TEXT;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "apiEndpoint" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" JSONB,
    "defaultCurrency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "defaultShippingDays" INTEGER NOT NULL DEFAULT 7,
    "minimumOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT,
    "supplierSku" TEXT NOT NULL,
    "supplierTitle" TEXT NOT NULL,
    "supplierPrice" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "description" TEXT,
    "images" JSONB,
    "attributes" JSONB,
    "stock" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "leadTimeDays" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "syncErrors" JSONB,
    "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DROPSHIPPING',
    "shippingCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_orders" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderId" TEXT,
    "supplierOrderNumber" TEXT,
    "internalOrderNumber" TEXT NOT NULL,
    "status" "SupplierOrderStatus" NOT NULL DEFAULT 'PENDING',
    "trackingCode" TEXT,
    "carrier" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "notes" TEXT,
    "supplierResponse" JSONB,
    "sentToSupplierAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_order_items" (
    "id" TEXT NOT NULL,
    "supplierOrderId" TEXT NOT NULL,
    "supplierProductId" TEXT,
    "supplierSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "specifications" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trackingCode" TEXT,

    CONSTRAINT "supplier_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_type_isActive_idx" ON "suppliers"("type", "isActive");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "supplier_products_productId_idx" ON "supplier_products"("productId");

-- CreateIndex
CREATE INDEX "supplier_products_supplierId_isAvailable_idx" ON "supplier_products"("supplierId", "isAvailable");

-- CreateIndex
CREATE INDEX "supplier_products_fulfillmentType_idx" ON "supplier_products"("fulfillmentType");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_products_supplierId_supplierSku_key" ON "supplier_products"("supplierId", "supplierSku");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_orders_internalOrderNumber_key" ON "supplier_orders"("internalOrderNumber");

-- CreateIndex
CREATE INDEX "supplier_orders_supplierId_status_idx" ON "supplier_orders"("supplierId", "status");

-- CreateIndex
CREATE INDEX "supplier_orders_orderId_idx" ON "supplier_orders"("orderId");

-- CreateIndex
CREATE INDEX "supplier_orders_status_createdAt_idx" ON "supplier_orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_orders_internalOrderNumber_idx" ON "supplier_orders"("internalOrderNumber");

-- CreateIndex
CREATE INDEX "supplier_order_items_supplierOrderId_idx" ON "supplier_order_items"("supplierOrderId");

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_order_items" ADD CONSTRAINT "supplier_order_items_supplierOrderId_fkey" FOREIGN KEY ("supplierOrderId") REFERENCES "supplier_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
