import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  // These tests use the STORAGE_STATE defined in playwright.config.ts (logged in)

  test('Access Dashboard and Verify Elements', async ({ page }) => {
    // 1. Go directly to admin dashboard
    await page.goto('/en/admin');

    // 2. Verify URL
    await expect(page).toHaveURL(/.*\/admin/);

    // 3. Verify core dashboard elements
    // The title in en.json under adminDashboard.dashboard.title is "Dashboard"
    // We use a broader selector for the header
    const mainTitle = page.locator('h1').first();
    await expect(mainTitle).toBeVisible({ timeout: 15000 });
    const titleText = await mainTitle.innerText();
    expect(titleText).toMatch(/Dashboard|Tableau de bord|Admin Panel/);

    // ✅ Test passes if admin dashboard loads with correct title
  });
});
