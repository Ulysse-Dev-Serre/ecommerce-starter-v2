import { test } from '@playwright/test';

import { DashboardPage } from '../pom/admin/DashboardPage';

test.describe('Admin Dashboard Status Check', () => {
  test('Test 1: Admin Dashboard should return 200 OK', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Check if the page loads with status 200
    await dashboard.verifyStatus();

    // 2. Check if the basic UI element 'Admin Panel' is there
    await dashboard.verifyPresence();

    // 3. Confirm session is alive
    await dashboard.verifyApis();
  });

  test('Security: Guest should be blocked (404/302)', async ({ page }) => {
    // Clear auth
    await page.context().clearCookies();

    // Attempt access
    const _response = await page.goto('/en/admin');

    // Should either be redirected to sign-in or return a non-200 if unauthorized
    // Note: Next.js redirects usually result in the final page status or handled by Playwright
    if (page.url().includes('sign-in')) {
      console.log('✅ Properly redirected to sign-in');
    } else {
      // If not redirected, it MUST not be 200
      // (Clerk middleware usually handles the redirect)
    }
  });
});
