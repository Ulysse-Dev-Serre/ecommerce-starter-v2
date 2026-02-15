import { Page, Locator, expect, test } from '@playwright/test';

export class AdminOrderPage {
  readonly page: Page;
  readonly statusBadge: Locator;
  readonly shipBtn: Locator;
  readonly transitBtn: Locator;
  readonly deliverBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusBadge = page.locator('.vibe-badge');

    this.shipBtn = page.locator('button').filter({
      hasText: /MARK AS SHIPPED|MARQUER EXPÉDIÉE/i,
    });
    this.transitBtn = page.locator('button').filter({
      hasText: /MARK AS IN TRANSIT|MARQUER EN COURS/i,
    });
    this.deliverBtn = page.locator('button').filter({
      hasText: /MARK AS DELIVERED|MARQUER LIVRÉE/i,
    });
  }

  async goto(orderId: string) {
    await test.step('Navigate to Admin Order Details', async () => {
      await this.page.goto(`/en/admin/orders/${orderId}`);
    });
  }

  async markAsShipped() {
    await test.step('Admin: Mark as Shipped', async () => {
      await expect(this.shipBtn).toBeVisible();
      this.page.once('dialog', dialog => dialog.accept());
      await this.shipBtn.click();
      await expect(this.statusBadge).toContainText(/Shipped|Expédiée/i, {
        timeout: 15000,
      });
      await this.page.waitForLoadState('networkidle');
    });
  }

  async markAsInTransit() {
    await test.step('Admin: Mark as In Transit', async () => {
      await expect(this.transitBtn).toBeVisible();
      this.page.once('dialog', dialog => dialog.accept());
      await this.transitBtn.click();
      await expect(this.statusBadge).toContainText(/In Transit|En cours|way/i, {
        timeout: 15000,
      });
      await this.page.waitForLoadState('networkidle');
    });
  }

  async markAsDelivered() {
    await test.step('Admin: Mark as Delivered', async () => {
      await expect(this.deliverBtn).toBeVisible();
      this.page.once('dialog', dialog => dialog.accept());
      await this.deliverBtn.click();
      await expect(this.statusBadge).toContainText(/Delivered|Livrée/i, {
        timeout: 15000,
      });
      await this.page.waitForLoadState('networkidle');
    });
  }

  async expectBadge(regex: RegExp) {
    await test.step(`Verify Order Badge matches ${regex}`, async () => {
      await expect(this.statusBadge.first()).toContainText(regex);
    });
  }
}
