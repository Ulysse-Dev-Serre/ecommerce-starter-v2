import { test, expect, Page } from '@playwright/test';
import {
  getTestSupplierId,
  getOrCreateTestProduct,
  resetTestOrders,
  cleanupTestProduct,
  cleanupTestSupplier,
  disconnectPrisma,
  verifyOrderCreated,
} from '../fixtures/seed-test-data';

// ─── Helpers ────────────────────────────────────────────────

/**
 * Fill the address form and attempt to get shipping rates.
 * If Shippo returns a rate-limit or transient error, retry up to `maxRetries` times.
 */
async function fillAddressAndGetRates(
  page: Page,
  testEmail: string,
  attempt = 1,
  maxRetries = 3
) {
  // Only fill the form on the first attempt; on retries the form is already filled
  if (attempt === 1) {
    await page.fill('[data-testid="checkout-name"]', 'John Doe Test');
    await page.fill('[data-testid="checkout-email"]', testEmail);
    await page.fill('[data-testid="checkout-phone"]', '5145550000');

    // Real Montréal address for Shippo validation
    await page.fill(
      '[data-testid="address-autocomplete-input"]',
      '1100 Rue de la Gauchetière O'
    );
    await page.fill('[data-testid="checkout-city"]', 'Montréal');
    await page.fill('[data-testid="checkout-zip"]', 'H3B 2S2');
    await page.selectOption('[data-testid="checkout-state"]', 'QC');
  }

  const confirmBtn = page.locator('[data-testid="confirm-address-button"]');
  await expect(confirmBtn).toBeEnabled({ timeout: 10000 });
  console.log(
    `🖱️ Clicking Confirm Address (Attempt ${attempt}/${maxRetries})...`
  );
  await confirmBtn.click();

  // Race: either rates appear or an error toast appears
  const shippingRateList = page.locator('[data-testid="shipping-rate-item"]');
  const errorToast = page.locator('[data-testid="toast-notification"]');

  try {
    await Promise.race([
      shippingRateList.first().waitFor({ state: 'visible', timeout: 30000 }),
      errorToast
        .waitFor({ state: 'visible', timeout: 30000 })
        .then(async () => {
          const msg = await errorToast.innerText();
          throw new Error(`Shippo Error: ${msg}`);
        }),
    ]);
  } catch (err: any) {
    if (attempt < maxRetries) {
      console.warn(
        `⚠️ Shippo attempt ${attempt} failed: ${err.message}. Retrying in 5s...`
      );
      // Go back to address step (click "Edit" if available, or reload)
      const editAddressBtn = page
        .locator('button:has-text("Edit"), [data-testid="edit-address-button"]')
        .first();
      if (
        await editAddressBtn.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await editAddressBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(5000);
      return fillAddressAndGetRates(page, testEmail, attempt + 1, maxRetries);
    }
    throw err;
  }

  return shippingRateList;
}

// ─── Shared Checkout Helper ────────────────────────────────

/**
 * Completes the checkout flow up to the payment step.
 * Returns the page ready for card input.
 */
async function prepareCheckoutForPayment(
  page: Page,
  productSlug: string,
  testEmail: string
) {
  // ── 1. Add to Cart ──
  console.log('🛒 Adding to cart...');
  await page.goto(`/en/product/${productSlug}`);
  await page.click('[data-testid="add-to-cart-button"]');
  await expect(
    page.locator('[data-testid="toast-notification"]')
  ).toBeVisible();

  // ── 2. Go to Checkout ──
  console.log('💳 Navigating to Checkout...');
  await page.goto('/en/checkout');

  // Wait for the checkout form to appear (Stripe client initialization)
  try {
    await expect(page.locator('[data-testid="checkout-name"]')).toBeVisible({
      timeout: 30000,
    });
  } catch {
    const bodyText = await page.locator('body').innerText();
    console.error('❌ Checkout form not visible. Page content:', bodyText);
    throw new Error(
      `Checkout form did not load. Page shows: ${bodyText.substring(0, 200)}`
    );
  }

  // ── 3. Fill Address + Shipping (with Shippo retry) ──
  console.log('🏠 Filling address and getting shipping rates...');
  const shippingRateList = await fillAddressAndGetRates(page, testEmail);

  // Log rates for debugging
  const allRatesText = await shippingRateList.allInnerTexts();
  console.log('📦 Available rates:', allRatesText.length);
  for (const text of allRatesText) {
    console.log(`   - ${text.split('\n')[0]}`);
  }

  // Select a rate (prefer UPS, fallback to first)
  const upsRate = shippingRateList.filter({ hasText: /UPS/i }).first();
  if ((await upsRate.count()) > 0) {
    console.log('✅ UPS rate found, selecting it.');
    await upsRate.click();
  } else {
    console.log('⚠️ No UPS rate, selecting first available.');
    await shippingRateList.first().click();
  }

  // Wait for the update-intent call initiated by verifyShipping/confirmShipping
  const responsePromise = page.waitForResponse(
    res => res.url().includes('update-intent') && res.status() === 200
  );
  await page.click('[data-testid="confirm-shipping-button"]');
  await responsePromise;
  console.log('✅ Shipping details updated on PaymentIntent');

  // ── 4. Wait for Stripe PaymentElement ──
  console.log('💰 Waiting for Stripe PaymentElement...');
  await page.waitForSelector('iframe[src*="js.stripe.com"]', {
    timeout: 30000,
  });
  await page.waitForTimeout(2000); // Let Stripe fully initialize

  // Click "Card" tab if present
  let clickedCardTab = false;
  for (const frame of page.frames()) {
    if (!frame.url().includes('stripe.com')) continue;
    try {
      const cardTab = frame.locator('text=Card');
      if ((await cardTab.count()) > 0) {
        await cardTab.first().click();
        console.log('✅ Clicked "Card" payment tab');
        clickedCardTab = true;
        await page.waitForTimeout(2000);
        break;
      }
    } catch {
      // Skip cross-origin frames
    }
  }
  if (!clickedCardTab) {
    console.log('⚠️ "Card" tab not found — card form may already be visible');
  }
}

/**
 * Fill Stripe card details in the PaymentElement iframe.
 */
async function fillStripeCard(
  page: Page,
  cardNumber: string,
  expiry: string = '1228',
  cvc: string = '123'
) {
  console.log(`💳 Filling card: ${cardNumber.substring(0, 4)}...`);
  let cardFilled = false;

  for (const frame of page.frames()) {
    if (!frame.url().includes('stripe.com')) continue;
    try {
      const numberInput = frame.locator('#payment-numberInput');
      if (await numberInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✅ Found card input fields in Stripe iframe');

        await numberInput.click();
        await numberInput.pressSequentially(cardNumber.replace(/\s/g, ''), {
          delay: 60,
        });

        const expiryInput = frame.locator('#payment-expiryInput');
        await expiryInput.click();
        await expiryInput.pressSequentially(expiry, { delay: 60 });

        const cvcInput = frame.locator('#payment-cvcInput');
        await cvcInput.click();
        await cvcInput.pressSequentially(cvc, { delay: 60 });

        cardFilled = true;
        break;
      }
    } catch {
      // Skip
    }
  }

  if (!cardFilled) {
    throw new Error('❌ Could not find Stripe card input fields in any iframe');
  }
}

// ─── Test Suite ─────────────────────────────────────────────

test.describe('Checkout and Payment Flow', () => {
  test.describe.configure({ mode: 'serial' });
  let testSupplierId: string;
  const testEmail = process.env.TEST_ADMIN_EMAIL || 'test@yopmail.com';

  test.beforeAll(async () => {
    // Clean up any stale orders from previous runs to avoid test pollution
    await resetTestOrders(testEmail);
    testSupplierId = await getTestSupplierId();
  });

  test.afterAll(async () => {
    console.log('🧹 Final cleanup after Checkout test...');
    await resetTestOrders(testEmail);
    await cleanupTestProduct('e2e-checkout-product-fixed');
    await cleanupTestSupplier();
    await disconnectPrisma();
  });

  test('✅ Success: Complete checkout with valid Stripe card (4242)', async ({
    page,
  }) => {
    test.setTimeout(180_000); // 3 minutes to accommodate Shippo retries + Stripe

    // ── 1. Get or Create product (DB-level, instant) ──
    console.log('🏗️ Getting or creating test product...');
    const product = await getOrCreateTestProduct(testSupplierId);
    console.log(`✅ Using product: ${product.slug}`);

    // ── 2. Prepare Checkout (Cart → Address → Shipping) ──
    await prepareCheckoutForPayment(page, product.slug, testEmail);

    // ── 3. Fill Card Details ──
    await fillStripeCard(page, '4242424242424242');

    // ── 4. Pay ──
    console.log('🚀 Clicking Pay Now...');
    const payBtn = page.locator('[data-testid="pay-now-button"]');
    await expect(payBtn).toBeEnabled({ timeout: 5000 });

    // Set up listeners for the redirect and API verification
    const verificationPromise = page.waitForResponse(
      res => res.url().includes('/api/orders/verify') && res.status() === 200,
      { timeout: 60000 }
    );

    await payBtn.click();

    // ── 5. Verify Success ──
    console.log('✨ Waiting for checkout success or order redirect...');
    await expect(page).toHaveURL(/checkout\/success|orders\/ORD/, {
      timeout: 60000,
    });

    console.log(`📍 Reached page: ${page.url()}`);

    // If we are on the success page, wait for the verification API to finish
    if (page.url().includes('/checkout/success')) {
      console.log('📡 Waiting for order verification API...');
      await verificationPromise.catch(() =>
        console.warn('⚠️ Verification API timeout or not called (Guest?)')
      );
    }

    // Wait for final redirect to order detail page (if logged in)
    const finalUrl = page.url();
    if (finalUrl.includes('/orders/ORD')) {
      console.log('✅ Directly reached order page');
    } else {
      console.log('🔄 Checking for final redirect or guest success message...');
      await Promise.race([
        expect(page).toHaveURL(/orders\/ORD/, { timeout: 30000 }),
        expect(page.getByText(/Payment Successful|Confirmé/i)).toBeVisible({
          timeout: 30000,
        }),
      ]);
    }

    console.log(`📍 End URL: ${page.url()}`);

    // CRITICAL: Wait for the order to be actually created in DB (Webhook latency)

    console.log(
      '⏳ Waiting for Order Creation confirmation (Webhook latency)...'
    );
    const order = await verifyOrderCreated(testEmail);

    if (!order) {
      throw new Error(
        '❌ Order was NOT created in DB after success page (Webhook timeout or failure)'
      );
    }

    console.log(
      `✅ Checkout flow complete, Order Created & Paid: ${order.orderNumber}`
    );
  });

  test('❌ Decline: Card declined by Stripe (insufficient funds)', async ({
    page,
  }) => {
    test.setTimeout(120_000); // 2 minutes

    // ── 1. Get or Create product ──
    console.log('🏗️ Getting or creating test product...');
    const product = await getOrCreateTestProduct(testSupplierId);
    console.log(`✅ Using product: ${product.slug}`);

    // ── 2. Prepare Checkout ──
    await prepareCheckoutForPayment(page, product.slug, testEmail);

    // ── 3. Fill Card Details (Insufficient Funds card) ──
    await fillStripeCard(page, '4000000000009995'); // Stripe test card: insufficient_funds

    // ── 4. Attempt Payment ──
    console.log('🚀 Clicking Pay Now (expecting decline)...');
    const payBtn = page.locator('[data-testid="pay-now-button"]');
    await expect(payBtn).toBeEnabled({ timeout: 5000 });
    await payBtn.click();

    // ── 5. Verify Error Message ──
    console.log('⏳ Waiting for decline error message...');
    const errorToast = page.locator('[data-testid="toast-notification"]');

    await expect(errorToast).toBeVisible({ timeout: 20000 });
    const errorText = await errorToast.innerText();
    console.log(`📛 Error displayed: ${errorText}`);

    // Verify we're still on checkout page (not redirected)
    await expect(page).toHaveURL(/checkout/, { timeout: 5000 });
    console.log('✅ Payment correctly declined, user remains on checkout page');
  });

  test('🚨 Fraud: Card blocked by Stripe Radar (always blocked)', async ({
    page,
  }) => {
    test.setTimeout(120_000); // 2 minutes

    // ── 1. Get or Create product ──
    console.log('🏗️ Getting or creating test product...');
    const product = await getOrCreateTestProduct(testSupplierId);
    console.log(`✅ Using product: ${product.slug}`);

    // ── 2. Prepare Checkout ──
    await prepareCheckoutForPayment(page, product.slug, testEmail);

    // ── 3. Fill Card Details (Radar always blocks) ──
    await fillStripeCard(page, '4100000000000019'); // Stripe test card: always blocked by Radar

    // ── 4. Attempt Payment ──
    console.log('🚀 Clicking Pay Now (expecting Radar block)...');
    const payBtn = page.locator('[data-testid="pay-now-button"]');
    await expect(payBtn).toBeEnabled({ timeout: 5000 });
    await payBtn.click();

    // ── 5. Verify Fraud Block ──
    console.log('⏳ Waiting for fraud block error...');
    const errorToast = page.locator('[data-testid="toast-notification"]');

    await expect(errorToast).toBeVisible({ timeout: 20000 });
    const errorText = await errorToast.innerText();
    console.log(`🚨 Fraud block displayed: ${errorText}`);

    // Verify we're still on checkout page
    await expect(page).toHaveURL(/checkout/, { timeout: 5000 });
    console.log('✅ Fraudulent card correctly blocked by Radar');
  });
});
