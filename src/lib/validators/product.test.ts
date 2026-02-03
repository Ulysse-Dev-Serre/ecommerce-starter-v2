import { describe, it, expect } from 'vitest';
import {
  productSlugSchema,
  productSearchSchema,
  CreateProductSchema,
  CreateProductInput,
} from './product';

describe('Product Validators', () => {
  describe('productSlugSchema', () => {
    it('should validate valid slug', () => {
      const result = productSlugSchema.safeParse({ id: 'valid-slug-123' });
      expect(result.success).toBe(true);
    });

    it('should validate valid slug with language', () => {
      const result = productSlugSchema.safeParse({
        id: 'valid-slug',
        language: 'en',
      });
      expect(result.success).toBe(true);
    });

    it('should fail on empty slug', () => {
      const result = productSlugSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('should fail on invalid language', () => {
      const result = productSlugSchema.safeParse({
        id: 'slug',
        language: 'DE',
      }); // DE not supported
      expect(result.success).toBe(false);
    });
  });

  describe('productSearchSchema', () => {
    it('should use default values', () => {
      const result = productSearchSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.status).toBe('ACTIVE');
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should coerce numbers', () => {
      const result = productSearchSchema.parse({ page: '2', limit: '50' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should handle boolean strings for featured', () => {
      expect(productSearchSchema.parse({ featured: 'true' }).featured).toBe(
        true
      );
      expect(productSearchSchema.parse({ featured: 'false' }).featured).toBe(
        false
      );
      expect(productSearchSchema.parse({ featured: true }).featured).toBe(true);
    });

    it('should cap limit at 100', () => {
      expect(() => productSearchSchema.parse({ limit: 150 })).toThrow();
    });
  });

  describe('CreateProductSchema', () => {
    it('should validate a valid product', () => {
      const validProduct: CreateProductInput = {
        slug: 'new-product',
        status: 'DRAFT',
        isFeatured: false,
        sortOrder: 0,
        translations: [
          { language: 'en', name: 'Product', description: 'Desc' },
        ],
        weight: 1.5,
        dimensions: { length: 10, width: 10, height: 10, unit: 'cm' },
      };
      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should auto-convert string numbers for weight/dimensions', () => {
      const validProduct = {
        slug: 'numeric-convert',
        translations: [{ language: 'en', name: 'P' }],
        weight: '1.5',
        dimensions: { length: '10.5', width: 10, height: 10 },
      };
      const result = CreateProductSchema.parse(validProduct);
      expect(result.weight).toBe(1.5);
      expect(result.dimensions?.length).toBe(10.5);
    });

    it('should fail on invalid slug format', () => {
      const invalid = {
        slug: 'Must Be Lowercase',
        translations: [{ language: 'en', name: 'P' }],
      };
      const result = CreateProductSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
