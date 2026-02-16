import { test, expect } from '@playwright/test';
import Stripe from 'stripe';
import {
  getTestSupplierId,
  getOrCreateTestProduct,
  cleanupTestProduct,
  cleanupTestSupplier,
  disconnectPrisma,
  verifyOrderCreated,
} from '../fixtures/seed-test-data';

/**
 * FULL API CHECKOUT TEST (No UI)
 *
 * This test validates the entire purchase flow:
 * 1. GET SHIPPING RATES (Shippo)
 * 2. CREATE PAYMENT INTENT (Stripe)
 * 3. UPDATE INTENT with Address & Shipping Selection
 * 4. CONFIRM PAYMENT (Real Stripe API) -> Triggers real webhook to ngrok
 * 5. POLLING DB -> Verifies Order Creation via real webhook processing
 */
test.describe('Full API Checkout Flow (Shippo + Stripe + Resend)', () => {
  let testSupplierId: string;
  let testVariantId: string;
  let testProduct: any;
  const testEmail = process.env.TEST_ADMIN_EMAIL || 'agtechnest@gmail.com';

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia' as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const productSlug = 'e2e-checkout-full-smoke';

  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
    testProduct = await getOrCreateTestProduct(testSupplierId, productSlug);
    testVariantId = testProduct.variants[0].id;
    console.log(`✅ Ready to test Full Flow with Variant: ${testVariantId}`);
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up Full API test data...');
    // CRITICAL: Wait 5s for any late webhooks from Stripe before deleting the product
    await new Promise(resolve => setTimeout(resolve, 5000));
    await cleanupTestProduct(productSlug);
    await cleanupTestSupplier();
    await disconnectPrisma();
  });

  test('Should complete a full purchase flow via API endpoints only', async ({
    request,
  }) => {
    test.setTimeout(60000);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: GET SHIPPING RATES (Shippo)
    // ═══════════════════════════════════════════════════════════
    console.log('\n📦 Step 1: Fetching Shipping Rates...');
    const ratesResponse = await request.post('/api/shipping/rates', {
      data: {
        addressTo: {
          name: 'John Full Test',
          street1: '1100 Rue de la Gauchetière O',
          city: 'Montréal',
          state: 'QC',
          zip: 'H3B 2S2',
          country: 'CA',
          email: testEmail,
          phone: '5145550000',
        },
        items: [{ variantId: testVariantId, quantity: 1 }],
      },
    });
    expect(ratesResponse.status()).toBe(200);
    const { rates } = await ratesResponse.json();
    const selectedRate = rates[0]; // Choose the first one (Standard)
    console.log(
      `✅ Shipping Rate selected: ${selectedRate.servicelevel.name} (${selectedRate.amount} ${selectedRate.currency})`
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 2: CREATE PAYMENT INTENT (Stripe)
    // ═══════════════════════════════════════════════════════════
    console.log('\n💳 Step 2: Creating Payment Intent...');
    const intentResponse = await request.post('/api/checkout/create-intent', {
      data: {
        directItem: { variantId: testVariantId, quantity: 1 },
        locale: 'en',
      },
    });
    expect(intentResponse.status()).toBe(200);
    const intentData = await intentResponse.json();
    expect(intentData.clientSecret).toBeDefined();

    // Extract Payment Intent ID (pi_...)
    const paymentIntentId = intentData.clientSecret.split('_secret_')[0];
    console.log(`✅ Payment Intent created: ${paymentIntentId}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: UPDATE INTENT (Selection + Address)
    // ═══════════════════════════════════════════════════════════
    console.log('\n📝 Step 3: Updating Intent with Shipping & Address...');
    const updateResponse = await request.post('/api/checkout/update-intent', {
      data: {
        paymentIntentId,
        shippingRate: {
          objectId: selectedRate.object_id || selectedRate.objectId,
          amount: selectedRate.amount,
        },
        shippingDetails: {
          name: 'John Full Test',
          email: testEmail,
          phone: '5145550000',
          street1: '1100 Rue de la Gauchetière O',
          city: 'Montréal',
          state: 'QC',
          zip: 'H3B 2S2',
          country: 'CA',
        },
      },
    });
    expect(updateResponse.status()).toBe(200);
    console.log('✅ Intent updated successfully.');

    // ═══════════════════════════════════════════════════════════
    // STEP 4: CONFIRM PAYMENT VIA STRIPE API (Real Visa Test)
    // ═══════════════════════════════════════════════════════════
    console.log(
      '\n💳 Step 4: Confirming Payment with REAL Stripe API (Visa Test)...'
    );

    // This call tells the REAL Stripe server to process a Visa test card.
    // It will then send a REAL webhook to your ngrok URL.
    const confirmation = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa',
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/en/success`,
    });

    console.log(`📥 Stripe Confirmation Status: ${confirmation.status}`);
    expect(['succeeded', 'processing', 'requires_action']).toContain(
      confirmation.status
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 5: VERIFY FINAL RESULT (Real Webhook -> DB)
    // ═══════════════════════════════════════════════════════════
    console.log(
      '\n🔍 Step 5: Waiting for Real Webhook to trigger Order Creation...'
    );

    // Since we are waiting for a real notification from Stripe -> ngrok -> Your Server
    // we need a small polling loop.
    let order = null;
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      process.stdout.write('.');
      order = await verifyOrderCreated(testEmail);
      if (order) break;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    }
    console.log('');

    expect(order).not.toBeNull();
    console.log(`🎉 SUCCESS! Order ${order.orderNumber} created and PAID.`);
    console.log(
      `✅ Verified: The real Stripe signal reached your server through ngrok!`
    );
    console.log(
      '👀 Check the terminal logs above to see the REAL Resend email confirmation!'
    );
  });
});
