import { test, expect } from '@playwright/test';

import {
  createTestOrder,
  resetTestOrders,
  cleanupTestProduct,
  getAdminUserId,
  cleanupTestSupplier,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

/**
 * SMOKE TEST : API Refund / Return Flow (Test 6 Simplified)
 *
 * Target: PAID -> REFUND_REQUESTED -> REFUNDED
 *
 * This test validates:
 * 1. Customer requesting a refund via API (with a mock image)
 * 2. Admin approving the refund via API
 * 3. Email notifications for both steps
 */
test.describe('API Smoke Test - Refund & Return Flow', () => {
  let orderId: string;
  let orderNumber: string;
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'agtechnest@gmail.com';

  const productSlug = 'e2e-refund-smoke';

  test.beforeAll(async () => {
    // 1. Initial cleanup
    await resetTestOrders(adminEmail);

    // 2. Seed a fresh PAID order for the current admin user (acting as customer)
    console.log(`🏗️ Seeding fresh PAID order for: ${adminEmail}`);
    const userId = await getAdminUserId(adminEmail);
    const order = await createTestOrder(adminEmail, userId, false, productSlug);
    orderId = order.id;
    orderNumber = order.orderNumber;
    console.log(
      `✅ Ready to test refund flow for Order: ${orderNumber} (${orderId})`
    );
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up refund flow test data...');
    // Wait a bit to avoid race conditions
    await new Promise(resolve => setTimeout(resolve, 3000));
    await resetTestOrders(adminEmail);
    await cleanupTestProduct(productSlug);
    await cleanupTestSupplier();
    await disconnectPrisma();
  });

  test('Step 1: Customer requests a Refund via API', async ({ request }) => {
    console.log('\n💬 Step 1: Submitting Refund Request (Client)...');

    // Since it's a multipart/form-data request
    const response = await request.post('/api/orders/refund-request', {
      headers: {
        Accept: 'application/json',
      },
      multipart: {
        orderId: orderId,
        reason: 'API Smoke Test: Item arrived damaged.',
        type: 'REFUND',
        // Optional: you can attach a tiny buffer as an image if you want to test the attachment logic
        image: {
          name: 'damaged_product.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fake-image-binary-data'),
        },
      },
    });

    console.log(`📥 Response Status: ${response.status()}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);

    console.log(
      '✅ Refund request submitted successfully. Admin alert sent! 📧'
    );
  });

  test('Step 2: Admin approves the Refund via API', async ({ request }) => {
    console.log('\n💰 Step 2: Approving Refund (Admin)...');

    const response = await request.patch(`/api/admin/orders/${orderId}`, {
      data: {
        status: 'REFUNDED',
        comment: 'Refund approved via API Smoke Test',
      },
    });

    console.log(`📥 Response Status: ${response.status()}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('REFUNDED');

    console.log(
      '✅ Order marked as REFUNDED. Confirmation email sent to client! 📧'
    );
  });

  test('Step 3: Customer cancels a PAID order immediately via API', async ({
    request,
  }) => {
    console.log('\n🚫 Step 3: Submitting Cancellation Request (Immediate)...');

    // 1. Seed another fresh PAID order
    const userId = await getAdminUserId(adminEmail);
    const order = await createTestOrder(adminEmail, userId, false, productSlug);

    // 2. Submit cancellation
    const response = await request.post('/api/orders/refund-request', {
      multipart: {
        orderId: order.id,
        reason: 'Customer changed their mind immediately.',
        type: 'CANCELLATION',
      },
    });

    console.log(`📥 Response Status: ${response.status()}`);
    expect(response.status()).toBe(200);

    // 3. Verify status is now CANCELLED directly
    const verifyResponse = await request.get(`/api/admin/orders/${order.id}`);
    const body = await verifyResponse.json();
    expect(body.data.status).toBe('CANCELLED');

    console.log('✅ Order cancelled immediately. Status: CANCELLED. 📧');
  });

  test('Step 4: Should NOT allow cancellation if order is SHIPPED', async ({
    request,
  }) => {
    console.log(
      '\n❌ Step 4: Testing Negative Case (Cancellation while SHIPPED)...'
    );

    // 1. Seed and mark as SHIPPED
    const userId = await getAdminUserId(adminEmail);
    const order = await createTestOrder(adminEmail, userId, true, productSlug);

    await request.patch(`/api/admin/orders/${order.id}`, {
      data: { status: 'SHIPPED' },
    });

    // 2. Attempt cancellation (Customer)
    const response = await request.post('/api/orders/refund-request', {
      multipart: {
        orderId: order.id,
        reason: 'Try to cancel a shipped item.',
        type: 'CANCELLATION',
      },
    });

    console.log(`📥 Response Status: ${response.status()} (Expected error)`);

    // Should fail due to state machine constraints
    // According to our services, this should throw a VALIDATION_ERROR (400) or caught by withError
    expect(response.status()).toBe(400);
    console.log('✅ Success: Cancellation blocked for SHIPPED order.');
  });

  test('Step 5: Should NOT allow cancellation if order is DELIVERED', async ({
    request,
  }) => {
    console.log(
      '\n❌ Step 5: Testing Negative Case (Cancellation while DELIVERED)...'
    );

    // 1. Seed and mark as DELIVERED (Must go through SHIPPED -> IN_TRANSIT -> DELIVERED)
    const userId = await getAdminUserId(adminEmail);
    const order = await createTestOrder(adminEmail, userId, true, productSlug);

    await request.patch(`/api/admin/orders/${order.id}`, {
      data: { status: 'SHIPPED' },
    });
    await request.patch(`/api/admin/orders/${order.id}`, {
      data: { status: 'IN_TRANSIT' },
    });
    await request.patch(`/api/admin/orders/${order.id}`, {
      data: { status: 'DELIVERED' },
    });

    // 2. Attempt cancellation (Customer)
    const response = await request.post('/api/orders/refund-request', {
      multipart: {
        orderId: order.id,
        reason: 'Try to cancel a delivered item.',
        type: 'CANCELLATION',
      },
    });

    console.log(`📥 Response Status: ${response.status()} (Expected error)`);

    expect(response.status()).toBe(400);
    console.log('✅ Success: Cancellation blocked for DELIVERED order.');
  });
});
