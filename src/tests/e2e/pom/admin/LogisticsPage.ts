import { type Page, type Locator, expect, test } from '@playwright/test';
import { TEST_ROUTES } from '../../config/routes';

export interface LocationData {
  name: string;
  type: string; // 'LOCAL_STOCK' | 'DROPSHIPPER' | 'OTHER'
  address: {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string; // ISO 2 char
    email: string;
    phone: string;
  };
}

/**
 * Logistics Management Page
 */
export class LogisticsPage {
  readonly page: Page;
  readonly addLocationButton: Locator;
  readonly saveButton: Locator;

  // Form Inputs
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly senderNameInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipInput: Locator;
  readonly countryInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addLocationButton = page
      .getByRole('button', { name: /Add Location|Ajouter un emplacement/i })
      .first();
    this.saveButton = page.getByRole('button', { name: /Save|Enregistrer/i });

    // Using robust IDs added previously
    this.nameInput = page.locator('#logistics-name');
    this.typeSelect = page.locator('#logistics-type'); // Select by ID as confirmed in source code

    this.senderNameInput = page.locator('#logistics-sender-name');
    this.streetInput = page.locator('#logistics-street');
    this.cityInput = page.locator('#logistics-city');
    this.stateInput = page.locator('#logistics-state');
    this.zipInput = page.locator('#logistics-zip');
    this.countryInput = page.locator('#logistics-country');
    this.emailInput = page.locator('#logistics-email');
    this.phoneInput = page.locator('#logistics-phone');
  }

  async goto() {
    await test.step('Navigate to Logistics Page', async () => {
      await this.page.goto('/en/admin/logistics'); // Assuming default locale
      await this.expectLoaded();
    });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(TEST_ROUTES.ADMIN.LOGISTICS);
    // No visual regression as requested
  }

  async openAddLocationModal() {
    await test.step('Open Add Location Modal', async () => {
      await this.addLocationButton.click();
      await expect(this.nameInput).toBeVisible();
    });
  }

  async fillLocationForm(data: LocationData) {
    await test.step(`Fill Location Form: ${data.name}`, async () => {
      await this.nameInput.fill(data.name);
      // Handle select specifically
      await this.typeSelect.selectOption(data.type);

      await this.senderNameInput.fill(data.address.name);
      await this.streetInput.fill(data.address.street1);
      await this.cityInput.fill(data.address.city);
      await this.stateInput.fill(data.address.state);
      await this.zipInput.fill(data.address.zip);
      await this.countryInput.fill(data.address.country);
      await this.emailInput.fill(data.address.email);
      await this.phoneInput.fill(data.address.phone);
    });
  }

  async save() {
    await test.step('Save Location', async () => {
      // Wait for response to debug API failures
      const responsePromise = this.page
        .waitForResponse(
          res =>
            res.url().includes('/api/admin/logistics/locations') &&
            res.request().method() === 'POST',
          { timeout: 10000 }
        )
        .catch(() => null);

      await this.saveButton.click();

      // Wait for modal to close = success
      await expect(this.nameInput).not.toBeVisible({ timeout: 10000 });

      // Log API error if any (for debugging without failing test immediately if UI recovers)
      const response = await responsePromise;
      if (response && !response.ok()) {
        console.error(
          `API Error on Save: ${response.status()} - ${await response.text()}`
        );
      }
    });
  }

  async expectLocationCreated(name: string) {
    await test.step(`Verify Location Created: ${name}`, async () => {
      await this.page.reload();
      await expect(this.page.getByText(name).first()).toBeVisible();
    });
  }
}
