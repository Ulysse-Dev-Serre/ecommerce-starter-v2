import { Page, Locator, expect, test } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly addToCartBtn: Locator;
  readonly checkoutBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartBtn = page.locator('[data-testid="add-to-cart-button"]');
    this.checkoutBtn = page.locator('[data-testid="checkout-button"]');
  }

  async addProductToCart(slug: string) {
    await test.step(`Add product ${slug} to cart`, async () => {
      await this.page.goto(`/en/product/${slug}`);
      await expect(this.addToCartBtn).toBeVisible();
      await this.addToCartBtn.click();
    });
  }

  async goToCart() {
    await test.step('Navigate to Cart page', async () => {
      await this.page.goto('/en/cart');
      // Sometimes multiple clicks or wait is needed due to hydration
      await expect(this.checkoutBtn).toBeVisible({ timeout: 10000 });
    });
  }

  async proceedToCheckout() {
    await test.step('Proceed to Checkout', async () => {
      await this.checkoutBtn.click();
      await expect(this.page).toHaveURL(/\/checkout/);
    });
  }
}
