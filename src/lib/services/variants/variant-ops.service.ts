import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { DEFAULT_CURRENCY } from '@/lib/config/site';
import { i18n } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { cleanupOrphanedAttributes } from '../attributes/attribute-cleanup.service';
import {
  SimpleVariantData,
  CreateVariantData,
  UpdateVariantData,
  VariantWithRelations,
} from '@/lib/types/domain/variant';
import {
  ensureGenericVariantAttribute,
  ensureAttributeValue,
  getVariantById,
} from './variant-management.service';
import { validateVariantAttributes } from './variant-generator.service';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

/**
 * Creates simple variants with names in multiple languages using the generic attribute system.
 */
export async function createSimpleVariants(
  productId: string,
  variants: SimpleVariantData[]
): Promise<VariantWithRelations[]> {
  logger.info(
    {
      productId,
      variantCount: variants.length,
    },
    'Creating simple variants'
  );

  if (variants.length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'At least one variant is required',
      400
    );
  }

  // Ensure generic attribute exists (automatically uses dictionaries)
  const attribute = await ensureGenericVariantAttribute();

  // Fetch product to generate SKUs
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Product not found: ${productId}`,
      404
    );
  }

  const createdVariants = [];

  for (const variantData of variants) {
    // 1. Identify priority name for technical tasks (like valueKey/SKU)
    const locales = Object.keys(variantData.names);
    const preferredLocale = locales.includes(i18n.defaultLocale)
      ? i18n.defaultLocale
      : locales[0];

    let firstName = variantData.names[preferredLocale];

    // 2. If name is completely missing, fetch from dictionary (Standard)
    if (!firstName || firstName.trim() === '') {
      const dict = await getDictionary(preferredLocale);
      firstName = dict.orders?.detail?.variant || 'Standard';
    }

    const valueKey = firstName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // 3. Prepare effective names (ensure we don't have empty strings)
    const effectiveNames = { ...variantData.names };
    for (const locale of Object.keys(effectiveNames)) {
      if (!effectiveNames[locale]) {
        const dict = await getDictionary(locale);
        effectiveNames[locale] = dict.orders?.detail?.variant || 'Standard';
      }
    }

    // Create or retrieve attribute value
    const attributeValue = await ensureAttributeValue(
      attribute.id,
      valueKey,
      effectiveNames
    );

    // Generate SKU
    const sku = `${product.slug.toUpperCase()}-${valueKey.toUpperCase()}`;

    // Prepare pricing data dynamically
    const pricingData: Array<{
      price: Prisma.Decimal;
      currency: string;
      priceType: string;
      isActive: boolean;
    }> = [];

    Object.entries(variantData.prices).forEach(([currency, price]) => {
      if (price != null && price >= 0) {
        pricingData.push({
          price: new Prisma.Decimal(price),
          currency,
          priceType: 'base',
          isActive: true,
        });
      }
    });

    if (pricingData.length === 0) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        `Variant "${firstName}": at least one price is required`,
        400
      );
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        weight:
          variantData.weight != null
            ? new Prisma.Decimal(variantData.weight)
            : undefined,
        dimensions:
          variantData.length && variantData.width && variantData.height
            ? {
                length: Number(variantData.length),
                width: Number(variantData.width),
                height: Number(variantData.height),
              }
            : undefined,
        attributeValues: {
          create: {
            attributeValueId: attributeValue.id,
          },
        },
        pricing: {
          create: pricingData,
        },
        inventory: {
          create: {
            stock: variantData.stock,
            trackInventory: true,
            allowBackorder: false,
            lowStockThreshold: 10, // Default system value, should be configurable but safe for now as it's not financial data
          },
        },
      },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: {
                attribute: true,
                translations: true,
              },
            },
          },
        },
        pricing: true,
        inventory: true,
      },
    });

    createdVariants.push(variant);
  }

  logger.info(
    {
      productId,
      createdCount: createdVariants.length,
    },
    `Successfully created ${createdVariants.length} simple variant(s)`
  );

  return createdVariants as unknown as VariantWithRelations[];
}

/**
 * Creates one or multiple variants for a product.
 */
export async function createVariants(
  productId: string,
  variants: CreateVariantData[]
): Promise<VariantWithRelations[]> {
  // ... (rest of the file remains same, verified imports above)
  logger.info(
    { productId, variantCount: variants.length },
    'Creating multiple variants'
  );

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Product not found: ${productId}`,
      404
    );

  variants.forEach((variant, index) => {
    validateVariantAttributes(variant.attributeValueIds);
    if (!variant.sku)
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `SKU missing for variant ${index + 1}`,
        400
      );

    // Zero Fallback Policy: Ensure currency is provided if legacy pricing is used
    if (variant.pricing && !variant.pricing.currency) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Currency missing for variant ${index + 1} pricing`,
        400
      );
    }
  });

  const createdVariants = await prisma.$transaction(
    variants.map(variantData =>
      prisma.productVariant.create({
        data: {
          productId,
          sku: variantData.sku,
          barcode: variantData.barcode,
          weight: variantData.weight
            ? new Prisma.Decimal(variantData.weight)
            : undefined,
          dimensions: variantData.dimensions
            ? (variantData.dimensions as unknown as Prisma.InputJsonValue)
            : undefined,
          attributeValues: {
            create: variantData.attributeValueIds.map(attributeValueId => ({
              attributeValueId,
            })),
          },
          pricing: {
            create: [
              ...(variantData.pricing
                ? [
                    {
                      price: new Prisma.Decimal(variantData.pricing.price),
                      currency:
                        variantData.pricing.currency ?? DEFAULT_CURRENCY,
                      priceType: variantData.pricing.priceType ?? 'base',
                      isActive: variantData.pricing.isActive ?? true,
                    },
                  ]
                : []),
              ...(variantData.prices
                ? Object.entries(variantData.prices).map(
                    ([currency, price]) => ({
                      price: new Prisma.Decimal(price),
                      currency,
                      priceType: 'base',
                      isActive: true,
                    })
                  )
                : []),
            ],
          },
          inventory: variantData.inventory
            ? {
                create: {
                  stock: variantData.inventory.stock,
                  trackInventory: variantData.inventory.trackInventory ?? true,
                  allowBackorder: variantData.inventory.allowBackorder ?? false,
                  lowStockThreshold:
                    variantData.inventory.lowStockThreshold ?? 10,
                },
              }
            : undefined,
        },
        include: {
          attributeValues: {
            include: {
              attributeValue: {
                include: { attribute: true, translations: true },
              },
            },
          },
          pricing: true,
          inventory: true,
        },
      })
    )
  );
  return createdVariants as unknown as VariantWithRelations[];
}

export async function updateVariant(
  variantId: string,
  updateData: UpdateVariantData
): Promise<VariantWithRelations | null> {
  const variant = await getVariantById(variantId);
  if (!variant)
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Variant not found: ${variantId}`,
      404
    );
  const variantUpdate: Prisma.ProductVariantUpdateInput = {};
  if (updateData.sku !== undefined) variantUpdate.sku = updateData.sku;
  if (updateData.barcode !== undefined)
    variantUpdate.barcode = updateData.barcode;
  if (updateData.weight !== undefined)
    variantUpdate.weight =
      updateData.weight !== null ? new Prisma.Decimal(updateData.weight) : null;
  if (updateData.dimensions !== undefined)
    variantUpdate.dimensions =
      updateData.dimensions as unknown as Prisma.InputJsonValue;

  await prisma.$transaction(async tx => {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { ...variantUpdate, updatedAt: new Date() },
    });
    if (updateData.pricing && variant.pricing.length > 0) {
      const currentPricing = variant.pricing[0];
      await tx.productVariantPricing.update({
        where: { id: currentPricing.id },
        data: {
          price:
            updateData.pricing.price !== undefined
              ? new Prisma.Decimal(updateData.pricing.price)
              : undefined,
          currency: updateData.pricing.currency,
          priceType: updateData.pricing.priceType,
          isActive: updateData.pricing.isActive,
        },
      });
    }
    if (updateData.prices) {
      for (const [currency, price] of Object.entries(updateData.prices)) {
        const currentPricing = variant.pricing.find(
          p => p.currency === currency
        );
        if (currentPricing) {
          await tx.productVariantPricing.update({
            where: { id: currentPricing.id },
            data: { price: new Prisma.Decimal(price) },
          });
        } else {
          await tx.productVariantPricing.create({
            data: {
              variantId,
              price: new Prisma.Decimal(price),
              currency,
              priceType: 'base',
              isActive: true,
            },
          });
        }
      }
    }
    if (updateData.inventory && variant.inventory) {
      await tx.productVariantInventory.update({
        where: { id: variant.inventory.id },
        data: {
          stock: updateData.inventory.stock,
          trackInventory: updateData.inventory.trackInventory,
          allowBackorder: updateData.inventory.allowBackorder,
          lowStockThreshold: updateData.inventory.lowStockThreshold,
        },
      });
    }
  });
  return getVariantById(variantId);
}

export async function deleteVariant(variantId: string) {
  const variant = await getVariantById(variantId);
  if (!variant)
    throw new AppError(
      ErrorCode.NOT_FOUND,
      `Variant not found: ${variantId}`,
      404
    );
  const deleted = await prisma.productVariant.delete({
    where: { id: variantId },
  });
  await cleanupOrphanedAttributes();
  return deleted;
}
