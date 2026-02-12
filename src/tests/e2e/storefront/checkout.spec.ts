import { test, expect, Page } from '@playwright/test';
import {
  getTestSupplierId,
  getOrCreateTestProduct,
  disconnectPrisma,
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
    await page.fill('[data-testid="checkout-name"]', 'John Test');
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

// ─── Test Suite ─────────────────────────────────────────────

test.describe('Checkout and Payment Flow', () => {
  let testSupplierId: string;

  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('Complete checkout as guest with Stripe test card', async ({ page }) => {
    test.setTimeout(180_000); // 3 minutes to accommodate Shippo retries + Stripe

    // ── 1. Get or Create product (DB-level, instant) ──
    console.log('🏗️ Getting or creating test product...');
    const product = await getOrCreateTestProduct(testSupplierId);
    console.log(`✅ Using product: ${product.slug}`);

    // ── 2. Add to Cart ──
    console.log('🛒 Adding to cart...');
    await page.goto(`/en/product/${product.slug}`);
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(
      page.locator('[data-testid="toast-notification"]')
    ).toBeVisible();

    // ── 3. Go to Checkout ──
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

    // ── 4. Fill Address + Shipping (with Shippo retry) ──
    console.log('🏠 Filling address and getting shipping rates...');
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'test@yopmail.com';
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

    await page.click('[data-testid="confirm-shipping-button"]');

    // ── 5. Payment (Stripe PaymentElement) ──
    console.log('💰 Waiting for Stripe PaymentElement...');

    // Stripe PaymentElement creates multiple nested iframes.
    // Step A: Wait for Stripe iframes to load
    await page.waitForSelector('iframe[src*="js.stripe.com"]', {
      timeout: 30000,
    });
    await page.waitForTimeout(2000); // Let Stripe fully initialize

    // Step B: Click "Card" tab inside the Stripe PaymentElement iframe
    // The tabs (Card / Klarna) are inside one of the Stripe iframes
    let clickedCardTab = false;
    for (const frame of page.frames()) {
      if (!frame.url().includes('stripe.com')) continue;
      try {
        const cardTab = frame.locator('text=Card');
        if ((await cardTab.count()) > 0) {
          await cardTab.first().click();
          console.log('✅ Clicked "Card" payment tab');
          clickedCardTab = true;
          await page.waitForTimeout(2000); // Wait for card form to expand
          break;
        }
      } catch {
        // Skip cross-origin frames
      }
    }
    if (!clickedCardTab) {
      console.log('⚠️ "Card" tab not found — card form may already be visible');
    }

    // Step C: Find the iframe containing card inputs and fill them
    // From debug: inputs are #payment-numberInput, #payment-expiryInput, #payment-cvcInput
    let cardFilled = false;
    for (const frame of page.frames()) {
      if (!frame.url().includes('stripe.com')) continue;
      try {
        const numberInput = frame.locator('#payment-numberInput');
        if (await numberInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✅ Found card input fields in Stripe iframe');

          await numberInput.click();
          await numberInput.pressSequentially('4242424242424242', {
            delay: 60,
          });

          const expiryInput = frame.locator('#payment-expiryInput');
          await expiryInput.click();
          await expiryInput.pressSequentially('1228', { delay: 60 });

          const cvcInput = frame.locator('#payment-cvcInput');
          await cvcInput.click();
          await cvcInput.pressSequentially('123', { delay: 60 });

          cardFilled = true;
          break;
        }
      } catch {
        // Skip
      }
    }

    if (!cardFilled) {
      throw new Error(
        '❌ Could not find Stripe card input fields in any iframe'
      );
    }

    // ── 6. Pay ──
    console.log('🚀 Clicking Pay Now...');
    const payBtn = page.locator('[data-testid="pay-now-button"]');
    await expect(payBtn).toBeEnabled({ timeout: 5000 });
    await payBtn.click();

    // ── 7. Verify Success ──
    console.log('✨ Waiting for success page...');
    // The checkout redirects: /checkout/success -> /orders/ORD-...
    await expect(page).toHaveURL(/checkout\/success|orders\/ORD/, {
      timeout: 60000,
    });

    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);

    // Wait for all navigation to finish (success page may redirect to order page)
    await page
      .waitForLoadState('networkidle', { timeout: 15000 })
      .catch(() => {});

    const endUrl = page.url();
    console.log(`📍 End URL after navigation: ${endUrl}`);

    // Verify we see order confirmation content
    // Success page shows "Please wait while we confirm your order..." then redirects to /orders/ORD-...
    await expect(page.getByText('confirm your order')).toBeVisible({
      timeout: 15000,
    });
    console.log('✅ Success page loaded, waiting for order redirect...');

    // Wait for final redirect to order detail page
    await expect(page).toHaveURL(/orders\/ORD/, { timeout: 30000 });
    console.log(`📍 Order page: ${page.url()}`);

    console.log('✅ Checkout flow complete and successful!');
  });
});
