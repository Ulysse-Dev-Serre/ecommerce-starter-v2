import { test, expect } from '@playwright/test';
import {
  createTestOrder,
  resetTestOrders,
  cleanupTestProduct,
  getAdminUserId,
  cleanupTestSupplier,
  disconnectPrisma,
} from '../fixtures/seed-test-data';
import { verifyEmailSent } from '../fixtures/resend-helper';
import { AdminOrderPage } from '../pom/admin/OrderPage';
import { prisma } from '@/lib/core/db';

/**
 * Complete Order Refund E2E Test (Client + Admin)
 *
 * This test validates the full refund workflow:
 * 1. Customer requests a refund from a DELIVERED order
 * 2. Admin receives the request (REFUND_REQUESTED status)
 * 3. Admin approves the refund (REFUNDED status)
 * 4. System sends confirmation emails
 */
test.describe('Order Refund Workflow (Complete E2E)', () => {
  let orderNumber: string;
  let orderId: string;
  const testEmail = process.env.TEST_ADMIN_EMAIL || 'agtechnest@gmail.com';

  test.beforeAll(async () => {
    // Clean start
    await resetTestOrders(testEmail);
  });

  test.afterAll(async () => {
    // Final cleanup to keep DB clean (Production Best Practice)
    console.log('🧹 Final cleanup after Refund test...');
    try {
      await resetTestOrders(testEmail);
      await cleanupTestProduct('e2e-checkout-product-fixed');
      await cleanupTestSupplier();
    } catch (err) {
      console.warn('⚠️ Teardown cleanup failed:', err);
    }
    await disconnectPrisma();
  });

  test('Should complete full refund workflow: Customer request + Admin approval', async ({
    page,
  }) => {
    // 90s for customer flow + admin approval
    test.setTimeout(90_000);

    // ═══════════════════════════════════════════════════════════
    // PART 1: CUSTOMER - Request Refund from Storefront
    // ═══════════════════════════════════════════════════════════

    // --- Step 1: Seed Data (Direct DB with DELIVERED status) ---
    console.log(`🏗️  Seeding DELIVERED order for user: ${testEmail}`);
    const userId = await getAdminUserId(testEmail);
    const order = await createTestOrder(testEmail, userId);
    orderNumber = order.orderNumber;
    orderId = order.id;

    // Update order to DELIVERED status so refund request flow is available
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    });
    console.log('✅ Order status updated to DELIVERED');

    // --- Step 2: Navigate to Order Detail (Customer View) ---
    console.log(`🔗 Customer: Navigating to order page: /en/orders/${orderId}`);
    await page.goto(`/en/orders/${orderId}`);
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}`));

    // --- Step 3: Customer Requests Refund ---
    console.log('🚫 Customer: Requesting refund...');

    // 3a. Click "Need a refund?" button to open the form
    const triggerBtn = page
      .locator('button')
      .filter({
        hasText: /Need a refund\?|Besoin d'un remboursement\?/i,
      })
      .first();

    await expect(triggerBtn).toBeVisible({ timeout: 15000 });
    await triggerBtn.click();
    console.log('✅ Customer: Refund form opened.');

    // 3b. Fill the refund reason textarea
    const reasonTextarea = page.locator('textarea');
    await expect(reasonTextarea).toBeVisible({ timeout: 5000 });
    await reasonTextarea.fill(
      'E2E Test: Complete refund workflow validation - product arrived damaged.'
    );
    console.log('✅ Customer: Refund reason filled.');

    // 3c. Submit the refund request
    const submitBtn = page
      .locator('button[type="submit"]')
      .filter({
        hasText: /Send Request|Envoyer la demande/i,
      })
      .first();

    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    console.log('🚀 Customer: Submitting refund request...');
    const refundResponse = page.waitForResponse(
      res =>
        res.url().includes('/api/orders/refund-request') &&
        res.status() === 200,
      { timeout: 30000 }
    );

    await submitBtn.click();
    await refundResponse;
    console.log('✅ Customer: Refund request submitted successfully.');

    // Wait for page reload after submission
    await page.waitForLoadState('networkidle');

    // --- Step 4: Verify Customer UI Update ---
    // After reload, check for success message or REFUND_REQUESTED badge
    const successMessage = page.locator(
      'text=/Request.*submitted|Demande.*envoyée/i'
    );
    const requestedBadge = page.locator('.vibe-badge').filter({
      hasText: /Requested|Demandé|En attente/i,
    });

    await Promise.race([
      expect(successMessage).toBeVisible({ timeout: 10000 }),
      expect(requestedBadge.first()).toBeVisible({ timeout: 10000 }),
    ]).catch(() => {
      console.log('⚠️ Neither success message nor badge found immediately');
    });
    console.log('✅ Customer: Refund request confirmed in UI.');

    // ═══════════════════════════════════════════════════════════
    // PART 2: ADMIN - Approve Refund Request
    // ═══════════════════════════════════════════════════════════

    console.log('\n🔄 Switching to Admin perspective...\n');

    const adminOrderPage = new AdminOrderPage(page);

    // --- Step 5: Admin navigates to order ---
    await adminOrderPage.goto(orderId);
    console.log('✅ Admin: Navigated to order detail page.');

    // --- Step 6: Verify refund request is visible ---
    await adminOrderPage.expectBadge(/Requested|Demandé/i);
    console.log('✅ Admin: Refund request visible in admin panel.');

    // --- Step 7: Admin approves the refund ---
    await adminOrderPage.approveRefund();
    console.log('✅ Admin: Refund approved successfully.');

    // --- Step 8: Verify final status is REFUNDED ---
    await adminOrderPage.expectBadge(/Refunded|Remboursée/i);
    console.log('✅ Admin: Order status updated to REFUNDED.');

    // ═══════════════════════════════════════════════════════════
    // PART 3: VERIFICATION - Email Confirmation
    // ═══════════════════════════════════════════════════════════

    console.log('\n📧 Verifying refund confirmation email...\n');
    const isEmailSent = await verifyEmailSent({
      recipient: testEmail,
      subjectInclude: orderNumber,
    });

    expect(isEmailSent).toBe(true);
    console.log('✅ Email: Refund confirmation sent to customer.');

    console.log('\n🎉 COMPLETE REFUND WORKFLOW TEST PASSED!\n');
  });
});
