import { describe, it, expect } from 'vitest';
import { CreateProductSchema, DimensionsSchema } from './product';

describe('Product Validators', () => {
  describe('DimensionsSchema', () => {
    it('should validate correct numeric values', () => {
      const data = { length: 10, width: 20, height: 30 };
      const result = DimensionsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate string numbers (from form inputs)', () => {
      const data = { length: '10.5', width: '20', height: '30.2' };
      const result = DimensionsSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(10.5);
      }
    });

    it('should reject non-numeric strings', () => {
      const data = { length: 'abc', width: '!!!', height: ' ' };
      const result = DimensionsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.length?._errors).toContain('Must be a positive number');
      }
    });

    it('should reject missing fields (mandatory for Shippo)', () => {
      const data = { length: 10 };
      const result = DimensionsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProductSchema', () => {
    const validBaseData = {
      slug: 'test-product',
      status: 'DRAFT',
      translations: [{ language: 'en', name: 'Test Product' }],
      originCountry: 'CN',
      hsCode: '123456',
      exportExplanation: 'Electronic component',
      shippingOriginId: 'cld123456789012345678901', // Fake CUID
      weight: '1.5',
      dimensions: {
        length: '10',
        width: '10',
        height: '10',
      },
    };

    it('should accept valid product data', () => {
      const result = CreateProductSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });

    it('should reject missing mandatory shipping fields', () => {
      const fieldsToTester = [
        'originCountry',
        'hsCode',
        'exportExplanation',
        'shippingOriginId',
        'weight',
        'dimensions',
      ];

      fieldsToTester.forEach(field => {
        const data = { ...validBaseData };
        delete (data as any)[field];
        const result = CreateProductSchema.safeParse(data);
        expect(result.success, `Should fail without ${field}`).toBe(false);
      });
    });

    it('should reject invalid originCountry', () => {
      const result = CreateProductSchema.safeParse({
        ...validBaseData,
        originCountry: 'USA',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weight <= 0', () => {
      const result = CreateProductSchema.safeParse({
        ...validBaseData,
        weight: '0',
      });
      expect(result.success).toBe(false);
    });
  });
});
