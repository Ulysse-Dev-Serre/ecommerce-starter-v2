import { test, Page } from '@playwright/test';
import {
  getTestSupplierId,
  getOrCreateTestProduct,
  disconnectPrisma,
  resetTestOrders,
  cleanupTestProduct,
} from '../fixtures/seed-test-data';
import { CheckoutPage } from '../pom/storefront/CheckoutPage';
import { CartPage } from '../pom/storefront/CartPage';

/**
 * Stripe Security & Radar Checkout Test (POM Based)
 *
 * Verifies that the system correctly handles different Stripe test cards:
 * - 4242: Normal Success
 * - 0531: Blocked by Radar (High Risk)
 * - 0701: Radar Review
 */
test.describe('Checkout Security - Stripe Radar Cards', () => {
  let productSlug: string;
  const testEmail = 'radar-test@example.com';

  test.beforeAll(async () => {
    const supplierId = await getTestSupplierId();
    const product = await getOrCreateTestProduct(
      supplierId,
      'product-security-test'
    );
    productSlug = product.slug;
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up security tests...');
    await resetTestOrders(testEmail);
    await cleanupTestProduct('product-security-test');
    await disconnectPrisma();
  });

  async function setupCheckout(page: Page) {
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await cart.addProductToCart(productSlug);
    await cart.goToCart();
    await cart.proceedToCheckout();

    await checkout.fillShippingDetails({
      name: 'Radar Test',
      email: testEmail,
      phone: '5145550000',
      address: '1100 Rue de la Gauchetière O',
      city: 'Montréal',
      zip: 'H3B 2S2',
      state: 'QC',
    });

    await checkout.selectShippingRate();
    return checkout;
  }

  test('Should block card 4000 0000 0000 0531 (High Risk Fraud)', async ({
    page,
  }) => {
    const checkout = await setupCheckout(page);

    console.log('💳 Attempting payment with Fraud card (0531)...');
    await checkout.payWithStripeCard('4000000000000531');

    await checkout.expectPaymentError(/decline|refus|error|erreur/i);
    console.log('✅ Fraud card correctly blocked by the system');
  });

  test('Should handle card 4000 0000 0000 0701 (Radar Review)', async ({
    page,
  }) => {
    const checkout = await setupCheckout(page);

    console.log('💳 Attempting payment with Radar Review card (0701)...');
    await checkout.payWithStripeCard('4000000000000701');

    // Radar Review cards usually succeed on the frontend, but flagged in dashboard
    await checkout.expectOrderSuccess();
    console.log('✅ Radar Review card processed successfully on frontend');
  });
});
