import { describe, it, expect } from 'vitest';
import { createIntentSchema, updateIntentSchema } from './checkout';

describe('Checkout Validators', () => {
  describe('createIntentSchema', () => {
    it('should validate with cartId', () => {
      const result = createIntentSchema.safeParse({
        cartId: 'cart_123',
        currency: 'CAD',
      });
      expect(result.success).toBe(true);
    });

    it('should validate with directItem', () => {
      const result = createIntentSchema.safeParse({
        directItem: { variantId: 'var_123', quantity: 1 },
        currency: 'CAD',
      });
      expect(result.success).toBe(true);
    });

    it('should fail if neither cartId nor directItem is provided', () => {
      const result = createIntentSchema.safeParse({ currency: 'CAD' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateIntentSchema', () => {
    it('should validate valid update payload', () => {
      const valid = {
        paymentIntentId: 'pi_123',
        shippingRate: { objectId: 'rate_123', amount: 100 },
        shippingDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          street1: '123 Main St',
          city: 'Montreal',
          state: 'QC',
          zip: 'H1H1H1',
          country: 'CA',
        },
      };
      const result = updateIntentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should require shipping rate ID', () => {
      const invalid = {
        paymentIntentId: 'pi_123',
        shippingRate: { amount: 100 }, // Missing objectId
      };
      const result = updateIntentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
