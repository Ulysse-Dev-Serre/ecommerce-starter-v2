/**
 * Complete workflow test - Users, Products, Cart
 * Tests the full e-commerce workflow without RBAC auth
 */
const { setupTest, teardownTest } = require('../../utils/setup');
const { PrismaClient} = require('../../../src/generated/prisma');

describe('Complete Workflow - Hydroponics E-commerce', () => {
  let client;
  let prisma;
  let testUsers = {};
  let testProducts = [];
  let testVariants = [];

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    prisma = new PrismaClient();

    // Get seeded users
    const users = await prisma.user.findMany();
    testUsers = {
      admin: users.find(u => u.role === 'ADMIN'),
      client: users.find(u => u.role === 'CLIENT'),
    };

    // Get seeded product variants
    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });
    testVariants = variants;

    console.log(`🌱 Test environment ready:`);
    console.log(`   - Admin: ${testUsers.admin.email}`);
    console.log(`   - Client: ${testUsers.client.email}`);
    console.log(`   - Variants: ${testVariants.map(v => v.sku).join(', ')}`);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownTest();
  });

  describe('1. User Management', () => {
    test('should have 2 users from seed', async () => {
      const users = await prisma.user.findMany();
      
      expect(users).toHaveLength(2);
      expect(users.some(u => u.role === 'ADMIN')).toBe(true);
      expect(users.some(u => u.role === 'CLIENT')).toBe(true);
    });

    test.skip('should promote user from CLIENT to ADMIN (requires Clerk auth)', async () => {
      const response = await client.post(
        `/api/users/${testUsers.client.id}/promote`
      );

      expect(response.success).toBe(true);
      expect(response.data.newRole).toBe('ADMIN');
      expect(response.data.previousRole).toBe('CLIENT');

      // Update local reference
      testUsers.client.role = 'ADMIN';
    });

    test.skip('should demote user back from ADMIN to CLIENT (requires Clerk auth)', async () => {
      const response = await client.post(
        `/api/users/${testUsers.client.id}/promote`
      );

      expect(response.success).toBe(true);
      expect(response.data.newRole).toBe('CLIENT');
      expect(response.data.previousRole).toBe('ADMIN');

      // Update local reference
      testUsers.client.role = 'CLIENT';
    });
  });

  describe('2. Product Management', () => {
    test('should have at least 2 hydroponic products from seed', async () => {
      const products = await prisma.product.findMany({
        where: { deletedAt: null },
        include: { translations: true },
      });

      expect(products.length).toBeGreaterThanOrEqual(2);
      const productNames = products.flatMap(p => 
        p.translations.map(t => t.name)
      );
      expect(productNames.some(name => name.includes('Hydropon'))).toBe(true);
      expect(productNames.some(name => name.includes('Sensor') || name.includes('Capteur'))).toBe(true);
    });

    test('should create 10 new hydroponic products', async () => {
      const createdProducts = [];

      for (let i = 1; i <= 10; i++) {
        const productData = {
          slug: `hydro-test-product-${i}-${Date.now()}`,
          status: 'ACTIVE',
          isFeatured: i % 2 === 0,
          translations: [
            {
              language: 'FR',
              name: `Produit Hydro Test ${i}`,
              description: `Produit de test hydroponique numéro ${i}`,
              shortDescription: `Test ${i}`,
            },
            {
              language: 'EN',
              name: `Hydro Test Product ${i}`,
              description: `Hydroponic test product number ${i}`,
              shortDescription: `Test ${i}`,
            },
          ],
        };

        const response = await client.post('/api/products', productData);
        expect(response.success).toBe(true);
        expect(response.status).toBe(201);

        createdProducts.push(response.data.product);
      }

      expect(createdProducts).toHaveLength(10);
      testProducts = createdProducts;

      console.log(`   ✅ Created ${createdProducts.length} test products`);
    });

    test('should delete 5 products', async () => {
      const productsToDelete = testProducts.slice(0, 5);
      let deletedCount = 0;

      for (const product of productsToDelete) {
        const response = await client.delete(`/api/products/${product.id}`);
        
        expect(response.success).toBe(true);
        expect(response.status).toBe(200);
        expect(response.data.product.deletedAt).not.toBeNull();

        deletedCount++;
      }

      expect(deletedCount).toBe(5);
      console.log(`   ✅ Deleted ${deletedCount} products`);
    });

    test('should have correct product count after deletions', async () => {
      const activeProducts = await prisma.product.count({
        where: { deletedAt: null },
      });
      const deletedProducts = await prisma.product.count({
        where: { deletedAt: { not: null } },
      });

      // At least 2 from seed + 10 created - 5 deleted
      expect(activeProducts).toBeGreaterThanOrEqual(7);
      expect(deletedProducts).toBeGreaterThanOrEqual(5);
      
      console.log(`   📊 Products: ${activeProducts} active, ${deletedProducts} deleted`);
    });
  });

  describe('3. Cart Management - Anonymous User', () => {
    let testCartId;
    let testCartItems = [];

    test('should add hydroponic system to cart', async () => {
      const hydroVariant = testVariants.find(v => v.sku.includes('HYDRO'));
      
      const response = await client.post('/api/cart/items', {
        anonymousId: 'test-workflow-anon-001',
        variantId: hydroVariant.id,
        quantity: 2,
      });

      expect(response.success).toBe(true);
      expect(response.data.cart.items).toHaveLength(1);
      expect(response.data.cart.items[0].quantity).toBe(2);

      testCartId = response.data.cart.id;
      testCartItems.push(response.data.cart.items[0]);
    });

    test('should add sensor to same cart', async () => {
      const sensorVariant = testVariants.find(v => v.sku.includes('SENSOR'));

      const response = await client.post('/api/cart/items', {
        anonymousId: 'test-workflow-anon-001',
        variantId: sensorVariant.id,
        quantity: 3,
      });

      expect(response.success).toBe(true);
      expect(response.data.cart.id).toBe(testCartId);
      expect(response.data.cart.items).toHaveLength(2);

      testCartItems.push(response.data.cart.items[1]);
    });

    test('should increase quantity of existing item', async () => {
      const hydroVariant = testVariants.find(v => v.sku.includes('HYDRO'));

      const response = await client.post('/api/cart/items', {
        anonymousId: 'test-workflow-anon-001',
        variantId: hydroVariant.id,
        quantity: 1,
      });

      expect(response.success).toBe(true);
      expect(response.data.cart.items).toHaveLength(2); // Still 2 items
      
      const hydroItem = response.data.cart.items.find(
        item => item.variantId === hydroVariant.id
      );
      expect(hydroItem.quantity).toBe(3); // 2 + 1 = 3
    });

    test('should remove one item from cart', async () => {
      const itemToRemove = testCartItems[0];

      const response = await client.delete(`/api/cart/items/${itemToRemove.id}`);

      expect(response.success).toBe(true);
      expect(response.data.cartItem.id).toBe(itemToRemove.id);

      console.log(`   ✅ Removed item from cart`);
    });

    test('should verify cart has 1 item left', async () => {
      const cart = await prisma.cart.findUnique({
        where: { id: testCartId },
        include: { items: true },
      });

      expect(cart.items).toHaveLength(1);
    });
  });

  describe('4. Cart Management - Multiple Anonymous Users', () => {
    test('should create separate carts for different anonymous users', async () => {
      const variant = testVariants[0];

      const cart1Response = await client.post('/api/cart/items', {
        anonymousId: 'anon-user-1',
        variantId: variant.id,
        quantity: 1,
      });

      const cart2Response = await client.post('/api/cart/items', {
        anonymousId: 'anon-user-2',
        variantId: variant.id,
        quantity: 1,
      });

      expect(cart1Response.data.cart.id).not.toBe(cart2Response.data.cart.id);
      expect(cart1Response.data.cart.anonymousId).toBe('anon-user-1');
      expect(cart2Response.data.cart.anonymousId).toBe('anon-user-2');
    });
  });

  describe('5. Full Workflow Integration', () => {
    test('should complete full purchase workflow', async () => {
      // Step 1: Browse products (verify they exist)
      const products = await prisma.product.count({
        where: { deletedAt: null, status: 'ACTIVE' },
      });
      expect(products).toBeGreaterThan(0);

      // Step 2: Add to cart
      const variant = testVariants[0];
      const addResponse = await client.post('/api/cart/items', {
        anonymousId: 'full-workflow-test',
        variantId: variant.id,
        quantity: 2,
      });
      expect(addResponse.success).toBe(true);

      const cartId = addResponse.data.cart.id;
      const itemId = addResponse.data.cart.items[0].id;

      // Step 3: Verify cart
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: true },
      });
      expect(cart.items).toHaveLength(1);

      // Step 4: Remove from cart (change of mind)
      const removeResponse = await client.delete(`/api/cart/items/${itemId}`);
      expect(removeResponse.success).toBe(true);

      // Step 5: Verify cart is empty
      const emptyCart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: true },
      });
      expect(emptyCart.items).toHaveLength(0);

      console.log(`   ✅ Full workflow completed successfully`);
    });
  });

  describe('6. Data Integrity', () => {
    test('should have consistent database state', async () => {
      const usersCount = await prisma.user.count();
      const activeProductsCount = await prisma.product.count({
        where: { deletedAt: null },
      });
      const variantsCount = await prisma.productVariant.count();
      const cartsCount = await prisma.cart.count();

      console.log(`   📊 Final database state:`);
      console.log(`      - Users: ${usersCount}`);
      console.log(`      - Active Products: ${activeProductsCount}`);
      console.log(`      - Variants: ${variantsCount}`);
      console.log(`      - Carts: ${cartsCount}`);

      expect(usersCount).toBe(2);
      expect(activeProductsCount).toBeGreaterThanOrEqual(2);
      expect(variantsCount).toBeGreaterThanOrEqual(4);
    });
  });
});
