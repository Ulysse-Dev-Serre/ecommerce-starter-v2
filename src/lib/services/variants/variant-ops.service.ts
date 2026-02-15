import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { SITE_CURRENCY } from '@/lib/config/site';
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

/**
 * Créer des variantes simples avec noms EN/FR
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
    'Création de variantes simples'
  );

  if (variants.length === 0) {
    throw new Error('Au moins 1 variante est requise');
  }

  // Assurer que l'attribut générique existe
  const attribute = await ensureGenericVariantAttribute();

  // Récupérer le produit pour générer les SKU
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    throw new Error(`Produit non trouvé: ${productId}`);
  }

  const createdVariants = [];

  for (const variantData of variants) {
    // Générer une clé unique pour la valeur d'attribut
    const valueKey = variantData.nameEN
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');

    // Créer ou récupérer la valeur d'attribut
    const attributeValue = await ensureAttributeValue(
      attribute.id,
      valueKey,
      variantData.nameEN,
      variantData.nameFR
    );

    // Générer le SKU
    const sku = `${product.slug.toUpperCase()}-${valueKey.toUpperCase()}`;

    // Préparer les prix dynamiquement
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
      throw new Error(
        `Variante "${variantData.nameEN}": au moins un prix est requis`
      );
    }

    // Créer la variante
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        weight:
          variantData.weight != null
            ? new Prisma.Decimal(variantData.weight)
            : undefined,
        dimensions:
          variantData.length || variantData.width || variantData.height
            ? {
                length: Number(variantData.length) || 0,
                width: Number(variantData.width) || 0,
                height: Number(variantData.height) || 0,
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
            lowStockThreshold: 10,
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
    `${createdVariants.length} variante(s) simple(s) créée(s)`
  );

  return createdVariants as unknown as VariantWithRelations[];
}

/**
 * Créer une ou plusieurs variantes pour un produit
 */
export async function createVariants(
  productId: string,
  variants: CreateVariantData[]
): Promise<VariantWithRelations[]> {
  logger.info(
    {
      productId,
      variantCount: variants.length,
    },
    'Création de variantes'
  );

  // Valider que le produit existe
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Produit non trouvé: ${productId}`);
  }

  // Valider chaque variante
  variants.forEach((variant, index) => {
    validateVariantAttributes(variant.attributeValueIds);

    if (!variant.sku) {
      throw new Error(`SKU manquant pour la variante ${index + 1}`);
    }
  });

  // Créer toutes les variantes en transaction
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
            ? (variantData.dimensions as Prisma.InputJsonValue)
            : undefined,

          // Lier les attributs
          attributeValues: {
            create: variantData.attributeValueIds.map(attributeValueId => ({
              attributeValueId,
            })),
          },

          // Créer le pricing
          pricing: {
            create: [
              ...(variantData.pricing
                ? [
                    {
                      price: new Prisma.Decimal(variantData.pricing.price),
                      currency: variantData.pricing.currency ?? SITE_CURRENCY,
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

          // Créer l'inventaire si fourni
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
      })
    )
  );

  logger.info(
    {
      productId,
      createdCount: createdVariants.length,
    },
    `${createdVariants.length} variante(s) créée(s) avec succès`
  );

  return createdVariants as unknown as VariantWithRelations[];
}

/**
 * Mettre à jour une variante
 */
export async function updateVariant(
  variantId: string,
  updateData: UpdateVariantData
): Promise<VariantWithRelations | null> {
  logger.info({ variantId }, 'Mise à jour de la variante');

  // Vérifier que la variante existe
  const variant = await getVariantById(variantId);
  if (!variant) {
    throw new Error(`Variante non trouvée: ${variantId}`);
  }

  // Construire les données de mise à jour
  const variantUpdate: any = {};

  if (updateData.sku !== undefined) variantUpdate.sku = updateData.sku;
  if (updateData.barcode !== undefined)
    variantUpdate.barcode = updateData.barcode;
  if (updateData.weight !== undefined) {
    variantUpdate.weight =
      updateData.weight !== null ? new Prisma.Decimal(updateData.weight) : null;
  }
  if (updateData.dimensions !== undefined) {
    variantUpdate.dimensions = updateData.dimensions as Prisma.InputJsonValue;
  }

  // Transaction pour mettre à jour variante + pricing + inventory
  await prisma.$transaction(async tx => {
    // Mise à jour de la variante elle-même
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        ...variantUpdate,
        updatedAt: new Date(),
      },
    });

    // Mise à jour du pricing si fourni (ancien format)
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

    // Mise à jour des prix générique
    if (updateData.prices) {
      for (const [currency, price] of Object.entries(updateData.prices)) {
        const currentPricing = variant.pricing.find(
          (p: any) => p.currency === currency
        );
        if (currentPricing) {
          await tx.productVariantPricing.update({
            where: { id: currentPricing.id },
            data: {
              price: new Prisma.Decimal(price),
            },
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

    // Mise à jour de l'inventaire si fourni
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

  logger.info(
    {
      variantId,
      sku: variantUpdate.sku || variant.sku,
    },
    'Variante mise à jour avec succès'
  );

  // Retourner la variante mise à jour avec toutes ses relations
  return getVariantById(variantId);
}

/**
 * Supprimer une variante (HARD DELETE)
 */
export async function deleteVariant(variantId: string) {
  logger.info({ variantId }, 'Suppression de la variante');

  const variant = await getVariantById(variantId);
  if (!variant) {
    throw new Error(`Variante non trouvée: ${variantId}`);
  }

  // Hard delete (cascade supprimera pricing, inventory, attributeValues)
  const deleted = await prisma.productVariant.delete({
    where: { id: variantId },
  });

  // Nettoyage automatique des attributs orphelins
  await cleanupOrphanedAttributes();

  logger.info(
    {
      variantId,
      sku: deleted.sku,
    },
    'Variante supprimée définitivement'
  );

  return deleted;
}
