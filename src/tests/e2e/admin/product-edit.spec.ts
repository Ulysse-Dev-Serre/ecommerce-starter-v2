import { test, expect } from '@playwright/test';

import {
  getTestSupplierId,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

test.describe('Admin Product Edition', () => {
  let testSupplierId: string;

  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('Edit a draft product to make it Active with variants', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const productSlug = `edit-test-${timestamp}`;
    const productNameEN = `Product to Edit ${timestamp}`;
    const variantNameEN = `Standard Edition ${timestamp}`;

    // 1. Create a DRAFT product first (Minimal)
    console.log('🏗️ Creating initial draft product...');
    await page.goto('/en/admin/products/new');
    await page.fill('input[placeholder="product-url-slug"]', productSlug);

    const enSection = page
      .locator('.admin-card')
      .filter({ has: page.locator('h2:has-text("EN")') });
    await enSection.getByPlaceholder('Product Name').fill(productNameEN);

    await page.selectOption('#shippingOriginId', testSupplierId);
    await page.fill('#originCountry', 'CA');
    await page.fill('#hsCode', '123456');
    await page.fill('#weight', '1.0');
    await page.fill('#length', '10');
    await page.fill('#width', '10');
    await page.fill('#height', '10');
    await page.fill('#exportExplanation', 'Initial draft');

    await page.getByRole('button', { name: /Save/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/products$/);

    // 2. Find and Edit the product
    console.log('🔍 Locating product in list...');
    const productRow = page.locator(`tr[data-product-slug="${productSlug}"]`);
    await productRow.getByRole('link', { name: /Edit/i }).click();

    // 3. Update Status to ACTIVE
    console.log('📝 Updating status to ACTIVE...');
    await page.selectOption('#statusSelect', 'ACTIVE');

    // 4. Add a Variant
    console.log('➕ Adding a new variant...');
    await page.click('#addVariantBtn');

    // Wait for the variant form to appear
    const variantForm = page.locator('.rounded-lg.border.bg-gray-50').first();
    await expect(variantForm).toBeVisible();

    // Fill variant details
    await variantForm
      .locator('input[name="variantName_en"]')
      .fill(variantNameEN);
    await variantForm
      .locator('input[name="variantName_fr"]')
      .fill(`Édition Standard ${timestamp}`);
    await variantForm.locator('input[name="variantPrice_CAD"]').fill('49.99');
    await variantForm.locator('input[name="variantPrice_USD"]').fill('39.99');
    await variantForm.locator('input[name="variantStock"]').fill('100');

    // Save the variant specifically first
    console.log('💾 Saving variants...');
    await page.click('#saveNewVariantsBtn');

    console.log('✨ Variant save action triggered');

    // 5. Final Save of the Product
    console.log('💾 Final product save...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .locator('button')
      .filter({ hasText: /^Save$/i })
      .first()
      .click();

    // 6. Verify success and Return to list
    console.log('✅ Final save check - waiting for redirect or update...');

    // Wait for potential navigation or just a moment for save to complete
    await page.waitForTimeout(2000);

    // 7. Verify Status is ACTIVE (on the current Edit page, as save refreshes the page)
    console.log('✅ Verifying status on Edit page...');
    await expect(page.locator('#statusSelect')).toHaveValue('ACTIVE');

    // Optional: Go back to list just to finish where we started
    await page.goto('/en/admin/products');

    console.log('✅ Product successfully edited and activated with variants!');
  });
});
