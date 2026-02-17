import { describe, it, expect } from 'vitest';
import { cartCalculationSchema } from './cart';

describe('Cart Validator', () => {
  it('should accept valid currencies', () => {
    const validData = { currency: 'CAD' };
    const result = cartCalculationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('CAD');
    }
  });

  it('should reject invalid currencies with a friendly message', () => {
    const invalidData = { currency: 'EUR' };
    const result = cartCalculationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid option');
    }
  });

  it('should reject missing currency', () => {
    const invalidData = {};
    const result = cartCalculationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
