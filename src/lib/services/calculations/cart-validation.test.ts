import { describe, it, expect, vi } from 'vitest';
import { validateCartForCheckout } from './cart-validation.service';
import { CartProjection } from '@/lib/types/domain/cart';
import { Currency } from '@/lib/types/domain/calculation';

// Mock Logger
vi.mock('@/lib/core/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('CartValidationService', () => {
  const mockCart: CartProjection = {
    id: 'cart-123',
    items: [
      {
        id: 'item-1',
        variantId: 'var-1',
        quantity: 5,
        variant: {
          sku: 'SKU-1',
          pricing: [{ price: 10, currency: 'CAD' }],
          inventory: {
            trackInventory: true,
            stock: 10,
            allowBackorder: false,
          },
        },
      } as any,
    ],
  } as any;

  it('should return valid true if all conditions are met', () => {
    const result = validateCartForCheckout(mockCart, 'CAD' as Currency);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid false if cart is empty', () => {
    const result = validateCartForCheckout(
      { items: [] } as any,
      'CAD' as Currency
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cart is empty');
  });

  it('should return valid false if stock is insufficient', () => {
    const invalidCart = {
      ...mockCart,
      items: [
        {
          ...mockCart.items[0],
          quantity: 15, // More than stock (10)
        },
      ],
    } as any;

    const result = validateCartForCheckout(invalidCart, 'CAD' as Currency);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Insufficient stock');
  });

  it('should return valid true if stock is insufficient but backorder is allowed', () => {
    const backorderCart = {
      items: [
        {
          quantity: 15,
          variant: {
            sku: 'SKU-1',
            pricing: [{ price: 10, currency: 'CAD' }],
            inventory: {
              trackInventory: true,
              stock: 10,
              allowBackorder: true,
            },
          },
        } as any,
      ],
    } as any;

    const result = validateCartForCheckout(backorderCart, 'CAD' as Currency);
    expect(result.valid).toBe(true);
  });

  it('should return valid false if price is missing for the currency', () => {
    const result = validateCartForCheckout(mockCart, 'USD' as Currency);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('No price available');
  });
});
