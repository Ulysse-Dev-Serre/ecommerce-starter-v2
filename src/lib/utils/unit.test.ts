import { describe, it, expect } from 'vitest';
import { formatWeight, formatDimensions } from './unit';
import { Prisma } from '@/generated/prisma';
import Decimal = Prisma.Decimal;

describe('Unit Utils', () => {
  describe('formatWeight', () => {
    it('should format number weight with kg suffix', () => {
      expect(formatWeight(1.5)).toBe('1.5 kg');
    });

    it('should handle Decimal weights from Prisma', () => {
      const weight = new Decimal('2.75');
      expect(formatWeight(weight)).toBe('2.75 kg');
    });

    it('should return empty string for zero or null weight', () => {
      expect(formatWeight(0)).toBe('');
      expect(formatWeight(null)).toBe('');
      expect(formatWeight(undefined)).toBe('');
    });
  });

  describe('formatDimensions', () => {
    it('should format dimension object with cm suffix', () => {
      const dimensions = { length: 10, width: 20, height: 15 };
      expect(formatDimensions(dimensions)).toBe('10 x 20 x 15 cm');
    });

    it('should handle missing dimensions by defaulting to 0', () => {
      const dimensions = { length: 10, width: 20 };
      expect(formatDimensions(dimensions)).toBe('10 x 20 x 0 cm');
    });

    it('should return empty string if all dimensions are zero', () => {
      expect(formatDimensions({ length: 0, width: 0, height: 0 })).toBe('');
      expect(formatDimensions(null)).toBe('');
    });
  });
});
