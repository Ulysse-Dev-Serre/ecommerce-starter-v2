/**
 * Products API tests
 */
const { setupTest, teardownTest } = require('../../utils/setup');

describe('Products API', () => {
  let client;
  let createdProductId;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('POST /api/products', () => {
    test('should create a product with minimal data successfully', async () => {
      const productData = {
        slug: `test-product-${Date.now()}`,
      };

      const response = await client.post('/api/products', productData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('product');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data.product).toHaveProperty('id');
      expect(response.data.product).toHaveProperty('slug', productData.slug);
      expect(response.data.product).toHaveProperty('status', 'DRAFT');

      createdProductId = response.data.product.id;
    });

    test('should create a product with full data successfully', async () => {
      const productData = {
        slug: `complete-product-${Date.now()}`,
        status: 'ACTIVE',
        isFeatured: true,
        sortOrder: 10,
        translations: [
          {
            language: 'FR',
            name: 'Produit Test',
            description: 'Description du produit de test',
            shortDescription: 'Courte description',
            metaTitle: 'Meta Titre',
            metaDescription: 'Meta Description',
          },
          {
            language: 'EN',
            name: 'Test Product',
            description: 'Test product description',
          },
        ],
      };

      const response = await client.post('/api/products', productData);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data.product).toHaveProperty('slug', productData.slug);
      expect(response.data.product).toHaveProperty('status', 'ACTIVE');
      expect(response.data.product).toHaveProperty('isFeatured', true);
      expect(response.data.product).toHaveProperty('sortOrder', 10);
      expect(response.data.product.translations).toHaveLength(2);

      const frTranslation = response.data.product.translations.find(
        t => t.language === 'FR'
      );
      expect(frTranslation).toHaveProperty('name', 'Produit Test');
      expect(frTranslation).toHaveProperty(
        'description',
        'Description du produit de test'
      );
    });

    test('should have correct response structure', async () => {
      const productData = {
        slug: `structure-test-${Date.now()}`,
      };

      const response = await client.post('/api/products', productData);

      expect(response.data).toMatchObject({
        success: true,
        message: expect.any(String),
        timestamp: expect.any(String),
        product: expect.objectContaining({
          id: expect.any(String),
          slug: expect.any(String),
          status: expect.any(String),
          isFeatured: expect.any(Boolean),
          sortOrder: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });
    });

    test('should fail when slug is missing', async () => {
      const response = await client.post('/api/products', {});

      expect(response.success).toBe(false);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/products/[id]', () => {
    let testProductId;

    beforeEach(async () => {
      const productData = {
        slug: `delete-test-${Date.now()}`,
      };
      const createResponse = await client.post('/api/products', productData);
      testProductId = createResponse.data.product.id;
    });

    test('should delete a product successfully', async () => {
      const response = await client.delete(`/api/products/${testProductId}`);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('product');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data.product).toHaveProperty('id', testProductId);
      expect(response.data.product).toHaveProperty('deletedAt');
      expect(response.data.product.deletedAt).not.toBeNull();
    });

    test('should return 404 for non-existent product', async () => {
      const response = await client.delete('/api/products/invalid-id-123');

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toBe('Product not found');
    });

    test('should return 404 for already deleted product', async () => {
      await client.delete(`/api/products/${testProductId}`);
      const secondResponse = await client.delete(
        `/api/products/${testProductId}`
      );

      expect(secondResponse.success).toBe(false);
      expect(secondResponse.status).toBe(404);
    });

    test('should have correct response structure', async () => {
      const response = await client.delete(`/api/products/${testProductId}`);

      expect(response.data).toMatchObject({
        success: true,
        message: expect.any(String),
        timestamp: expect.any(String),
        product: expect.objectContaining({
          id: expect.any(String),
          slug: expect.any(String),
          deletedAt: expect.any(String),
        }),
      });
    });
  });
});
