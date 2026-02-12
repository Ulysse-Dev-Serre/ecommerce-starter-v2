/**
 * Seed test data for E2E tests
 * Creates realistic test fixtures for shipping and product tests
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * Seed a test supplier with real Repentigny, QC address
 * This is used as shipping origin for product tests
 */
export async function seedTestSupplier() {
  // Check if test supplier already exists
  const existing = await prisma.supplier.findFirst({
    where: { name: 'E2E Test Warehouse - Repentigny V2' },
  });

  if (existing) {
    console.log('✅ Test supplier already exists:', existing.id);
    return existing;
  }

  // Create supplier with real Repentigny coordinates
  const supplier = await prisma.supplier.create({
    data: {
      name: 'E2E Test Warehouse - Repentigny V2',
      type: 'LOCAL_STOCK',
      isActive: true,
      contactEmail: 'warehouse@e2etest.com',
      contactPhone: '+1 (450) 555-0100',
      address: {
        street1: '435 Rue Notre-Dame',
        city: 'Repentigny',
        state: 'QC',
        zip: 'J6A 2T8',
        country: 'CA',
      },
      defaultCurrency: 'CAD',
      incoterm: 'DDP', // Delivered Duty Paid
      defaultShippingDays: 3,
      minimumOrderAmount: 0,
    },
  });

  console.log('✅ Created test supplier:', supplier.id);
  return supplier;
}

/**
 * Get or Create a stable test product for Checkout E2E tests
 * This avoids polluting DB with infinite test products
 */
export async function getOrCreateTestProduct(supplierId: string) {
  const fixedSlug = 'e2e-checkout-product-fixed';

  // 1. Try to find existing product
  const existing = await prisma.product.findUnique({
    where: { slug: fixedSlug },
    include: { variants: true },
  });

  if (existing) {
    console.log('✅ Found existing test product:', existing.slug);
    return existing;
  }

  // 2. Create if not exists
  console.log('🆕 Creating new test product:', fixedSlug);
  const product = await prisma.product.create({
    data: {
      slug: fixedSlug,
      status: 'ACTIVE',
      shippingOriginId: supplierId,
      weight: 1.5,
      dimensions: { length: 20, width: 15, height: 10 },
      translations: {
        create: [
          {
            language: 'EN',
            name: `E2E Checkout Product (Fixed)`,
            description: 'Stable automated test product',
          },
          {
            language: 'FR',
            name: `Produit E2E Checkout (Fixe)`,
            description: 'Produit test stable',
          },
        ],
      },
      variants: {
        create: {
          sku: `SKU-E2E-FIXED`,
          weight: 1.5,
          pricing: {
            create: {
              price: 29.99,
              currency: 'CAD',
              isActive: true,
            },
          },
          inventory: {
            create: {
              stock: 9999, // High stock to avoid depletion
              trackInventory: true,
            },
          },
        },
      },
    },
    include: {
      variants: true,
    },
  });

  return product;
}

/**
 * Cleanup test product (Optional - only if we want to reset completely)
 */
export async function cleanupTestProduct(slug: string) {
  if (!slug) return;

  await prisma.product.deleteMany({
    where: { slug: slug },
  });
  console.log(`🗑️  Cleaned up test product: ${slug}`);
}

/**
 * Clean up test data (optional, for test teardown)
 */
export async function cleanupTestSupplier() {
  await prisma.supplier.deleteMany({
    where: { name: 'E2E Test Warehouse - Repentigny V2' },
  });
  console.log('🗑️  Cleaned up test supplier');
}

/**
 * Get test supplier ID (creates if doesn't exist)
 */
export async function getTestSupplierId(): Promise<string> {
  const supplier = await seedTestSupplier();
  return supplier.id;
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
