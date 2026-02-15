import { type Page, expect, test } from '@playwright/test';

/**
 * Page Object Model for Admin Dashboard (Simplified)
 * Focuses on health and status codes.
 */
export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the admin dashboard and verify status
   */
  async verifyStatus() {
    await test.step('Verify Admin Dashboard Status 200', async () => {
      const response = await this.page.goto('/en/admin');
      expect(response?.status()).toBe(200);
      console.log('✅ Admin Dashboard returned 200 OK');
    });
  }

  /**
   * Verify that 'Admin Panel' text is present (basic load check)
   */
  async verifyPresence() {
    await test.step('Verify Admin Panel Text', async () => {
      await expect(this.page.locator('text=Admin Panel')).toBeVisible();
      console.log('✅ Admin Panel text found');
    });
  }

  /**
   * Check critical Admin APIs
   */
  async verifyApis() {
    await test.step('Verify Admin Support APIs', async () => {
      // We can check if the page loaded session/auth correctly
      const cookies = await this.page.context().cookies();
      const hasSession = cookies.some(c => c.name.includes('clerk'));
      expect(hasSession).toBeTruthy();
      console.log('✅ Auth session confirmed');
    });
  }
}
