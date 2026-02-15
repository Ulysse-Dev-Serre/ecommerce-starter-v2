/**
 * Seed test data for E2E tests
 * Creates realistic test fixtures for shipping and product tests
 */

import { prisma } from '@/lib/core/db';
import { CreateProductSchema } from '@/lib/validators/product';
import { cleanupOrphanedAttributes } from '@/lib/services/attributes/attribute-cleanup.service';

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
 * REINFORCED: Now uses Zod to validate data before DB insertion.
 */
export async function getOrCreateTestProduct(supplierId: string) {
  const fixedSlug = 'e2e-checkout-product-fixed';

  // 1. FORCE CLEANUP: Never reuse old data. Always start fresh.
  await cleanupTestProduct(fixedSlug);

  // 2. Define data
  const rawData = {
    slug: fixedSlug,
    status: 'ACTIVE' as const,
    shippingOriginId: supplierId,
    weight: 1.5,
    dimensions: { length: 20, width: 15, height: 10, unit: 'cm' },
    originCountry: 'CA',
    hsCode: '123456',
    incoterm: 'DDP',
    exportExplanation: 'Stable automated test product for customs validation',
    translations: [
      {
        language: 'en' as const,
        name: `E2E Checkout Product (Fixed)`,
        description: 'Stable automated test product',
      },
      {
        language: 'fr' as const,
        name: `Produit E2E Checkout (Fixe)`,
        description: 'Produit test stable',
      },
    ],
  };

  // 3. Validate with Zod before creating (ensures 100% legal product)
  console.log('🧐 Validating product seed data with Zod...');
  const validatedData = CreateProductSchema.parse(rawData);

  // 4. Create in DB (Mapping Zod structure to Prisma structure if needed)
  console.log('🆕 Creating new test product:', fixedSlug);
  const product = await prisma.product.create({
    data: {
      slug: validatedData.slug,
      status: validatedData.status,
      shippingOriginId: validatedData.shippingOriginId,
      weight: validatedData.weight as number,
      dimensions: validatedData.dimensions,
      originCountry: validatedData.originCountry,
      hsCode: validatedData.hsCode,
      incoterm: validatedData.incoterm,
      exportExplanation: validatedData.exportExplanation,
      translations: {
        create: validatedData.translations.map(t => ({
          language: t.language.toUpperCase() as any, // DB uses 'EN', Zod uses 'en'
          name: t.name,
          description: t.description,
        })),
      },
      variants: {
        create: {
          sku: `SKU-E2E-FIXED`,
          weight: validatedData.weight as number,
          pricing: {
            create: {
              price: 29.99,
              currency: 'CAD',
              isActive: true,
            },
          },
          inventory: {
            create: {
              stock: 9999,
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

  // Clean up orphaned attributes after deleting test product
  await cleanupOrphanedAttributes();

  console.log(`🗑️  Cleaned up test product and orphaned attributes: ${slug}`);
}

/**
 * Clean up test data (optional, for test teardown)
 */
export async function cleanupTestSupplier() {
  await prisma.supplier.deleteMany({
    where: {
      OR: [{ name: { contains: 'E2E' } }, { name: { contains: 'e2e' } }],
    },
  });
  console.log('🗑️  Cleaned up all E2E test suppliers');
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

/**
 * Reset test orders to ensure a clean state before E2E run
 * - Deletes orders associated with the test email
 */
export async function resetTestOrders(testEmail: string) {
  if (!testEmail) return;
  console.log(`🧹 Cleaning up orders for test email: ${testEmail}...`);

  // Find users or orders with this email
  // First delete order items, shipments, payments due to foreign keys if cascade is not set
  // Assuming cascade delete is set on Order -> Items, but let's be safe:

  // Simplest: Find order IDs
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { orderEmail: testEmail },
        // Also check shipping address email if stored in JSON or relayed
      ],
    },
    select: { id: true, orderNumber: true },
  });

  if (orders.length === 0) {
    console.log('✅ No stale orders found.');
    return;
  }

  console.log(`🗑️ Deleting ${orders.length} stale orders...`);

  // Delete one by one or batch
  const orderIds = orders.map(o => o.id);

  // Note: Prisma cascade delete logic depends on schema.
  // If cascading is configured in schema.prisma, deleting order is enough.
  // If not, we might fail. Let's try deleting orders directly.
  try {
    await prisma.order.deleteMany({
      where: { id: { in: orderIds } },
    });
    console.log('✅ Stale orders deleted.');
    // ...existing code...
  } catch (err: any) {
    console.warn(
      '⚠️ Failed to delete stale orders (likely foreign key constraints):',
      err.message
    );
  }
}

/**
 * Get Admin User ID by email
 */
export async function getAdminUserId(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user?.id;
}

/**
 * Create a simple PAID order for testing Admin Label features directly
 */
export async function createTestOrder(
  testEmail: string,
  userId?: string,
  withShipment: boolean = false
) {
  const supplierId = await getTestSupplierId();
  const product = await getOrCreateTestProduct(supplierId);
  const variant = product.variants[0];

  console.log('🆕 Seeding a direct PAID order for Admin tests...');

  const order = await prisma.order.create({
    data: {
      status: 'PAID',
      userId: userId, // Link to user if provided
      orderNumber: `ORD-TEST-${Date.now()}`,
      orderEmail: testEmail,
      currency: 'CAD',
      totalAmount: 39.99,
      subtotalAmount: 29.99,
      shippingAmount: 10.0,
      taxAmount: 0,

      // Crucial: Full Shipping Address
      shippingAddress: {
        name: 'John Test Seeder',
        firstName: 'John',
        lastName: 'Test Seeder',
        email: testEmail,
        phone: '5145550000',
        street1: '1100 Rue de la Gauchetière O',
        city: 'Montréal',
        state: 'QC',
        zip: 'H3B 2S2' as any,
        country: 'CA' as any,
      },

      billingAddress: {
        name: 'John Test Seeder',
        street1: '1100 Rue de la Gauchetière O',
        city: 'Montréal',
        state: 'QC',
        zip: 'H3B 2S2' as any,
        country: 'CA' as any,
      },

      items: {
        create: [
          {
            variantId: variant.id,
            quantity: 1,
            unitPrice: 29.99,
            totalPrice: 29.99,
            productId: product.id,
            productSnapshot: {
              name: product.slug, // Translations not loaded, using slug
              sku: variant.sku,
            },
            currency: 'CAD',
          },
        ],
      },

      shipments: withShipment
        ? {
            create: [
              {
                trackingCode: `TRK-TEST-${Date.now()}`,
                carrier: 'CNE_EXPRESS',
                status: 'PENDING',
                labelUrl: 'https://example.com/label.pdf',
              },
            ],
          }
        : undefined,
    },
  });

  console.log(`✅ Seeded order: ${order.orderNumber} (${order.id})`);
  return order;
}

/**
 * Verify order exists and is PAID (Polling for Webhook latency)
 */
export async function verifyOrderCreated(
  email: string,
  maxAttempts = 20
): Promise<any> {
  console.log(`🔍 Polling DB for order created by ${email}...`);
  for (let i = 0; i < maxAttempts; i++) {
    const order = await prisma.order.findFirst({
      where: { orderEmail: email },
      orderBy: { createdAt: 'desc' },
    });

    if (order && order.status === 'PAID') {
      console.log(
        `✅ Order found in DB: ${order.orderNumber} (Status: ${order.status})`
      );
      return order;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return null;
}

/**
 * Verify product exists and has correct status (Polling for async processing)
 */
export async function verifyProductCreated(
  slug: string,
  status = 'ACTIVE',
  maxAttempts = 20
): Promise<any> {
  console.log(`🔍 Polling DB for product slug: ${slug}...`);
  for (let i = 0; i < maxAttempts; i++) {
    const product = await prisma.product.findUnique({
      where: { slug: slug },
      include: { variants: true },
    });

    if (product && product.status === status) {
      console.log(
        `✅ Product found in DB: ${product.slug} (Status: ${product.status})`
      );
      return product;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return null;
}
