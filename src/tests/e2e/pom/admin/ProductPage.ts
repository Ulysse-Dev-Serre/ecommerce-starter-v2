import { type Page, type Locator, expect, test } from '@playwright/test';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  DEFAULT_CURRENCY,
} from '@/lib/config/site';

import { TEST_ROUTES } from '../../config/routes';

export interface ProductData {
  name: string;
  description: string;
  price: string;
  sku: string;
  stock: string;
}

/**
 * Product Management Page (Create/Edit)
 * Follows the E2E Workflow Checklist
 */
export class ProductPage {
  readonly page: Page;
  readonly saveButton: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly slugInput: Locator;
  readonly statusSelect: Locator;
  readonly addVariantButton: Locator;
  readonly priceInput: Locator;
  readonly skuInput: Locator;
  readonly stockInput: Locator;
  readonly weightInput: Locator;
  readonly lengthInput: Locator;
  readonly widthInput: Locator;
  readonly heightInput: Locator;
  readonly originCountryInput: Locator;
  readonly hsCodeInput: Locator;
  readonly exportExplanationInput: Locator;
  readonly shippingOriginSelect: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators strictly defined in constructor as per checklist
    this.saveButton = page
      .getByRole('button', { name: /Save|Enregistrer/i })
      .last();

    // Use DEFAULT_LOCALE from config for primary inputs
    this.nameInput = page.locator(`#product-name-${DEFAULT_LOCALE}`);
    this.descriptionInput = page.locator(
      `#product-description-${DEFAULT_LOCALE}`
    );

    this.slugInput = page.getByPlaceholder('product-url-slug');
    this.statusSelect = page.locator('#statusSelect');

    this.addVariantButton = page.getByRole('button', {
      name: /Add Variant|Ajouter une variante/i,
    });

    // Use DEFAULT_CURRENCY from config for primary price
    this.priceInput = page.getByLabel(
      new RegExp(`Price|Prix.*${DEFAULT_CURRENCY}`, 'i')
    );
    this.skuInput = page.getByLabel(/SKU/i);
    this.stockInput = page.getByLabel(/Stock|Quantité/i);

