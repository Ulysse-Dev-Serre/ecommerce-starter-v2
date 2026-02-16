import { test, expect } from '@playwright/test';
import {
  getTestSupplierId,
  getOrCreateTestProduct,
  cleanupTestProduct,
  cleanupTestSupplier,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

/**
 * SMOKE TEST : API Validation for Shipping Rates (Test 4 Simplified)
 *
 * Instead of filling a complex UI form, we hit the API directly.
 * This proves the backend, Shippo integration, and business logic are working.
 */
test.describe('API Smoke Test - Shipping Rates', () => {
  let testSupplierId: string;
  let testVariantId: string;

  // 1. Setup Data (Directly in DB)
  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
    const product = await getOrCreateTestProduct(testSupplierId);
    testVariantId = product.variants[0].id;
    console.log(`✅ Ready to test API with Variant: ${testVariantId}`);
  });

  // 2. Cleanup
  test.afterAll(async () => {
    console.log('🧹 Cleaning up API smoke test data...');
    await cleanupTestProduct('e2e-checkout-product-fixed');
    await cleanupTestSupplier();
    await disconnectPrisma();
  });

  test('Should return shipping rates (200 OK) with valid payload', async ({
    request,
  }) => {
    // This payload matches the Zod schema in src/lib/validators/shipping.ts
    const payload = {
      addressTo: {
        name: 'John Smoke Test',
        street1: '1100 Rue de la Gauchetière O',
        city: 'Montréal',
        state: 'QC',
        zip: 'H3B 2S2',
        country: 'CA',
        email: 'smoke-test@example.com',
        phone: '5145550000',
      },
      items: [
        {
          variantId: testVariantId,
          quantity: 1,
        },
      ],
    };

    console.log('📡 Sending POST request to /api/shipping/rates...');

    // We increase timeout because Shippo API can be slow
    const response = await request.post('/api/shipping/rates', {
      data: payload,
      timeout: 30000,
    });

    // --- CRITICAL CHECK ---
    console.log(`📥 Response Status: ${response.status()}`);
    expect(response.status()).toBe(200);

    const body = await response.json();

    // Check that we actually got rates back
    expect(Array.isArray(body.rates)).toBe(true);
    expect(body.rates.length).toBeGreaterThan(0);

    console.log(
      `✅ Success! Received ${body.rates.length} shipping rates from Shippo.`
    );
    console.log(
      `🚀 First rate: ${body.rates[0].servicelevel.name} - ${body.rates[0].amount} ${body.rates[0].currency}`
    );
  });

  test('Should return 400 Bad Request if zip code is missing', async ({
    request,
  }) => {
    const invalidPayload = {
      addressTo: {
        street1: 'Invalid Address',
        country: 'CA',
        // Missing zip
      },
      items: [{ variantId: testVariantId, quantity: 1 }],
    };

    const response = await request.post('/api/shipping/rates', {
      data: invalidPayload,
    });

    console.log(`📥 (Expected 400) Response Status: ${response.status()}`);
    expect(response.status()).toBe(400);
  });
});
