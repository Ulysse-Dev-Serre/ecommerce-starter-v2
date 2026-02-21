import { describe, it, expect } from 'vitest';
import { formatPrice, getPriceForCurrency, convertCurrency } from './currency';
import { Prisma } from '@/generated/prisma';
import Decimal = Prisma.Decimal;

describe('Currency Utils', () => {
  describe('formatPrice', () => {
    it('should format CAD price correctly in French', () => {
      const result = formatPrice(10.5, 'CAD' as any, 'fr');
      // On s'attend à un formatage québécois standard (symbole à la fin)
      // Note: On utilise [\s\xa0] pour matcher l'espace insécable
      expect(result).toMatch(/10,50[\s\xa0]\$/);
    });

    it('should format USD price correctly in English', () => {
      const result = formatPrice(1234.56, 'USD' as any, 'en');
      expect(result).toContain('$1,234.56');
    });

    it('should handle Decimal amounts from Prisma', () => {
      const amount = new Decimal('99.99');
      const result = formatPrice(amount, 'CAD' as any, 'en');
      expect(result).toContain('$99.99');
    });

    it('should show currency code if requested', () => {
      const result = formatPrice(10, 'CAD' as any, 'en', true);
      expect(result).toContain('CAD');
    });
  });

  describe('getPriceForCurrency', () => {
    const prices = {
      CAD: '100',
      USD: '80',
    };

    it('should return the requested currency if available', () => {
      const result = getPriceForCurrency(prices, 'USD' as any);
      expect(result.price).toBe('80');
      expect(result.currency).toBe('USD');
    });

    it('should throw error if requested is missing (Zero Fallback Policy)', () => {
      expect(() => getPriceForCurrency({ CAD: '100' }, 'USD' as any)).toThrow(
        /PRICING_ERROR/
      );
    });
  });

  describe('convertCurrency', () => {
    it('should convert CAD to USD using the configured rate', () => {
      const amount = 100;
      // Le taux est 0.74 (environ) dans la config
      const result = convertCurrency(amount, 'CAD', 'USD');
      expect(result).toBeGreaterThan(70);
      expect(result).toBeLessThan(80);
    });

    it('should throw error for unknown conversion pairs', () => {
      expect(() => convertCurrency(100, 'EUR', 'JPY')).toThrow(
        /CONVERSION_ERROR/
      );
    });
  });
});
