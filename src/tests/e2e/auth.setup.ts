import { test as setup, expect } from '@playwright/test';

import { STORAGE_STATE } from '../../../playwright.config';

/**
 * Setup script for Authentication E2E
 * Uses @clerk/testing to handle authentication robustly.
 */
setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set in environment'
    );
  }

  // 1. Start from Homepage (English preferred for consistent default selectors)
  await page.goto('/en');

  // 2. Click the Sign In button in the Navbar
  const signInButton = page.locator(
    'button:has-text("Sign in"), button:has-text("Connexion")'
  );
  await signInButton.click();

  // 3. Clerk Modal Interaction- Step 1: Email
  // Clerks identifiers are usually very specific, but we'll use name/tag for robustness
  const emailInput = page.locator('input[name="identifier"]');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(email);

  // Click continue
  await page.click('button.cl-formButtonPrimary');

  // Step 2: Password
  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  await passwordInput.fill(password);

  // Final Sign In
  await page.click('button.cl-formButtonPrimary');

  // 4. Wait for redirection back to site and presence of User Button
  await page.waitForURL('**/en', { timeout: 30000 });

  // Verify that we are indeed signed in by checking if UserButton is visible
  // The UserButton trigger has clear Clerk classes
  await expect(page.locator('.cl-userButtonTrigger')).toBeVisible({
    timeout: 20000,
  });

  // 5. Save the storage state
  await page.context().storageState({ path: STORAGE_STATE });
});