    // Shipping & Logistics
    this.weightInput = page.locator('#weight');
    this.lengthInput = page.locator('#length');
    this.widthInput = page.locator('#width');
    this.heightInput = page.locator('#height');
    this.originCountryInput = page.locator('#originCountry');
    this.hsCodeInput = page.locator('#hsCode');
    this.exportExplanationInput = page.locator('#exportExplanation');
    this.shippingOriginSelect = page.locator('#shippingOriginId');
  }

  /**
   * Step 2.3: Basic Load Validation
   */
  async expectLoaded() {
    await test.step('Verify Product Page is loaded', async () => {
      await expect(this.nameInput).toBeVisible();
    });
  }

  async gotoCreate() {
    await test.step('Navigate to Create Product', async () => {
      await this.page.goto(`/${DEFAULT_LOCALE}/admin/products/new`);
      await expect(this.page).toHaveURL(TEST_ROUTES.ADMIN.PRODUCT_CREATE);
    });
  }

  async createDraftProduct(name: string, shippingOriginName?: string) {
    await test.step(`Create Draft Product: ${name}`, async () => {
      await this.nameInput.fill(name);
      await this.descriptionInput.fill(
        `Description for ${name} (${DEFAULT_LOCALE})`
      );

      // Slug is required in this project
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await this.slugInput.fill(slug);

      // Fill Logistics (Mandatory for backend)
      await this.weightInput.fill('1.5');
      await this.lengthInput.fill('10');
      await this.widthInput.fill('10');
      await this.heightInput.fill('10');
      await this.originCountryInput.fill('CA');
      await this.hsCodeInput.fill('123456');
      await this.exportExplanationInput.fill('Standard E-commerce Product');

      if (shippingOriginName) {
        // The label is structured as "Name - City, Country"
        const option = this.page
          .locator('#shippingOriginId option')
          .filter({ hasText: shippingOriginName })
          .first();
        const value = await option.getAttribute('value');
        if (value) {
          await this.shippingOriginSelect.selectOption(value);
        }
      }

      // Wait for response to debug potential backend issues
      const responsePromise = this.page
        .waitForResponse(
          res =>
            res.url().includes('/api/admin/products') &&
            ['POST', 'PUT'].includes(res.request().method()),
          { timeout: 10000 }
        )
        .catch(() => null);

      await this.saveButton.click();

      // Rule: Check redirection after save
      // Rule: Check redirection after save (either back to list or to the product detail)
      await this.page.waitForURL(/\/admin\/products(\/[a-zA-Z0-9-]+)?$/);

      const response = await responsePromise;
      if (response && !response.ok()) {
        console.error(
          `API Error: ${response.status()} - ${await response.text()}`
        );
      }
    });
  }

  async verifyProductStatus(status: 'DRAFT' | 'ACTIVE') {
    await test.step(`Verify Product Status is ${status}`, async () => {
      await expect(this.statusSelect).toHaveValue(status);
    });
  }

  async addVariant(price: string, stock: string) {
    await test.step(`Add Variant: Price=${price}, Stock=${stock}`, async () => {
      await this.page.locator('#addVariantBtn').click();
      const variantContainer = this.page.locator('.admin-card-subtle').last();
      await expect(variantContainer).toBeVisible({ timeout: 5000 });

      // Dynamically fill all supported locales
      for (const loc of SUPPORTED_LOCALES) {
        await variantContainer
          .locator(`input[name="variantName_${loc}"]`)
          .fill(`Standard Variant ${loc.toUpperCase()}`);
      }

      // Fill price for the default currency (or all if needed, but here we follow the test logic)
      await variantContainer
        .locator(`input[name="variantPrice_${DEFAULT_CURRENCY}"]`)
        .fill(price);

      await variantContainer.locator('input[name="variantStock"]').fill(stock);

      await this.page.locator('#saveNewVariantsBtn').click();
      await expect(variantContainer).not.toBeVisible({ timeout: 10000 });
      await expect(this.page.locator('.admin-table')).toContainText(
        'Standard Variant',
        { timeout: 10000 }
      );
    });
  }

  async publish() {
    await test.step('Publish Product (Set Status to ACTIVE)', async () => {
      await this.statusSelect.selectOption('ACTIVE');

      const responsePromise = this.page
        .waitForResponse(
          res =>
            res.url().includes('/api/admin/products') &&
            ['POST', 'PUT'].includes(res.request().method()),
          { timeout: 10000 }
        )
        .catch(() => null);

      await this.saveButton.click();
      const response = await responsePromise;
      if (response && !response.ok()) {
        console.error(
          `API Error on Publish: ${response.status()} - ${await response.text()}`
        );
      }
    });
  }

  async verifyStorefront(slug: string) {
    await test.step('Verify Storefront Access', async () => {
      // Small delay to ensure any potential ISR/cache update is processed
      await this.page.waitForTimeout(4000);

      console.log(
        `🌐 Navigating to storefront: /${DEFAULT_LOCALE}/product/${slug}`
      );
      const response = await this.page.goto(
        `/${DEFAULT_LOCALE}/product/${slug}`,
        {
          waitUntil: 'networkidle',
        }
      );

      const status = response?.status();
      console.log(`📊 Storefront response status: ${status}`);

      if (status !== 200) {
        const content = await this.page.textContent('body');
        console.error(
          `❌ Storefront Error Page Content: ${content?.substring(0, 200)}...`
        );
      }

      expect(status).toBe(200);
      await expect(this.page).toHaveURL(new RegExp(`/product/${slug}`));

      // Check for an H1 containing the product slug identifier (E2E Product)
      // We skip the first H1 if it's the logo ("AgTechNest")
      const h1 = this.page.locator('h1').filter({ hasText: /E2E Product/i });
      await expect(h1).toBeVisible({ timeout: 15000 });

      console.log(`✅ Storefront access confirmed for product: ${slug}`);
    });
  }
}
