import { test, expect } from '@playwright/test';
import {
  createTestOrder,
  disconnectPrisma,
  resetTestOrders,
  cleanupTestProduct,
} from '../fixtures/seed-test-data';
import { verifyEmailSent } from '../fixtures/resend-helper';

/**
 * Order Status & Email Verification Test
 *
 * Verifies the transition cycle: PAID -> SHIPPED -> DELIVERED
 * For each step:
 * 1. Admin UI button click
 * 2. Visual verification of the status Badge
 * 3. External verification via Resend API (Real email sent)
 */
test.describe('Order Status Flow - UI Badges & Emails', () => {
  let orderId: string;
  let orderNumber: string;
  const adminEmail = process.env.ADMIN_EMAIL || 'agtechnest@gmail.com';

  test.beforeAll(async () => {
    // We seed a fresh PAID order with a dummy shipment to allow the "Shipped" email to find a tracking code
    const order = await createTestOrder(adminEmail, undefined, true);
    orderId = order.id;
    orderNumber = order.orderNumber;
    console.log(`✨ Testing status flow for Order: ${orderNumber}`);
  });

  test.afterAll(async () => {
    console.log('🧹 Final cleanup after Status Verification test...');
    await resetTestOrders(adminEmail);
    await cleanupTestProduct('e2e-checkout-product-fixed');
    await disconnectPrisma();
  });

  test('Step 1: Admin marks as SHIPPED - UI Badge & Tracking Email', async ({
    page,
  }) => {
    await page.goto(`/en/admin/orders/${orderId}`);

    // Action
    const shipBtn = page
      .locator('button')
      .filter({ hasText: /Mark as Shipped|Marquer comme expédié/i });
    await expect(shipBtn).toBeVisible();

    // Handle confirmation dialog
    page.once('dialog', dialog => dialog.accept());
    await shipBtn.click();

    // Verify UI Badge
    const shippedBadge = page
      .locator('.vibe-badge')
      .filter({ hasText: /Shipped|Expédiée/i });
    await expect(shippedBadge).toBeVisible({ timeout: 10000 });
    console.log('✅ UI Badge updated to SHIPPED');

    // Verify Resend Email
    console.log(`📧 Checking Resend for Shipped email (${orderNumber})...`);
    const emailVerified = await verifyEmailSent({
      recipient: adminEmail,
      subjectInclude: orderNumber, // Subject usually contains order number
    });
    expect(emailVerified).toBe(true);
  });

  test('Step 2: Admin marks as DELIVERED - UI Badge & Delivery Email', async ({
    page,
  }) => {
    await page.goto(`/en/admin/orders/${orderId}`);

    // Logic: SHIPPED -> IN_TRANSIT -> DELIVERED (if your UI combines them or step by step)
    // We assume buttons are visible based on current state
    const deliveredBtn = page
      .locator('button')
      .filter({ hasText: /Mark as Delivered|Marquer comme livré/i });
    if (!(await deliveredBtn.isVisible())) {
      // Might need IN_TRANSIT first depending on your specific state machine
      const transitBtn = page
        .locator('button')
        .filter({ hasText: /In Transit/i });
      if (await transitBtn.isVisible()) await transitBtn.click();
    }

    await expect(deliveredBtn).toBeVisible({ timeout: 5000 });
    page.once('dialog', dialog => dialog.accept());
    await deliveredBtn.click();

    // Verify UI Badge
    const deliveredBadge = page
      .locator('.vibe-badge')
      .filter({ hasText: /Delivered|Livrée/i });
    await expect(deliveredBadge).toBeVisible({ timeout: 10000 });
    console.log('✅ UI Badge updated to DELIVERED');

    // Verify Resend Email
    console.log(`📧 Checking Resend for Delivered email (${orderNumber})...`);
    const emailVerified = await verifyEmailSent({
      recipient: adminEmail,
      subjectInclude: orderNumber,
    });
    expect(emailVerified).toBe(true);
  });
});
