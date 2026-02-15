import { test, expect } from '@playwright/test';
import {
  getTestSupplierId,
  disconnectPrisma,
} from '../fixtures/seed-test-data';

test.describe('Storefront Product Discovery', () => {
  let testSupplierId: string;

  test.beforeAll(async () => {
    testSupplierId = await getTestSupplierId();
  });

  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('Created product should be visible and accessible in the shop', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const productSlug = `shop-test-${timestamp}`;
    const productNameEN = `Visible Product ${timestamp}`;
    const productPrice = '89.99';

    console.log('🏗️ Pre-requisite: Creating product via Admin...');

    // 1. Create product as DRAFT
    await page.goto('/en/admin/products/new');
    await page.fill('input[placeholder="product-url-slug"]', productSlug);

    const enSection = page
      .locator('.admin-card')
      .filter({ has: page.locator('h2:has-text("EN")') });
    await enSection.getByPlaceholder('Product Name').fill(productNameEN);

    // Shipping essentials for initial save
    await page.selectOption('#shippingOriginId', testSupplierId);
    await page.fill('#originCountry', 'CA');
    await page.fill('#hsCode', '123456');
    await page.fill('#weight', '1.0');
    await page.fill('#length', '10');
    await page.fill('#width', '10');
    await page.fill('#height', '10');
    await page.fill('#incoterm', 'DDP');
    await page.fill('#exportExplanation', 'Storefront test discovery');

    // Save Product (Draft by default, variants not available yet without ID)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .locator('button')
      .filter({ hasText: /^Save$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/products$/);

    // 2. Activate and Add Variant via Edition (Variant manager requires productId)
    console.log('📝 Editing to add variants and Activate...');
    const productRow = page.locator(`tr[data-product-slug="${productSlug}"]`);
    await productRow.getByRole('link', { name: /Edit/i }).click();

    // Change Status to ACTIVE
    await page.selectOption('#statusSelect', 'ACTIVE');

    // Add Variant (Required for storefront visibility and price)
    console.log('➕ Adding variant in edit mode...');
    await page.click('#addVariantBtn');
    const variantForm = page.locator('.rounded-lg.border.bg-gray-50').first();
    await expect(variantForm).toBeVisible();
    await variantForm.locator('input[name="variantNameEN"]').fill('Standard');
    await variantForm
      .locator('input[name="variantNameFR"]')
      .fill('Standard FR');
    await variantForm
      .locator('input[name="variantPrice_CAD"]')
      .fill(productPrice);
    await variantForm.locator('input[name="variantStock"]').fill('50');
    await page.click('#saveNewVariantsBtn');

    // Wait for variant save success
    await expect(page.locator('.admin-alert-success')).toBeVisible({
      timeout: 15000,
    });
    console.log('✨ Variant added');

    // Final Save Product (To commit status change and variants)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .locator('button')
      .filter({ hasText: /^Save$/i })
      .first()
      .click();
    await expect(page.locator('.admin-alert-success')).toBeVisible();

    // 3. Switch to Storefront
    console.log('🛍️ Navigating to Shop...');
    await page.goto('/en/shop');

    // 4. Find Product in Gallery
    console.log(`🔍 Searching for product: ${productNameEN}`);
    const productCard = page.locator(
      `[data-testid="product-card"][data-product-slug="${productSlug}"]`
    );

    // Wait for visibility on storefront
    await expect(productCard).toBeVisible({ timeout: 20000 });

    // 5. Verify Name and Price
    const nameInCard = productCard.locator('[data-testid="product-name"]');
    await expect(nameInCard).toHaveText(productNameEN);

    const priceInCard = productCard.locator('[data-testid="product-price"]');
    await expect(priceInCard).toContainText('89.99');

    // 6. Click and Verify Redirection to Product Page
    console.log('🖱️ Clicking on product card...');
    await productCard.locator('a').first().click();

    // Should be on /en/product/[slug]
    await expect(page).toHaveURL(new RegExp(`\/product\/${productSlug}$`));

    // Verify we are indeed on the product detail page
    await expect(
      page.getByRole('heading', { name: productNameEN, level: 1 })
    ).toBeVisible();

    console.log('✅ Storefront discovery test passed!');
  });
});
