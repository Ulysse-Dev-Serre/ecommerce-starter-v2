/**
 * Zod validation schemas for Product API
 * Ensures data integrity for e-commerce operations
 */

import { z } from 'zod';

const LANGUAGES = ['EN', 'FR', 'ES', 'DE', 'IT'] as const;
const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ProductTranslationSchema = z.object({
  language: z.enum(LANGUAGES, {
    message: 'Language must be EN, FR, ES, DE, or IT',
  }),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  shortDescription: z
    .string()
    .max(500, 'Short description must be less than 500 characters')
    .optional()
    .nullable(),
  metaTitle: z
    .string()
    .max(70, 'Meta title must be less than 70 characters for SEO')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(160, 'Meta description must be less than 160 characters for SEO')
    .optional()
    .nullable(),
});

export const CreateProductSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(
      slugRegex,
      'Slug must be lowercase with hyphens only (e.g., my-product)'
    ),
  status: z.enum(PRODUCT_STATUSES).optional().default('DRAFT'),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z
    .number()
    .int()
    .min(0, 'Sort order must be >= 0')
    .optional()
    .default(0),
  originCountry: z
    .string()
    .length(2, 'Origin country must be a 2-letter ISO code')
    .toUpperCase()
    .optional()
    .nullable(),
  hsCode: z.string().optional().nullable(),
  exportExplanation: z.string().optional().nullable(),
  incoterm: z.string().optional().nullable(),
  translations: z
    .array(ProductTranslationSchema)
    .min(1, 'At least one translation is required')
    .optional(),
});

export const UpdateProductSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug cannot be empty')
    .max(100, 'Slug must be less than 100 characters')
    .regex(slugRegex, 'Slug must be lowercase with hyphens only')
    .optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0, 'Sort order must be >= 0').optional(),
  originCountry: z
    .string()
    .length(2, 'Origin country must be a 2-letter ISO code')
    .toUpperCase()
    .optional()
    .nullable(),
  hsCode: z.string().optional().nullable(),
  shippingOriginId: z.string().cuid().or(z.literal('')).optional().nullable(),
  exportExplanation: z.string().optional().nullable(),
  incoterm: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  dimensions: z
    .object({
      length: z.string().or(z.number()),
      width: z.string().or(z.number()),
      height: z.string().or(z.number()),
      unit: z.string().optional(),
    })
    .optional()
    .nullable(),
  translations: z.array(ProductTranslationSchema).optional(),
});

export const VariantPricingSchema = z.object({
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price must be less than 1,000,000'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code (e.g., CAD, USD, EUR)')
    .toUpperCase()
    .default('CAD'),
  compareAtPrice: z
    .number()
    .positive('Compare at price must be greater than 0')
    .optional()
    .nullable(),
  costPrice: z.number().min(0, 'Cost price must be >= 0').optional().nullable(),
});

export const VariantInventorySchema = z.object({
  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  lowStockThreshold: z
    .number()
    .int()
    .min(0, 'Low stock threshold must be >= 0')
    .default(5),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
});

export const CreateVariantSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens'),
  pricing: VariantPricingSchema,
  inventory: VariantInventorySchema.optional(),
  attributeValueIds: z.array(z.string().cuid()).optional(),
});

export const UpdateVariantSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU cannot be empty')
    .max(50, 'SKU must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens')
    .optional(),
  pricing: VariantPricingSchema.partial().optional(),
  inventory: VariantInventorySchema.partial().optional(),
});

export const CreateVariantsManualSchema = z.object({
  generate: z.literal(false).optional(),
  variants: z
    .array(CreateVariantSchema)
    .min(1, 'At least one variant is required'),
});

export const CreateVariantsAutoSchema = z.object({
  generate: z.literal(true),
  config: z.object({
    attributeId: z.string().min(1, 'Attribute ID is required'),
    defaultPricing: VariantPricingSchema,
    defaultInventory: VariantInventorySchema.optional(),
    skuPattern: z.string().optional(),
  }),
});

export const CreateVariantsSchema = z.union([
  CreateVariantsManualSchema,
  CreateVariantsAutoSchema,
]);

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
export type CreateVariantsInput = z.infer<typeof CreateVariantsSchema>;
export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;

export function formatZodErrors(
  error: z.ZodError
): { field: string; message: string }[] {
  const issues = error.issues || [];
  return issues.map(err => ({
    field: err.path?.join('.') || '',
    message: err.message,
  }));
}
