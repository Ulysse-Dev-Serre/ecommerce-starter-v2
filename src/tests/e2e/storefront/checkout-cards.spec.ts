import { test, expect, Page } from '@playwright/test';

import {
  getTestSupplierId,
  getOrCreateTestProduct,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

/**
 * Checkout Scenarios with Different Stripe Test Cards
 *
 * This test suite validates how the application handles various payment outcomes:
 * 1. Standard Success (4242...)
 * 2. 3D Secure Authentication (4000 0027 6000 3184)
 * 3. Generic Decline (4000 0000 0000 0002)
 * 4. Fraud Block (4100 0000 0000 0019)
 */

async function fillAddressAndGetRates(page: Page) {
  await page.fill('[data-testid="checkout-name"]', 'Stripe Scenario Test');
  await page.fill(
    '[data-testid="checkout-email"]',
    'scenario-test@yopmail.com'
  );
  await page.fill('[data-testid="checkout-phone"]', '5145551234');
  await page.fill(
    '[data-testid="address-autocomplete-input"]',
    '1100 Rue de la Gauchetière O'
  );
  await page.fill('[data-testid="checkout-city"]', 'Montréal');
  await page.fill('[data-testid="checkout-zip"]', 'H3B 2S2');
  await page.selectOption('[data-testid="checkout-state"]', 'QC');

  const confirmBtn = page.locator('[data-testid="confirm-address-button"]');
  await expect(confirmBtn).toBeEnabled({ timeout: 10000 });
  await confirmBtn.click();

  const shippingRateList = page.locator('[data-testid="shipping-rate-item"]');
  await shippingRateList.first().waitFor({ state: 'visible', timeout: 30000 });
  await shippingRateList.first().click();

  await page.click('[data-testid="confirm-shipping-button"]');
}

test.describe('Stripe Checkout Scenarios', () => {
  let testSupplierId: string;
  let productSlug: string;

  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
    const product = await getOrCreateTestProduct(testSupplierId);
    productSlug = product.slug;
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  const scenarios = [
    {
      name: 'Standard Success',
      card: '4242424242424242',
      expectedOutcome: 'success',
      description: 'Standard card that should pass immediately',
    },
    {
      name: '3D Secure Authentication',
      card: '4000002760003184',
      expectedOutcome: '3ds-success',
      description: 'Card requiring 3DS challenge',
    },
    {
      name: 'Generic Decline',
      card: '4000000000000002',
      expectedOutcome: 'decline',
      description: 'Card that will be declined by the bank',
    },
    {
      name: 'Fraud Block',
      card: '4100000000000019',
      expectedOutcome: 'decline',
      description: 'Card flagged as fraudulent by Stripe',
    },
  ];

  for (const scenario of scenarios) {
    test(`Scenario: ${scenario.name} (${scenario.description})`, async ({
      page,
    }) => {
      test.setTimeout(120_000);

      console.log(`🚀 Starting scenario: ${scenario.name}`);

      // 1. Add to cart
      await page.goto(`/en/product/${productSlug}`);
      await page.click('[data-testid="add-to-cart-button"]');

      // 2. Go to checkout
      await page.goto('/en/checkout');
      await expect(page.locator('[data-testid="checkout-name"]')).toBeVisible({
        timeout: 20000,
      });

      // 3. Fill address and rates
      await fillAddressAndGetRates(page);

      // 4. Fill Card Info
      console.log(`💳 Filling card: ${scenario.card}`);
      await page.waitForSelector('iframe[src*="js.stripe.com"]', {
        timeout: 30000,
      });
      await page.waitForTimeout(2000);

      // Step A: Click "Card" tab if it exists
      let _clickedCardTab = false;
      for (const frame of page.frames()) {
        if (!frame.url().includes('stripe.com')) continue;
        try {
          const cardTab = frame.locator('text=Card');
          if ((await cardTab.count()) > 0) {
            await cardTab.first().click();
            console.log('✅ Clicked "Card" payment tab');
            _clickedCardTab = true;
            await page.waitForTimeout(2000);
            break;
          }
        } catch {
          /* skip */
        }
      }

      // Step B: Fill Inputs
      let cardFilled = false;
      console.log('🔍 Searching for Stripe card inputs in iframes...');

      for (let attempt = 0; attempt < 10; attempt++) {
        for (const frame of page.frames()) {
          if (!frame.url().includes('stripe.com')) continue;
          try {
            const numberInput = frame.locator('#payment-numberInput');
            if (
              await numberInput.isVisible({ timeout: 1000 }).catch(() => false)
            ) {
              await numberInput.click();
              await numberInput.pressSequentially(scenario.card, { delay: 50 });

              await frame.locator('#payment-expiryInput').click();
              await frame
                .locator('#payment-expiryInput')
                .pressSequentially('1228', { delay: 50 });

              await frame.locator('#payment-cvcInput').click();
              await frame
                .locator('#payment-cvcInput')
                .pressSequentially('123', { delay: 50 });

              cardFilled = true;
              console.log('✅ Card inputs filled');
              break;
            }
          } catch {
            /* skip */
          }
        }
        if (cardFilled) break;
        await page.waitForTimeout(1000);
      }
      expect(
        cardFilled,
        `Card inputs should be found and filled for ${scenario.name}`
      ).toBeTruthy();

      // 5. Pay
      console.log('👆 Clicking Pay Now...');
      await page.click('[data-testid="pay-now-button"]');

      // 6. Handle Outcome
      if (scenario.expectedOutcome === 'success') {
        await expect(page).toHaveURL(/checkout\/success|orders\/ORD/, {
          timeout: 60000,
        });
        console.log('✅ Standard success verified');
      } else if (scenario.expectedOutcome === '3ds-success') {
        console.log('🛡️ Handling 3DS Challenge...');

        // Wait for the 3DS modal to appear by searching for its characteristic text
        let clicked3ds = false;
        const max3dsRetries = 20;

        for (let i = 0; i < max3dsRetries; i++) {
          for (const frame of page.frames()) {
            // Stripe 3DS iframe usually has "stripe" in URL
            if (frame.url().includes('stripe.com')) {
              const completeBtn = frame
                .locator('button')
                .filter({ hasText: /COMPLETE|AUTHORIZE/i });
              if (
                await completeBtn
                  .isVisible({ timeout: 1000 })
                  .catch(() => false)
              ) {
                console.log(
                  '✅ Found 3DS Complete button in frame, clicking...'
                );
                await completeBtn.click();
                clicked3ds = true;
                break;
              }
            }
          }
          if (clicked3ds) break;
          await page.waitForTimeout(1000);
        }

        expect(
          clicked3ds,
          '3DS challenge should have been detected and clicked'
        ).toBeTruthy();
        await expect(page).toHaveURL(/checkout\/success|orders\/ORD/, {
          timeout: 60000,
        });
        console.log('✅ 3DS success verified');
      } else if (scenario.expectedOutcome === 'decline') {
        console.log('❌ Waiting for decline message...');
        // Stripe Elements shows error message within the element or via toast
        // We look for common error patterns
        const _errorMessage = page.locator(
          '.vibe-toast-error, [role="alert"], #error-message'
        );
        await expect(async () => {
          const text = await page.innerText('body');
          expect(text.toLowerCase()).toMatch(
            /declined|refusé|fraud|error|failed/
          );
        }).toPass({ timeout: 20000 });

        console.log('✅ Decline/Fraud coherent result verified');
      }
    });
  }
});
