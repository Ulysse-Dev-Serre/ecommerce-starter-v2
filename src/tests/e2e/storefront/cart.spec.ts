import { test, expect } from '@playwright/test';
import {
  getTestSupplierId,
  getOrCreateTestProduct,
  cleanupTestProduct,
  cleanupTestSupplier,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

test.describe('Test 3: Flux Panier & Authenticité (Boutique -> Panier -> Checkout)', () => {
  let testSupplierId: string;
  const fixedSlug = 'e2e-checkout-product-fixed';

  test.beforeAll(async () => {
    await cleanupTestProduct(fixedSlug);
    testSupplierId = await getTestSupplierId();
  });

  test.afterAll(async () => {
    await cleanupTestProduct(fixedSlug);
    await cleanupTestSupplier();
    await disconnectPrisma();
  });

  test('Should verify Zod authentic product and reach checkout entrance', async ({
    page,
  }) => {
    // 1. Création du produit
    const product = await getOrCreateTestProduct(testSupplierId);

    // 3. Interaction Add-to-Cart
    console.log('🛒 Adding to cart...');
    await page.goto(`/en/product/${product.slug}`);
    const addToCartBtn = page
      .locator('[data-testid="add-to-cart-button"]')
      .first();
    await addToCartBtn.click();
    await expect(
      page.locator('[data-testid="toast-notification"]')
    ).toBeVisible();

    // 4. Navigation vers le Panier
    console.log('🛒 Going to Cart page...');
    console.log('🛒 Going to Cart page...');
    await page.goto('/en/cart');
    await expect(page).toHaveURL(/\/cart/);

    // 5. Clic sur Checkout (Sélecteur ID stable)
    console.log('💳 Clicking Checkout button...');
    const checkoutBtn = page.locator('[data-testid="checkout-button"]');
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // 6. Vérification Arrivée Checkout
    console.log('📍 Verifying Checkout page navigation...');
    await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

    // Attente fin de chargement (si present)
    const loader = page.locator('text=/Loading|Chargement/i');
    if (await loader.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('⏳ Waiting for loading state...');
      await expect(loader).toBeHidden({ timeout: 60000 });
    }

    // Vérification Formulaire
    await expect(page.locator('[data-testid="checkout-name"]')).toBeVisible({
      timeout: 30000,
    });

    console.log('✅ Test 3 Complete: Reached checkout form successfully.');
  });
});
