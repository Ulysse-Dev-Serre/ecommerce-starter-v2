/**
 * Stripe Checkout API tests
 */
const { setupTest, teardownTest } = require('../../setup/test.setup');

describe('Stripe Checkout API', () => {
  let client;
  let createdSessionId = null;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('POST /api/checkout/create-session', () => {
    test('should fail when cart is empty', async () => {
      const response = await client.post('/api/checkout/create-session', {
        successUrl: 'http://localhost:3000/checkout/success',
        cancelUrl: 'http://localhost:3000/cart',
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toMatch(/cart is empty/i);
    });

    test('should create checkout session with valid cart', async () => {
      // Récupérer le panier
      const cartResponse = await client.get('/api/cart');
      expect(cartResponse.success).toBe(true);

      const cart = cartResponse.data.cart;

      // Skip si panier vide (nécessite d'avoir des produits en DB)
      if (cart.items.length === 0) {
        console.log('⚠️  Skipped: Panier vide. Ajoutez des produits pour tester.');
        return;
      }

      // Créer session checkout
      const response = await client.post('/api/checkout/create-session', {
        successUrl: 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:3000/cart',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('sessionId');
      expect(response.data).toHaveProperty('url');
      expect(response.data.url).toContain('checkout.stripe.com');

      createdSessionId = response.data.sessionId;

      console.log('\n✅ Session créée:', response.data.sessionId);
      console.log('🔗 URL:', response.data.url);
    });

    test('should have valid Stripe session structure', async () => {
      if (!createdSessionId) {
        console.log('⚠️  Skipped: Aucune session créée');
        return;
      }

      expect(createdSessionId).toMatch(/^cs_test_/);
    });
  });

  describe('GET /api/checkout/success', () => {
    test('should fail without session_id', async () => {
      const response = await client.get('/api/checkout/success');

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toMatch(/missing session_id/i);
    });

    test('should retrieve session details', async () => {
      if (!createdSessionId) {
        console.log('⚠️  Skipped: Aucune session créée');
        return;
      }

      const response = await client.get(
        `/api/checkout/success?session_id=${createdSessionId}`
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('session');
      expect(response.data.session).toMatchObject({
        id: expect.any(String),
        paymentStatus: expect.any(String),
        amountTotal: expect.any(Number),
        currency: expect.any(String),
      });

      console.log('\n✅ Session récupérée:');
      console.log('   Payment Status:', response.data.session.paymentStatus);
      console.log('   Amount:', response.data.session.amountTotal, response.data.session.currency);
    });
  });
});
