/**
 * Seed test data for E2E tests
 * Creates realistic test fixtures for shipping and product tests
 */

import { prisma } from '@/lib/core/db';
import { Prisma, Language, Order, Product } from '@/generated/prisma';
import { CreateProductSchema } from '@/lib/validators/product';
import { createLocationSchema } from '@/lib/validators/admin';
import { updateIntentSchema } from '@/lib/validators/checkout';
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

  const rawData = {
    name: 'E2E Test Warehouse - Repentigny V2',
    type: 'LOCAL_STOCK' as const,
    incoterm: 'DDP' as const,
    address: {
      name: 'E2E Test Warehouse',
      street1: '435 Rue Notre-Dame',
      city: 'Repentigny',
      state: 'QC',
      zip: 'J6A 2T8',
      country: 'CA',
      email: 'agtechnest@gmail.com',
      phone: '5145550100',
    },
  };

  // 1. Validate with Zod - "Zod is the only source of truth"
  console.log('🧐 Validating warehouse seed data with Zod...');
  const validatedData = createLocationSchema.parse(rawData);

  if (existing) {
    console.log('✅ Updating existing test supplier info:', existing.id);
    return await prisma.supplier.update({
      where: { id: existing.id },
      data: {
        contactEmail: validatedData.address.email,
        contactPhone: validatedData.address.phone,
        incoterm: validatedData.incoterm,
        address: validatedData.address as Prisma.InputJsonValue,
      },
    });
  }

  // Create supplier using validated data
  console.log('🆕 Creating new test supplier:', validatedData.name);
  const supplier = await prisma.supplier.create({
    data: {
      name: validatedData.name,
      type: validatedData.type,
      isActive: true,
      contactEmail: validatedData.address.email,
      contactPhone: validatedData.address.phone,
      address: validatedData.address as Prisma.InputJsonValue,
      defaultCurrency: 'CAD',
      incoterm: validatedData.incoterm,
      defaultShippingDays: 3,
      minimumOrderAmount: 0,
    },
  });

  console.log('✅ Created test supplier:', supplier.id);
  return supplier;
}

/**
 * Get or Create a stable test product for E2E tests
 * This avoids polluting DB with infinite test products
 * REINFORCED: Now uses Zod to validate data before DB insertion.
 * @param supplierId - The supplier ID to link to
 * @param customSlug - Optional custom slug, defaults to 'e2e-checkout-product-fixed'
 */
export async function getOrCreateTestProduct(
  supplierId: string,
  customSlug: string = 'e2e-checkout-product-fixed'
) {
  // 1. FORCE CLEANUP: Never reuse old data. Always start fresh.
  await cleanupTestProduct(customSlug);

  // 2. Define data
  const rawData = {
    slug: customSlug,
    status: 'ACTIVE' as const,
    shippingOriginId: supplierId,
    weight: 1.5,
    dimensions: { length: 20, width: 15, height: 10, unit: 'cm' },
    originCountry: 'CA',
    hsCode: '123456',
    exportExplanation: 'Stable automated test product for customs validation',
    translations: [
      {
        language: 'en' as const,
        name: `E2E Product (${customSlug})`,
        description: 'Stable automated test product',
      },
      {
        language: 'fr' as const,
        name: `Produit E2E (${customSlug})`,
        description: 'Produit test stable',
      },
    ],
  };

  // 3. Validate with Zod before creating (ensures 100% legal product)
  console.log('🧐 Validating product seed data with Zod...');
  const validatedData = CreateProductSchema.parse(rawData);

  // 4. Create in DB (Mapping Zod structure to Prisma structure if needed)
  console.log('🆕 Creating new test product:', customSlug);
  const product = await prisma.product.create({
    data: {
      slug: validatedData.slug,
      status: validatedData.status,
      shippingOriginId: validatedData.shippingOriginId,
      weight: validatedData.weight as number,
      dimensions: validatedData.dimensions,
      originCountry: validatedData.originCountry,
      hsCode: validatedData.hsCode,
      exportExplanation: validatedData.exportExplanation,
      translations: {
        create: validatedData.translations.map(t => ({
          language: t.language.toUpperCase() as Language, // DB uses 'EN', Zod uses 'en'
          name: t.name,
          description: t.description,
        })),
      },
      variants: {
        create: {
          sku: `SKU-${customSlug.toUpperCase()}`,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      '⚠️ Failed to delete stale orders (likely foreign key constraints):',
      message
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
  withShipment: boolean = false,
  productSlug: string = 'e2e-checkout-product-fixed'
) {
  const supplierId = await getTestSupplierId();
  const product = await getOrCreateTestProduct(supplierId, productSlug);
  const variant = product.variants[0];

  console.log('🆕 Seeding a direct PAID order for Admin tests...');

  const orderData = {
    data: {
      status: 'PAID' as const,
      userId: userId,
      orderNumber: `ORD-TEST-${Date.now()}`,
      orderEmail: testEmail,
      language: 'EN' as const,
      currency: 'CAD',
      totalAmount: 39.99,
      subtotalAmount: 29.99,
      shippingAmount: 10.0,
      taxAmount: 0,
      shippingAddress: {
        name: 'John Test Seeder',
        email: testEmail,
        phone: '5145550000',
        street1: '1100 Rue de la Gauchetière O',
        city: 'Montréal',
        state: 'QC',
        zip: 'H3B 2S2',
        country: 'CA',
      },
      billingAddress: {
        name: 'John Test Seeder',
        email: testEmail,
        phone: '5145550000',
        street1: '1100 Rue de la Gauchetière O',
        city: 'Montréal',
        state: 'QC',
        zip: 'H3B 2S2',
        country: 'CA',
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
              name: product.slug,
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
                status: 'PENDING' as const,
                labelUrl: 'https://example.com/label.pdf',
              },
            ],
          }
        : undefined,
    },
  };

  // 1. Validate addresses with Zod - "Zod is the only source of truth"
  console.log('🧐 Validating order addresses with Zod...');
  const addressSchema = updateIntentSchema.shape.shippingDetails.unwrap();
  addressSchema.parse(orderData.data.shippingAddress);
  addressSchema.parse(orderData.data.billingAddress);

  // 2. Create in DB
  const order = await prisma.order.create(orderData);

  console.log(`✅ Seeded order: ${order.orderNumber} (${order.id})`);
  return order;
}

/**
 * Verify order exists and is PAID (Polling for Webhook latency)
 */
export async function verifyOrderCreated(
  email: string,
  maxAttempts = 20
): Promise<Order | null> {
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
): Promise<Product | null> {
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
