import { test, expect } from '@playwright/test';
import {
  createTestOrder,
  resetTestOrders,
  cleanupTestProduct,
  getAdminUserId,
  disconnectPrisma,
} from '../fixtures/seed-test-data';
import { verifyEmailSent } from '../fixtures/resend-helper';

/**
 * Optimized Order Cancellation E2E Test (Production-Ready)
 *
 * Instead of re-running a full Stripe checkout (slow & fragile),
 * we seed a PAID order directly for the test user and verify the
 * cancellation logic on the Storefront.
 */
test.describe('Order Cancellation Workflow (Optimized)', () => {
  let orderNumber: string;
  const testEmail = process.env.TEST_ADMIN_EMAIL || 'agtechnest@gmail.com';

  test.beforeAll(async () => {
    // Clean start
    await resetTestOrders(testEmail);
  });

  test.afterAll(async () => {
    // Final cleanup to keep DB clean (Production Best Practice)
    console.log('🧹 Final cleanup after Cancellation test...');
    try {
      await resetTestOrders(testEmail);
      await cleanupTestProduct('e2e-checkout-product-fixed');
    } catch (err) {
      console.warn('⚠️ Teardown cleanup failed:', err);
    }
    await disconnectPrisma();
  });

  test('Should cancel a seeded paid order and send confirmation email', async ({
    page,
  }) => {
    // 60s is enough for direct seeding + UI actions
    test.setTimeout(60_000);

    // --- Step 1: Seed Data (Direct DB) ---
    console.log(`🏗️  Seeding order directly for user: ${testEmail}`);
    const userId = await getAdminUserId(testEmail);
    const order = await createTestOrder(testEmail, userId);
    orderNumber = order.orderNumber;

    // --- Step 2: Navigate to Order Detail ---
    console.log(`🔗 Navigating to order page: /en/orders/${order.id}`);
    await page.goto(`/en/orders/${order.id}`);

    // Wait for page to load
    await expect(page).toHaveURL(new RegExp(`/orders/${order.id}`));

    // --- Step 3: Cancellation Action ---
    console.log('🚫 Attempting cancellation flow...');

    // 3a. Initial trigger button (Can be "Cancel delivery" or "Need a refund?")
    const triggerBtn = page
      .locator('button')
      .filter({
        hasText:
          /Cancel delivery|Annuler la livraison|Need a refund\?|Besoin d'un remboursement\?/i,
      })
      .first();

    await expect(triggerBtn).toBeVisible({ timeout: 15000 });
    await triggerBtn.click();
    console.log('✅ Initial trigger button clicked.');

    // 3b. Fill reason if textarea is visible (for Refund Request form)
    const reasonTextarea = page.locator('textarea');
    if (await reasonTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reasonTextarea.fill('E2E Test: Robust and Clean Cancellation.');
      console.log('✅ Reason filled in textarea.');
    }

    // 3c. Final confirm button
    const confirmBtn = page
      .locator('button')
      .filter({
        hasText:
          /Cancel my order|Annuler ma commande|Send Request|Envoyer la demande/i,
      })
      .first();

    await expect(confirmBtn).toBeVisible({ timeout: 5000 });

    // 3d. Listen for and accept the JS confirm() dialog
    page.once('dialog', dialog => {
      console.log(`💬 Browser Dialog: ${dialog.message()}`);
      dialog.accept();
    });

    // 3e. Intercept the API response
    console.log('🚀 Clicking final confirmation button...');
    const cancelResponse = page.waitForResponse(
      res =>
        res.url().includes('/api/orders/refund-request') &&
        res.status() === 200,
      { timeout: 30000 }
    );

    await confirmBtn.click();
    await cancelResponse;
    console.log('✅ API call successful.');

    // --- Step 4: UI Verification ---
    // The badge might say "Annulée", "Remboursée" or "En attente de remboursement"
    const cancelledBadge = page.locator('.vibe-badge').filter({
      hasText: /Cancelled|Annulée|Refunded|Remboursée|Requested/i,
    });
    await expect(cancelledBadge.first()).toBeVisible({ timeout: 15000 });
    console.log('✅ UI confirms cancellation/refund status.');

    // --- Step 5: Email Verification (Softened) ---
    console.log('📧 Verifying Cancellation/Refund Email via Resend Helper...');
    const isEmailSent = await verifyEmailSent({
      recipient: testEmail,
      subjectInclude: orderNumber,
    });

    expect(isEmailSent).toBe(true);
    console.log('🎉 OPTIMIZED CANCEL TEST COMPLETE!');
  });
});
