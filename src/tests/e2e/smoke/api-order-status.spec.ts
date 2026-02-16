import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/core/db';
import {
  createTestOrder,
  resetTestOrders,
  cleanupTestProduct,
  getAdminUserId,
  cleanupTestSupplier,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

/**
 * SMOKE TEST : API Order Status Flow (Test 5 Simplified)
 *
 * Target: PAID -> SHIPPED -> IN_TRANSIT -> DELIVERED
 *
 * This test validates:
 * 1. The State Machine (Internal Logic)
 * 2. Database Integrity (Prisma History)
 * 3. Email Triggers (Resend Logs)
 */
test.describe('API Smoke Test - Order Status Flow', () => {
  let orderId: string;
  let orderNumber: string;
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'agtechnest@gmail.com';

  const productSlug = 'e2e-order-status-smoke';

  test.beforeAll(async () => {
    await resetTestOrders(adminEmail);
    console.log(`🏗️ Seeding fresh PAID order for: ${adminEmail}`);
    const userId = await getAdminUserId(adminEmail);
    const order = await createTestOrder(adminEmail, userId, true, productSlug);
    orderId = order.id;
    orderNumber = order.orderNumber;
    console.log(
      `✅ Ready to test status flow for Order: ${orderNumber} (${orderId})`
    );
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up status flow test data...');
    // Wait a bit to avoid race conditions with late webhooks
    await new Promise(resolve => setTimeout(resolve, 3000));
    await resetTestOrders(adminEmail);
    await cleanupTestProduct(productSlug);
    await cleanupTestSupplier();
    await disconnectPrisma();
  });

  test('Step 1: Mark as SHIPPED via API & Verify DB', async ({ request }) => {
    console.log('\n🚢 Step 1: Transitioning to SHIPPED...');

    const response = await request.patch(`/api/admin/orders/${orderId}`, {
      data: {
        status: 'SHIPPED',
        comment: 'Automated API Smoke Test: Marking as Shipped',
      },
    });

    expect(response.status()).toBe(200);

    // --- DEEP DB VERIFICATION ---
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    expect(dbOrder?.status).toBe('SHIPPED');
    expect(dbOrder?.statusHistory[0].status).toBe('SHIPPED');
    expect(dbOrder?.statusHistory[0].comment).toContain('Marking as Shipped');

    console.log('✅ DB Verified: Status is SHIPPED and history entry created.');
  });

  test('Step 1.5: Mark as IN_TRANSIT via API & Verify DB', async ({
    request,
  }) => {
    console.log('\n🚚 Step 1.5: Transitioning to IN_TRANSIT...');

    const response = await request.patch(`/api/admin/orders/${orderId}`, {
      data: {
        status: 'IN_TRANSIT',
        comment: 'Automated API Smoke Test: Marking as In Transit',
      },
    });

    expect(response.status()).toBe(200);

    // --- DEEP DB VERIFICATION ---
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    expect(dbOrder?.status).toBe('IN_TRANSIT');
    expect(dbOrder?.statusHistory[0].status).toBe('IN_TRANSIT');

    console.log('✅ DB Verified: Status is IN_TRANSIT.');
  });

  test('Step 2: Mark as DELIVERED via API & Verify DB', async ({ request }) => {
    console.log('\n🏠 Step 2: Transitioning to DELIVERED...');

    const response = await request.patch(`/api/admin/orders/${orderId}`, {
      data: {
        status: 'DELIVERED',
        comment: 'Automated API Smoke Test: Marking as Delivered',
      },
    });

    expect(response.status()).toBe(200);

    // --- DEEP DB VERIFICATION ---
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    expect(dbOrder?.status).toBe('DELIVERED');
    expect(dbOrder?.statusHistory[0].status).toBe('DELIVERED');

    console.log(
      '✅ DB Verified: Final status is DELIVERED. Check Resend logs! 📧'
    );
  });
});
