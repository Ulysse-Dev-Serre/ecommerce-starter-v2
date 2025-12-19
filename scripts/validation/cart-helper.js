/**
 * Helper functions for cart operations in tests
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

/**
 * Add a product to cart
 */
async function addProductToCart(variantId, quantity = 1, testApiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/cart/items', BASE_URL);
    const data = JSON.stringify({ variantId, quantity });

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-api-key': testApiKey,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
          });
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Get first available variant ID from products
 */
async function getFirstAvailableVariantId(testApiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/products', BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-test-api-key': testApiKey,
      },
    };

    const req = http.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);

          if (parsed.success && parsed.products && parsed.products.length > 0) {
            const product = parsed.products[0];
            if (product.variants && product.variants.length > 0) {
              resolve(product.variants[0].id);
              return;
            }
          }

          resolve(null);
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}

module.exports = {
  addProductToCart,
  getFirstAvailableVariantId,
};
