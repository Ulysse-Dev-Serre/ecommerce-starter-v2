/**
 * Cart API tests
 */
const { setupTest, teardownTest } = require('../../utils/setup');
const { PrismaClient } = require('../../../src/generated/prisma');

describe('Cart API', () => {
  let client;
  let prisma;
  let testVariantIds = [];

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    prisma = new PrismaClient();

    // Get variant IDs from seeded products
    const variants = await prisma.productVariant.findMany({
      take: 5,
      select: { id: true, sku: true },
    });

    testVariantIds = variants.map(v => v.id);
    console.log(
      `📦 Found ${testVariantIds.length} variants for testing:`,
      variants.map(v => v.sku)
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownTest();
  });

  describe('POST /api/cart/items', () => {
    test('should add item to cart for anonymous user', async () => {
      const cartData = {
        anonymousId: `anon-${Date.now()}`,
        variantId: testVariantIds[0],
        quantity: 2,
      };

      const response = await client.post('/api/cart/items', cartData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('cart');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data.cart).toHaveProperty('id');
      expect(response.data.cart).toHaveProperty('anonymousId', cartData.anonymousId);
      expect(response.data.cart.items).toHaveLength(1);
      expect(response.data.cart.items[0]).toHaveProperty('variantId', testVariantIds[0]);
      expect(response.data.cart.items[0]).toHaveProperty('quantity', 2);
    });

    test('should add item to cart for authenticated user', async () => {
      // Get a test user ID
      const usersResponse = await client.get('/api/users');
      const userId = usersResponse.data.users[0]?.id;

      if (!userId) {
        console.warn('⚠️  No users found, skipping authenticated cart test');
        return;
      }

      const cartData = {
        userId,
        variantId: testVariantIds[1],
        quantity: 1,
      };

      const response = await client.post('/api/cart/items', cartData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data.cart).toHaveProperty('userId', userId);
      expect(response.data.cart.items).toHaveLength(1);
      expect(response.data.cart.items[0]).toHaveProperty('variantId', testVariantIds[1]);
    });

    test('should add multiple different items to same cart', async () => {
      const anonymousId = `anon-multi-${Date.now()}`;

      // Add first item
      const firstItem = {
        anonymousId,
        variantId: testVariantIds[0],
        quantity: 1,
      };
      const firstResponse = await client.post('/api/cart/items', firstItem);
      const cartId = firstResponse.data.cart.id;

      // Add second item
      const secondItem = {
        anonymousId,
        variantId: testVariantIds[1],
        quantity: 3,
      };
      const secondResponse = await client.post('/api/cart/items', secondItem);

      expect(secondResponse.success).toBe(true);
      expect(secondResponse.data.cart.id).toBe(cartId);
      expect(secondResponse.data.cart.items).toHaveLength(2);
    });

    test('should update quantity when adding same variant twice', async () => {
      const anonymousId = `anon-update-${Date.now()}`;

      // Add item first time
      const firstAdd = {
        anonymousId,
        variantId: testVariantIds[2],
        quantity: 2,
      };
      await client.post('/api/cart/items', firstAdd);

      // Add same item again
      const secondAdd = {
        anonymousId,
        variantId: testVariantIds[2],
        quantity: 3,
      };
      const response = await client.post('/api/cart/items', secondAdd);

      expect(response.success).toBe(true);
      expect(response.data.cart.items).toHaveLength(1);
      expect(response.data.cart.items[0].quantity).toBe(5); // 2 + 3
    });

    test('should default quantity to 1 when not provided', async () => {
      const cartData = {
        anonymousId: `anon-default-${Date.now()}`,
        variantId: testVariantIds[3],
      };

      const response = await client.post('/api/cart/items', cartData);

      expect(response.success).toBe(true);
      expect(response.data.cart.items[0].quantity).toBe(1);
    });

    test('should fail when neither userId nor anonymousId provided', async () => {
      const cartData = {
        variantId: testVariantIds[0],
        quantity: 1,
      };

      const response = await client.post('/api/cart/items', cartData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('userId or anonymousId');
    });

    test('should fail when variantId is missing', async () => {
      const cartData = {
        anonymousId: `anon-${Date.now()}`,
        quantity: 1,
      };

      const response = await client.post('/api/cart/items', cartData);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('variantId');
    });

    test('should have correct response structure', async () => {
      const cartData = {
        anonymousId: `anon-structure-${Date.now()}`,
        variantId: testVariantIds[4],
        quantity: 1,
      };

      const response = await client.post('/api/cart/items', cartData);

      expect(response.data).toMatchObject({
        success: true,
        message: expect.any(String),
        timestamp: expect.any(String),
        cart: expect.objectContaining({
          id: expect.any(String),
          status: expect.any(String),
          currency: expect.any(String),
          items: expect.any(Array),
        }),
      });
    });
  });

  describe('DELETE /api/cart/items/[id]', () => {
    let testCartItemId;

    beforeEach(async () => {
      // Create a cart item to delete
      const cartData = {
        anonymousId: `anon-delete-${Date.now()}`,
        variantId: testVariantIds[0],
        quantity: 1,
      };
      const createResponse = await client.post('/api/cart/items', cartData);
      testCartItemId = createResponse.data.cart.items[0].id;
    });

    test('should delete cart item successfully', async () => {
      const response = await client.delete(`/api/cart/items/${testCartItemId}`);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('cartItem');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data.cartItem).toHaveProperty('id', testCartItemId);
    });

    test('should return 404 for non-existent cart item', async () => {
      const response = await client.delete('/api/cart/items/invalid-id-123');

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toBe('Cart item not found');
    });

    test('should return 404 for already deleted cart item', async () => {
      await client.delete(`/api/cart/items/${testCartItemId}`);
      const secondResponse = await client.delete(`/api/cart/items/${testCartItemId}`);

      expect(secondResponse.success).toBe(false);
      expect(secondResponse.status).toBe(404);
    });

    test('should have correct response structure', async () => {
      const response = await client.delete(`/api/cart/items/${testCartItemId}`);

      expect(response.data).toMatchObject({
        success: true,
        message: expect.any(String),
        timestamp: expect.any(String),
        cartItem: expect.objectContaining({
          id: expect.any(String),
          cartId: expect.any(String),
          variantId: expect.any(String),
          quantity: expect.any(Number),
        }),
      });
    });
  });

  describe('Cart workflow integration', () => {
    test('should complete full cart workflow: add, add more, remove one', async () => {
      const anonymousId = `anon-workflow-${Date.now()}`;

      // Step 1: Add first item
      const addFirst = await client.post('/api/cart/items', {
        anonymousId,
        variantId: testVariantIds[0],
        quantity: 2,
      });
      expect(addFirst.success).toBe(true);
      expect(addFirst.data.cart.items).toHaveLength(1);

      // Step 2: Add second item
      const addSecond = await client.post('/api/cart/items', {
        anonymousId,
        variantId: testVariantIds[1],
        quantity: 1,
      });
      expect(addSecond.success).toBe(true);
      expect(addSecond.data.cart.items).toHaveLength(2);

      // Step 3: Add third item
      const addThird = await client.post('/api/cart/items', {
        anonymousId,
        variantId: testVariantIds[2],
        quantity: 5,
      });
      expect(addThird.success).toBe(true);
      expect(addThird.data.cart.items).toHaveLength(3);

      // Step 4: Remove second item
      const secondItemId = addThird.data.cart.items.find(
        item => item.variantId === testVariantIds[1]
      ).id;
      const removeSecond = await client.delete(`/api/cart/items/${secondItemId}`);
      expect(removeSecond.success).toBe(true);

      // Verify final state would have 2 items (would need GET endpoint to verify)
      console.log('✅ Full workflow completed successfully');
    });
  });
});
