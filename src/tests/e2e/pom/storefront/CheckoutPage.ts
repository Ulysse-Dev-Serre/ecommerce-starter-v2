import { Page, Locator, expect, test } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  // Address fields
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addressAutocomplete: Locator;
  readonly cityInput: Locator;
  readonly zipInput: Locator;
  readonly stateSelect: Locator;
  readonly confirmAddressBtn: Locator;

  // Shipping
  readonly shippingRateItem: Locator;
  readonly confirmShippingBtn: Locator;

  // Payment
  readonly payNowBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.nameInput = page.locator('[data-testid="checkout-name"]');
    this.emailInput = page.locator('[data-testid="checkout-email"]');
    this.phoneInput = page.locator('[data-testid="checkout-phone"]');
    this.addressAutocomplete = page.locator(
      '[data-testid="address-autocomplete-input"]'
    );
    this.cityInput = page.locator('[data-testid="checkout-city"]');
    this.zipInput = page.locator('[data-testid="checkout-zip"]');
    this.stateSelect = page.locator('[data-testid="checkout-state"]');
    this.confirmAddressBtn = page.locator(
      '[data-testid="confirm-address-button"]'
    );

    this.shippingRateItem = page.locator('[data-testid="shipping-rate-item"]');
    this.confirmShippingBtn = page.locator(
      '[data-testid="confirm-shipping-button"]'
    );

    this.payNowBtn = page.locator('[data-testid="pay-now-button"]');
  }

  async fillShippingDetails(details: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    state: string;
  }) {
    await test.step('Fill Shipping Address', async () => {
      await this.nameInput.fill(details.name);
      await this.emailInput.fill(details.email);
      await this.phoneInput.fill(details.phone);
      await this.addressAutocomplete.fill(details.address);
      await this.cityInput.fill(details.city);
      await this.zipInput.fill(details.zip);
      await this.stateSelect.selectOption(details.state);

      await this.confirmAddressBtn.click();
    });
  }

  async selectShippingRate() {
    await test.step('Select Shipping Rate', async () => {
      await expect(this.shippingRateItem.first()).toBeVisible({
        timeout: 15000,
      });
      await this.shippingRateItem.first().click();

      const intentResponse = this.page.waitForResponse(
        res => res.url().includes('update-intent') && res.status() === 200
      );
      await this.confirmShippingBtn.click();
      await intentResponse;
    });
  }

  async payWithStripeCard(
    cardNumber: string,
    expiry: string = '1228',
    cvc: string = '123'
  ) {
    await test.step(`Pay with Stripe Card: ${cardNumber}`, async () => {
      // Identifier l'iframe de paiement Stripe
      const stripeFrame = this.page
        .frameLocator(
          'iframe[title*="Secure payment"], iframe[src*="js.stripe.com"]'
        )
        .first();

      // Attendre que l'onglet "Card/Carte" soit visible s'il existe
      const cardTabInside = stripeFrame
        .locator('button[role="tab"]')
        .filter({ hasText: /Card|Carte/i });
      if (await cardTabInside.isVisible({ timeout: 10000 })) {
        await cardTabInside.click();
      }

      // Sélecteurs ultra-robustes pour les champs Stripe (compatibles Elements et Payment Element)
      const numberInput = stripeFrame
        .locator(
          'input#Field-numberInput, input#number, input[name="number"], input[placeholder*="Card number"]'
        )
        .first();
      const expiryInput = stripeFrame
        .locator(
          'input#Field-expiryInput, input#expiry, input[name="expiry"], input[placeholder*="MM / YY"]'
        )
        .first();
      const cvcInput = stripeFrame
        .locator(
          'input#Field-cvcInput, input#cvc, input[name="cvc"], input[placeholder*="CVC"]'
        )
        .first();

      // Attendre la visibilité avant de remplir
      await expect(numberInput).toBeVisible({ timeout: 20000 });

      await numberInput.fill(cardNumber);
      await expiryInput.fill(expiry);
      await cvcInput.fill(cvc);

      // Cliquer sur le bouton de commande final (qui est dans la page principale)
      await expect(this.payNowBtn).toBeEnabled();
      await this.payNowBtn.click();
    });
  }

  async expectOrderSuccess() {
    await test.step('Expect Order Success Redirect', async () => {
      await expect(this.page).toHaveURL(/checkout\/success|orders\/ORD/, {
        timeout: 60000,
      });
    });
  }

  async expectPaymentError(regex: RegExp = /decline|refus|error|erreur/i) {
    await test.step('Expect Payment Error Message', async () => {
      const toastError = this.page.locator(
        '[data-testid="toast-notification"]'
      );
      await Promise.race([
        expect(toastError).toBeVisible({ timeout: 20000 }),
        expect(this.page.getByText(regex)).toBeVisible({ timeout: 20000 }),
      ]);
    });
  }
}
