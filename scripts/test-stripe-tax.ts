import 'dotenv/config';
import Stripe from 'stripe';

async function testStripeTax() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found in .env');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia' as any, // Use latest or matching project version
  });

  console.log('🚀 Starting Stripe Tax Test...');
  console.log(`Using Key: ${secretKey.substring(0, 8)}...`);

  try {
    // 1. Create a basic PaymentIntent
    console.log('\nCreating initial PaymentIntent...');
    const intent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'cad',
      payment_method_types: ['card'],
    });
    console.log(`✅ Intent created: ${intent.id}`);

    // 2. Update with automatic_tax enabled
    console.log('\nUpdating Intent to enable automatic_tax...');
    const updatePayload = {
      automatic_tax: { enabled: true },
      // Providing a shipping address is often required for valid tax calc,
      // even if valid calculation isn't possible in test mode, we want to see if the param persists.
      shipping: {
        name: 'Test User',
        address: {
          line1: '123 Test St',
          city: 'Montreal',
          state: 'QC',
          postal_code: 'H3Z 2Y7',
          country: 'CA',
        },
      },
    };

    const updatedIntent = await stripe.paymentIntents.update(
      intent.id,
      updatePayload
    );

    // 3. Inspect the result
    console.log('\n--- RESULT ---');

    // Check if automatic_tax key exists and what it contains
    if (updatedIntent.automatic_tax) {
      console.log('✅ "automatic_tax" field IS present in response:');
      console.dir(updatedIntent.automatic_tax, { depth: null });

      if (updatedIntent.automatic_tax.enabled) {
        console.log(
          '🎉 automatic_tax.enabled is TRUE. Stripe accepted the request.'
        );
      } else {
        console.log(
          '⚠️ automatic_tax.enabled is FALSE. Stripe accepted the param but disabled it (maybe due to missing address?).'
        );
      }
    } else {
      console.log('❌ "automatic_tax" field is MISSING in response.');
      console.log('🚨 CONCLUSION: Stripe ignored the request silently.');
    }

    // Dump full object for verification
    console.log('\n--- FULL UPDATED INTENT (Partial) ---');
    console.log(
      JSON.stringify(
        {
          id: updatedIntent.id,
          amount: updatedIntent.amount,
          automatic_tax: updatedIntent.automatic_tax,
          status: updatedIntent.status,
        },
        null,
        2
      )
    );
  } catch (error: any) {
    console.error('\n❌ ERROR during test:');
    console.error(error.message);
    if (error.raw) {
      console.error('Stripe Error Type:', error.raw.type);
      console.error('Stripe Error Code:', error.raw.code);
    }
  }
}

testStripeTax();
