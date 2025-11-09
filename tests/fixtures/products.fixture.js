/**
 * Product test fixtures
 * Reusable test data for product-related tests
 */

const createProductData = (overrides = {}) => ({
  name: 'Test Product',
  description: 'Test product description',
  price: 99.99,
  stock: 10,
  ...overrides,
});

const createVariantData = (overrides = {}) => ({
  sku: `TEST-SKU-${Date.now()}`,
  price: 99.99,
  stock: 10,
  ...overrides,
});

const createAttributeData = (overrides = {}) => ({
  key: `test_attribute_${Date.now()}`,
  inputType: 'select',
  isRequired: false,
  sortOrder: 1,
  translations: [
    { language: 'EN', name: 'Test Attribute' },
    { language: 'FR', name: 'Attribut Test' },
  ],
  ...overrides,
});

module.exports = {
  createProductData,
  createVariantData,
  createAttributeData,
};
