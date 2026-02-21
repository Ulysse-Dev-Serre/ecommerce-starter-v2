/**
 * Comprehensive E2E Test Data Cleanup
 * Cleans ONLY test data safely
 */

import { prisma } from './db';

/**
 * Complete cleanup of ALL E2E test data
 */
export async function cleanupAllE2EData(testEmail?: string) {
  console.log('🧹 Starting comprehensive E2E cleanup...');

  try {
    // 1. Clean up test orders
    if (testEmail) {
      const deleted = await prisma.order.deleteMany({
        where: { orderEmail: testEmail },
      });
      if (deleted.count > 0) {
        console.log(`✅ Deleted ${deleted.count} test orders`);
      }
    }

    // 2. Clean up test carts (find carts with e2e product variants)
    const e2eProducts = await prisma.product.findMany({
      where: { slug: { startsWith: 'e2e' } },
      include: { variants: { select: { id: true } } },
    });

    if (e2eProducts.length > 0) {
      const variantIds = e2eProducts.flatMap((p: any) =>
        p.variants.map((v: any) => v.id)
      );

      if (variantIds.length > 0) {
        const cartsWithE2E = await prisma.cartItem.findMany({
          where: { variantId: { in: variantIds } },
          select: { cartId: true },
          distinct: ['cartId'],
        });

        if (cartsWithE2E.length > 0) {
          const cartIds = cartsWithE2E.map((c: any) => c.cartId);
          const deletedCarts = await prisma.cart.deleteMany({
            where: { id: { in: cartIds } },
          });
          console.log(`✅ Deleted ${deletedCarts.count} test carts`);
        }
      }
    }

    // 3. Clean up E2E products (cascade deletes variants, pricing, inventory, variant attributes)
    const deletedProducts = await prisma.product.deleteMany({
      where: { slug: { startsWith: 'e2e' } },
    });
    if (deletedProducts.count > 0) {
      console.log(`✅ Deleted ${deletedProducts.count} test products`);
    }

    // 4. Clean up orphaned ProductAttributeValues (no variants using them)
    // First, get all attribute value IDs still in use
    const usedValues = await prisma.productVariantAttributeValue.findMany({
      select: { attributeValueId: true },
      distinct: ['attributeValueId'],
    });
    const usedValueIds = usedValues.map((v: any) => v.attributeValueId);

    // Delete all values NOT in use
    const deletedValues = await prisma.productAttributeValue.deleteMany({
      where: {
        NOT: { id: { in: usedValueIds } },
      },
    });
    if (deletedValues.count > 0) {
      console.log(
        `✅ Deleted ${deletedValues.count} orphaned attribute values`
      );
    }

    // 5. Clean up ProductAttributes with no values left
    const attributesWithoutValues = await prisma.productAttribute.findMany({
      where: { values: { none: {} } },
      select: { id: true },
    });

    if (attributesWithoutValues.length > 0) {
      const deletedAttrs = await prisma.productAttribute.deleteMany({
        where: { id: { in: attributesWithoutValues.map((a: any) => a.id) } },
      });
      console.log(`✅ Deleted ${deletedAttrs.count} orphaned attributes`);
    }

    // 6. Clean up test suppliers
    const deletedSuppliers = await prisma.supplier.deleteMany({
      where: {
        OR: [{ name: { contains: 'E2E' } }, { name: { contains: 'e2e' } }],
      },
    });
    if (deletedSuppliers.count > 0) {
      console.log(`✅ Deleted ${deletedSuppliers.count} test suppliers`);
    }

    console.log('✅ E2E cleanup complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Cleanup encountered errors:', message);
  }
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
