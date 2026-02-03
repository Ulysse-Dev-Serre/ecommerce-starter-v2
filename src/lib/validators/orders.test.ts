import { describe, it, expect } from 'vitest';
import { manualRefundValidation } from './orders';

describe('Order Validators', () => {
  describe('manualRefundValidation', () => {
    it('should validate complete refund request', () => {
      const valid = {
        orderId: 'ord_123',
        reason: 'Product damaged in shipping',
      };
      const result = manualRefundValidation.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail on short reason', () => {
      const invalid = { orderId: 'ord_123', reason: 'Bad' }; // < 10 chars
      const result = manualRefundValidation.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail on missing orderId', () => {
      const invalid = { reason: 'Product damaged in shipping' };
      const result = manualRefundValidation.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
