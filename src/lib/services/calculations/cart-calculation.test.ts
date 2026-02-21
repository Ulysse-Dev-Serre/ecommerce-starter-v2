import { describe, it, expect, vi } from 'vitest';
import {
  calculateCart,
  getPrice,
  serializeCalculation,
} from './cart-calculation.service';
import { Prisma } from '@/generated/prisma';
import Decimal = Prisma.Decimal;
import { CartProjection } from '@/lib/types/domain/cart';
import { Currency } from '@/lib/types/domain/calculation';

// Mock Logger
vi.mock('@/lib/core/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CartCalculationService', () => {
  describe('getPrice', () => {
    const pricing = [
      { price: new Decimal(100), currency: 'CAD' },
      { price: new Decimal(80), currency: 'USD' },
    ];

    it('should return the correct price for a supported currency', () => {
      const result = getPrice(pricing, 'CAD' as Currency);
      expect(result?.price.toString()).toBe('100');
      expect(result?.currency).toBe('CAD');
    });

    it('should return null for an unsupported currency', () => {
      const result = getPrice(pricing, 'EUR' as any);
      expect(result).toBeNull();
    });
  });

  describe('calculateCart', () => {
    const mockCart: CartProjection = {
      id: 'cart-123',
      userId: 'user-123',
      anonymousId: null,
      status: 'ACTIVE',
      currency: 'CAD',
      items: [
        {
          id: 'item-1',
          variantId: 'var-1',
          quantity: 2,
          variant: {
            sku: 'SKU-1',
            pricing: [{ price: 50, currency: 'CAD' }],
            product: {
              translations: [{ name: 'Product 1', locale: 'en' }],
            },
          } as any,
        },
        {
          id: 'item-2',
          variantId: 'var-2',
          quantity: 1,
          variant: {
            sku: 'SKU-2',
            pricing: [{ price: 30, currency: 'CAD' }],
            product: {
              translations: [{ name: 'Product 2', locale: 'en' }],
            },
          } as any,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should calculate the total correctly for CAD', () => {
      const result = calculateCart(mockCart, 'CAD' as Currency);

      expect(result.subtotal.toString()).toBe('130'); // (2 * 50) + (1 * 30)
      expect(result.itemCount).toBe(3);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].lineTotal.toString()).toBe('100');
    });

    it('should handle missing prices by skipping items and logging an error', () => {
      const result = calculateCart(mockCart, 'USD' as Currency);
      expect(result.subtotal.toString()).toBe('0');
      expect(result.itemCount).toBe(0);
    });
  });

  describe('serializeCalculation', () => {
    it('should convert Decimals and Dates to strings', () => {
      const calculation = {
        currency: 'CAD' as Currency,
        items: [
          {
            cartItemId: '1',
            unitPrice: new Decimal(10),
            lineTotal: new Decimal(20),
            quantity: 2,
            sku: 'S1',
            productName: 'P1',
            variantId: 'V1',
            currency: 'CAD' as Currency,
          },
        ],
        subtotal: new Decimal(20),
        itemCount: 2,
        calculatedAt: new Date('2024-02-03T10:00:00Z'),
      };

      const result = serializeCalculation(calculation);
      expect(result.subtotal).toBe('20');
      expect(result.items[0].unitPrice).toBe('10');
      expect(result.calculatedAt).toBe('2024-02-03T10:00:00.000Z');
    });
  });
});
