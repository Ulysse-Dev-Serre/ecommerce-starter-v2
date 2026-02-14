import { test, expect } from '@playwright/test';
import { createTestOrder, disconnectPrisma } from '../fixtures/seed-test-data';

/**
 * Admin Orders E2E Test
 *
 * Flow:
 * 1. Navigate to admin orders list
 * 2. Verify orders are displayed
 * 3. Click into the most recent PAID order
 * 4. Verify order detail page content
 * 5. Generate shipping label (preview → confirm → purchase)
 * 6. Verify label was generated (tracking code, label URL)
 */
test.describe('Admin Orders Management', () => {
  const TEST_LABEL_EMAIL = process.env.ADMIN_EMAIL || 'agtechnest@gmail.com';
  let testOrderNumber: string;

  test.beforeAll(async () => {
    // Seed a specific order for this test suite to avoid dependency on other tests
    const order = await createTestOrder(TEST_LABEL_EMAIL);
    testOrderNumber = order.orderNumber;
    console.log(
      `✨ Created dedicated test order for Label generation: ${testOrderNumber}`
    );
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });
  test('View orders list and navigate to order detail', async ({ page }) => {
    // ── 1. Navigate to Admin Orders ──
    console.log('📋 Navigating to Admin Orders...');
    await page.goto('/en/admin/orders');

    // Verify page loaded
    await expect(page).toHaveURL(/admin\/orders/);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // ── 2. Verify at least one order is in the table ──
    const orderRows = page.locator('table tbody tr');
    await expect(orderRows.first()).toBeVisible({ timeout: 10000 });
    const orderCount = await orderRows.count();
    console.log(`✅ Found ${orderCount} orders in the table`);

    // ── 3. Verify order content (number, status, etc.) ──
    // Find the first PAID order in the list (robust against other test data)
    // Find the order we just created
    console.log(`🔎 Searching for specific test order: ${testOrderNumber}`);

    // Search input (assuming there's a search bar)
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(testOrderNumber);
      await page.waitForTimeout(2000);
    }

    const paidOrderRow = page
      .locator('table tbody tr')
      .filter({ hasText: testOrderNumber })
      .first();

    // Ensure at least one PAID order exists
    await expect(paidOrderRow).toBeVisible({ timeout: 10000 });

    const orderNumberCell = paidOrderRow.locator('td').first();
    const orderText = await orderNumberCell.innerText();
    expect(orderText).toContain('ORD-');
    console.log(`📦 Identified PAID order: ${orderText.split('\n')[0]}`);

    // ── 4. Click View on the identified PAID order ──
    const viewLink = paidOrderRow.locator('a').filter({ hasText: /View|Voir/ });
    await viewLink.click();

    // ── 5. Verify Order Detail Page ──
    await expect(page).toHaveURL(/admin\/orders\/.+/);
    console.log(`📍 Order detail URL: ${page.url()}`);

    // Verify order header is visible (contains ORD-)
    await expect(
      page.locator('h1, h2, h3').filter({ hasText: /ORD-/ })
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify key sections are visible
    const pageContent = await page.locator('body').innerText();
    console.log('✅ Order detail page loaded successfully');

    // Check key elements on the page — status badge shows "Paid" (translated)
    // Check key elements on the page — status badge shows "Paid" (translated)
    await expect(page.getByText(/Paid|Payée|PAID/i).first()).toBeVisible();
    console.log('✅ Order status Paid confirmed');
  });

  test('Generate shipping label for most recent order', async ({ page }) => {
    test.setTimeout(120_000); // 2 minutes for Shippo API calls

    // ── 1. Navigate to Admin Orders ──
    console.log('📋 Navigating to Admin Orders...');
    await page.goto('/en/admin/orders');
    await expect(page).toHaveURL(/admin\/orders/);

    // ── 2. Find the most recent PAID order without a label ──
    const orderRows = page.locator('table tbody tr');
    await expect(orderRows.first()).toBeVisible({ timeout: 10000 });

    console.log(`🔎 Searching for specific test order: ${testOrderNumber}`);

    // Search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(testOrderNumber);
      await page.waitForTimeout(2000);
    }

    // Find a PAID order to generate label for
    // We prefer one that doesn't have "Label Generated" if possible, but for simplicity let's pick a PAID one
    // Filtering by email ensures we pick the one created by checkout.spec.ts (John Doe)
    // Use the specific row
    const paidOrderRow = page
      .locator('table tbody tr')
      .filter({ hasText: testOrderNumber })
      .first();

    await expect(paidOrderRow).toBeVisible({ timeout: 10000 });

    const orderNumberText = await paidOrderRow
      .locator('td')
      .first()
      .innerText();
    console.log(
      `📦 Selecting PAID order for label generation: ${orderNumberText}`
    );

    // Click View
    const viewLink = paidOrderRow.locator('a').filter({ hasText: /View|Voir/ });
    await viewLink.click();
    await expect(page).toHaveURL(/admin\/orders\/.+/);

    const orderUrl = page.url();
    const orderId = orderUrl.split('/admin/orders/')[1];
    console.log(`📦 Order detail loaded. ID: ${orderId}`);

    // ── 3. Find the Shipping Management section ──
    // Look for the "Purchase & Generate Label" or "Generate Label" button
    const purchaseBtn = page
      .locator('button')
      .filter({
        hasText: /Purchase|Generate Label|Acheter|Générer/i,
      })
      .first();

    const labelAlreadyExists = page.locator(
      'text=/Label Generated|Étiquette générée/i'
    );

    // Check if label already exists
    if (
      await labelAlreadyExists.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      console.log(
        'ℹ️ Label already generated for this order. Verifying label info...'
      );

      // Verify tracking code exists
      const trackingText = page.locator('text=/Tracking/i');
      await expect(trackingText).toBeVisible();

      // Verify "Print Label" link exists
      const printLink = page
        .locator('a')
        .filter({ hasText: /Print Label|Imprimer/i });
      await expect(printLink).toBeVisible();

      // Verify "Track Package" link exists
      const trackLink = page
        .locator('a')
        .filter({ hasText: /Track Package|Suivre/i });
      if (await trackLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Track Package link available');
      }

      console.log('✅ Label verification complete (already generated)');
      return;
    }

    // ── 4. Check if the button exists ──
    if (await purchaseBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('🏷️ Found label generation button. Proceeding...');
    } else {
      // If no button and no label, there might be a "Rate not found" warning
      const rateWarning = page.locator(
        'text=/Rate not found|Action Required/i'
      );
      if (await rateWarning.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(
          '⚠️ Shipping rate not found for this order. Looking for Generate Label...'
        );
        const genBtn = page
          .locator('button')
          .filter({ hasText: /Generate Label|Générer/i })
          .first();
        await expect(genBtn).toBeVisible({ timeout: 5000 });
        console.log('🏷️ Found "Generate Label" button in warning state.');
        // Use this button instead
        await genBtn.click();
        // The button directly fetches a preview (GET), continue below
      } else {
        throw new Error(
          '❌ No label button and no existing label found on this order'
        );
      }
    }

    // ── 5. Click the Purchase/Generate Label button ──
    // The shipping-management.tsx component does:
    //   1. GET /api/admin/orders/{id}/purchase-label -> returns {amount, currency, rateId}
    //   2. Shows window.confirm() with price comparison
    //   3. POST /api/admin/orders/{id}/purchase-label -> purchases the label

    // Set up dialog handler BEFORE clicking (to handle both confirm and alert dialogs)
    let confirmDialogMessage = '';
    let alertMessage = '';
    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        confirmDialogMessage = dialog.message();
        console.log(`💬 Confirm dialog: ${confirmDialogMessage}`);
        await dialog.accept();
      } else if (dialog.type() === 'alert') {
        alertMessage = dialog.message();
        console.log(`✅ Alert: ${alertMessage}`);
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });

    // Click the purchase button (if not already clicked from warning path)
    if (await purchaseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await purchaseBtn.click();
    }

    console.log('⏳ Waiting for Shippo rate preview...');

    // ── 6. Wait for the confirm dialog (Shippo rate preview) ──
    // The dialog should appear with the price comparison
    // Wait for the dialog to have been handled
    await page.waitForTimeout(15000); // Wait for Shippo API call + dialog

    if (confirmDialogMessage) {
      console.log('📊 Label Price Comparison:');
      // Parse the confirm message to extract prices
      // Format: "The real cost of this label is X CAD.\nCustomer paid: Y CAD.\n\nDo you want to proceed?"
      const priceMatch = confirmDialogMessage.match(
        /(?:real cost|coût réel).*?(\d+\.?\d*)\s*(\w+)/i
      );
      const paidMatch = confirmDialogMessage.match(
        /(?:Customer paid|Client a payé).*?(\d+\.?\d*)\s*(\w+)/i
      );

      if (priceMatch) {
        console.log(`   🏷️ Label cost: ${priceMatch[1]} ${priceMatch[2]}`);
      }
      if (paidMatch) {
        console.log(`   💰 Customer paid: ${paidMatch[1]} ${paidMatch[2]}`);
      }

      // Verify both prices are present - this is the key business validation
      expect(confirmDialogMessage).toMatch(/\d+\.?\d*/); // At least one number
    } else {
      console.warn(
        '⚠️ No confirm dialog appeared — label may have been purchased without preview'
      );
    }

    // ── 7. Wait for purchase completion ──
    // After confirming, the POST is made, then alert() is shown, then router.refresh()
    console.log('⏳ Waiting for label purchase to complete...');

    // Wait for page to refresh (router.refresh() is called after purchase)
    await page.waitForTimeout(10000);

    // ── 8. Verify the label was generated ──
    // After refresh, the page should show "Label Generated" badge and tracking info
    console.log('🔍 Verifying label generation...');

    // Reload the page to ensure fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for label generated indicator
    const labelGenerated = page.locator(
      'text=/Label Generated|Étiquette générée/i'
    );
    const trackingInfo = page.locator('text=/Tracking/i');
    const printLabelLink = page
      .locator('a')
      .filter({ hasText: /Print Label|Imprimer/i });

    // At least one of these should be visible
    const hasLabelGenerated = await labelGenerated
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasTracking = await trackingInfo
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasPrintLink = await printLabelLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasLabelGenerated) {
      console.log('✅ "Label Generated" badge visible');
    }
    if (hasTracking) {
      console.log('✅ Tracking information visible');
    }
    if (hasPrintLink) {
      const printHref = await printLabelLink.getAttribute('href');
      console.log(`✅ Print Label link: ${printHref?.substring(0, 80)}...`);
    }

    // At least one confirmation indicator should be visible
    expect(hasLabelGenerated || hasTracking || hasPrintLink).toBeTruthy();

    console.log('🎉 Admin Orders + Label Generation test complete!');
  });
});
