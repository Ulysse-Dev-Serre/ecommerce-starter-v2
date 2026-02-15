import { type Page, type Locator, expect, test } from '@playwright/test';
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
  readonly incotermInput: Locator;
  readonly exportExplanationInput: Locator;
  readonly shippingOriginSelect: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators strictly defined in constructor as per checklist
    this.saveButton = page
      .getByRole('button', { name: /Save|Enregistrer/i })
      .last();
    this.nameInput = page.locator('#product-name-en');
    this.descriptionInput = page.locator('#product-description-en');
    this.slugInput = page.getByPlaceholder('product-url-slug');
    this.statusSelect = page.locator('#statusSelect');

    this.addVariantButton = page.getByRole('button', {
      name: /Add Variant|Ajouter une variante/i,
    });
    this.priceInput = page.getByLabel(/Price|Prix/i);
    this.skuInput = page.getByLabel(/SKU/i);
    this.stockInput = page.getByLabel(/Stock|Quantité/i);

    // Shipping & Logistics
    this.weightInput = page.locator('#weight');
    this.lengthInput = page.locator('#length');
    this.widthInput = page.locator('#width');
    this.heightInput = page.locator('#height');
    this.originCountryInput = page.locator('#originCountry');
    this.hsCodeInput = page.locator('#hsCode');
    this.incotermInput = page.locator('#incoterm');
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
      await this.page.goto('/en/admin/products/new');
      await expect(this.page).toHaveURL(TEST_ROUTES.ADMIN.PRODUCT_CREATE);
    });
  }

  async createDraftProduct(name: string, shippingOriginName?: string) {
    await test.step(`Create Draft Product: ${name}`, async () => {
      await this.nameInput.fill(name);
      await this.descriptionInput.fill(`Description for ${name}`);

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
      await this.incotermInput.fill('EXW');
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
      await this.page.waitForURL(/\/admin\/products\/[a-zA-Z0-9-]+$/);

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
      const variantContainer = this.page
        .locator('div.rounded-lg.border.bg-gray-50')
        .last();
      await expect(variantContainer).toBeVisible({ timeout: 5000 });

      await variantContainer
        .locator('input[name="variantNameEN"]')
        .fill('Standard Variant');
      await variantContainer
        .locator('input[name="variantNameFR"]')
        .fill('Variante Standard');
      await variantContainer
        .locator('input[name="variantPrice_CAD"]')
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
      // Navigate directly (no tab handling for simplicity)
      await this.page.goto(`/en/products/${slug}`);
      await expect(this.page).toHaveURL(new RegExp(`/products/${slug}`));
      // Check if status is 200 via any element (e.g. h1 with slug/name)
      await expect(this.page.locator('h1')).toBeVisible();
      console.log(`✅ Storefront access confirmed for product: ${slug}`);
    });
  }
}
