import { Page, Locator, expect, test } from '@playwright/test';

export class OrderDetailsPage {
  readonly page: Page;
  readonly statusBadge: Locator;
  readonly initialCancelBtn: Locator;
  readonly reasonTextarea: Locator;
  readonly confirmCancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusBadge = page.locator('.vibe-badge');

    // Selectors for cancellation flow
    this.initialCancelBtn = page.locator('button').filter({
      hasText:
        /Cancel delivery|Annuler la livraison|Need a refund\?|Besoin d'un remboursement\?/i,
    });

    this.reasonTextarea = page.locator('textarea');

    this.confirmCancelBtn = page.locator('button').filter({
      hasText:
        /Cancel my order|Annuler ma commande|Send Request|Envoyer la demande/i,
    });
  }

  async goto(orderId: string) {
    await test.step('Navigate to Order Details', async () => {
      await this.page.goto(`/en/orders/${orderId}`);
      await expect(this.page).toHaveURL(new RegExp(`/orders/${orderId}`));
    });
  }

  async requestCancellation(reason: string = 'E2E Test Cancellation') {
    await test.step('Request Order Cancellation', async () => {
      await expect(this.initialCancelBtn.first()).toBeVisible({
        timeout: 15000,
      });
      await this.initialCancelBtn.first().click();

      // If a reason is required (Refund Request form)
      if (
        await this.reasonTextarea
          .isVisible({ timeout: 3000 })
          .catch(() => false)
      ) {
        await this.reasonTextarea.fill(reason);
      }

      await expect(this.confirmCancelBtn.first()).toBeVisible({
        timeout: 5000,
      });

      // Handle the browser confirm dialog
      this.page.once('dialog', dialog => dialog.accept());

      // Wait for the specific API call
      const cancelResponse = this.page.waitForResponse(
        res =>
          res.url().includes('/api/orders/refund-request') &&
          res.status() === 200,
        { timeout: 30000 }
      );

      await this.confirmCancelBtn.first().click();
      await cancelResponse;
    });
  }

  async expectStatus(statusTextRegex: RegExp) {
    await test.step(`Verify Order Status matches ${statusTextRegex}`, async () => {
      await expect(this.statusBadge.first()).toContainText(statusTextRegex, {
        timeout: 15000,
      });
    });
  }
}
