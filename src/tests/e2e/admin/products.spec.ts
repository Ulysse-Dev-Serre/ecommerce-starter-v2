import { test, expect } from '@playwright/test';

import {
  getTestSupplierId,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

test.describe('Admin Products', () => {
  let testSupplierId: string;

  // Setup: Create test supplier before tests
  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
    console.log('🏭 Using test supplier:', testSupplierId);
  });

  // Teardown: Disconnect Prisma
  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('Create a new product with shipping info', async ({ page }) => {
    const timestamp = Date.now();
    const productSlug = `e2e-test-product-${timestamp}`;
    const productNameEN = `E2E Test Product ${timestamp}`;
    const productNameFR = `Produit Test E2E ${timestamp}`;

    // 1. Navigate to new product page
    await page.goto('/en/admin/products/new');
    await expect(page).toHaveURL(/\/admin\/products\/new/);

    // 2. Fill BASIC INFO
    console.log('📝 Filling basic info...');

    // Slug
    await page.fill('input[placeholder="product-url-slug"]', productSlug);

    // 3. Fill TRANSLATIONS - English
    console.log('📝 Filling EN translation...');
    // We find the section that has the "EN" header
    const enSection = page
      .locator('.admin-card')
      .filter({ has: page.locator('h2:has-text("EN")') });

    await enSection.getByPlaceholder('Product Name').fill(productNameEN);
    await enSection
      .getByPlaceholder('Brief product description')
      .fill('A test product for E2E automation');
    await enSection
      .getByPlaceholder('Detailed product description')
      .fill('This is a detailed description for the E2E test product.');

    // 4. Fill TRANSLATIONS - French
    console.log('📝 Filling FR translation...');
    // We find the section that has the "FR" header
    const frSection = page
      .locator('.admin-card')
      .filter({ has: page.locator('h2:has-text("FR")') });

    await frSection.getByPlaceholder('Product Name').fill(productNameFR);
    await frSection
      .getByPlaceholder('Brief product description')
      .fill("Un produit test pour l'automatisation E2E");
    await frSection
      .getByPlaceholder('Detailed product description')
      .fill('Ceci est une description détaillée pour le produit test E2E.');

    // 5. Fill SHIPPING INFO
    console.log('📝 Filling shipping info...');

    // Shipping Origin (select the test supplier)
    await page.selectOption('#shippingOriginId', testSupplierId);

    // Origin Country
    await page.fill('#originCountry', 'CA');

    // HS Code
    await page.fill('#hsCode', '123456');

    // Weight
    await page.fill('#weight', '1.5');

    // Dimensions
    await page.fill('#length', '25');
    await page.fill('#width', '15');
    await page.fill('#height', '10');

    // Export Explanation
    await page.fill('#exportExplanation', 'Test product for customs');

    // 6. Save the product
    console.log('💾 Saving product...');
    // Click the Save button (there might be multiple, we take the primary one)
    await page.getByRole('button', { name: /Save/i }).first().click();

    // 7. Verify redirection to products list
    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 20000 });

    // 8. Verify product appears in the list
    console.log('✅ Verifying product in list...');
    await expect(page.locator(`text=${productNameEN}`)).toBeVisible({
      timeout: 15000,
    });

    console.log('✅ Product created successfully!');
  });

  test('Verify product creation form validation', async ({ page }) => {
    // Navigate to new product page
    await page.goto('/en/admin/products/new');

    // Try to save without filling required fields
    await page.getByRole('button', { name: /Save/i }).first().click();

    // Should not redirect (validation errors should appear)
    await expect(page).toHaveURL(/\/admin\/products\/new/);

    // Check for error messages (red text or borders)
    const errors = page.locator(
      '.text-red-500, .text-red-600, .border-red-500'
    );
    await expect(errors.first()).toBeVisible();

    console.log('✅ Form validation working correctly');
  });
});
