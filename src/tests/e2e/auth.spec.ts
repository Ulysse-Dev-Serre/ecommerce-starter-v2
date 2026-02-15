import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Use the default storage state (logged in as admin)

  test('Logout Scenario', async ({ page }) => {
    // 1. Start from homepage (En) where we are logged in
    await page.goto('/en');

    // 2. Open User Button / Profile
    // Identifying by Clerk class for accuracy
    const userButton = page.locator('.cl-userButtonTrigger');
    await userButton.waitFor({ state: 'visible' });
    await userButton.click();

    // 3. Click Sign Out
    // Using common Clerk button locator pattern
    await page.click(
      'button.cl-userButtonPopoverActionButton[data-variant="ghost"]:has-text("Sign out"), button:has-text("Sign out"), button:has-text("Se déconnecter")'
    );

    // 4. Verify redirection and guest state
    // Clerk might redirect to home or sign-in. Let's wait for URL to stabilize.
    await page.waitForURL('**/en');

    // The Sign In button should reappear
    await expect(
      page.locator(
        'button:has-text("Sign in"), button:has-text("Se connecter")'
      )
    ).toBeVisible();
    await expect(userButton).not.toBeVisible();
  });
});
