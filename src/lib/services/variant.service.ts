import { Prisma } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';

// ============================================
// TYPES
// ============================================

export interface VariantAttributeValue {
  attributeValueId: string;
}

export interface VariantPricing {
  price: number;
  currency?: string;
  priceType?: string;
  isActive?: boolean;
}

export interface VariantInventory {
  stock: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
}

export interface CreateVariantData {
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  attributeValueIds: string[]; // Exactement 2 IDs
  pricing: VariantPricing;
  inventory?: VariantInventory;
}

export interface UpdateVariantData {
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  pricing?: VariantPricing;
  inventory?: VariantInventory;
}

export interface GenerateVariantsConfig {
  attribute1Id: string; // Attribut "style" (couleur, type...)
  attribute2Id: string; // Attribut "configuration" (quantité, longueur...)
  defaultPricing: VariantPricing;
  defaultInventory?: VariantInventory;
  skuPattern?: string; // Ex: "SOIL-{attr1}-{attr2}"
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère un SKU automatique basé sur les attributs
 */
function generateSku(
  productSlug: string,
  attr1Value: string,
  attr2Value: string,
  pattern?: string
): string {
  if (pattern) {
    return pattern
      .replace('{product}', productSlug.toUpperCase())
      .replace('{attr1}', attr1Value.toUpperCase())
      .replace('{attr2}', attr2Value.toUpperCase());
  }
  
  // Pattern par défaut: PRODUCTSLUG-ATTR1-ATTR2
  return `${productSlug.toUpperCase()}-${attr1Value.toUpperCase()}-${attr2Value.toUpperCase()}`;
}

/**
 * Valide qu'une variante a exactement 2 attributs
 */
function validateVariantAttributes(attributeValueIds: string[]): void {
  if (attributeValueIds.length !== 2) {
    throw new Error(
      `Une variante doit avoir exactement 2 attributs (reçu ${attributeValueIds.length})`
    );
  }
}

// ============================================
// GÉNÉRATION AUTOMATIQUE DE VARIANTES
// ============================================

/**
 * Génère toutes les combinaisons possibles de 2 attributs
 */
export async function generateVariantCombinations(
  productId: string,
  config: GenerateVariantsConfig
): Promise<CreateVariantData[]> {
  logger.info(
    {
      productId,
      attribute1Id: config.attribute1Id,
      attribute2Id: config.attribute2Id,
    },
    'Génération des combinaisons de variantes'
  );

  // Récupérer le produit avec son slug
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    throw new Error(`Produit non trouvé: ${productId}`);
  }

  // Récupérer les valeurs du premier attribut
  const attr1Values = await prisma.productAttributeValue.findMany({
    where: { attributeId: config.attribute1Id },
    select: { id: true, value: true },
  });

  // Récupérer les valeurs du second attribut
  const attr2Values = await prisma.productAttributeValue.findMany({
    where: { attributeId: config.attribute2Id },
    select: { id: true, value: true },
  });

  if (attr1Values.length === 0) {
    throw new Error(
      `Aucune valeur trouvée pour l'attribut ${config.attribute1Id}`
    );
  }

  if (attr2Values.length === 0) {
    throw new Error(
      `Aucune valeur trouvée pour l'attribut ${config.attribute2Id}`
    );
  }

  // Générer toutes les combinaisons
  const variants: CreateVariantData[] = [];

  for (const attr1 of attr1Values) {
    for (const attr2 of attr2Values) {
      const sku = generateSku(
        product.slug,
        attr1.value,
        attr2.value,
        config.skuPattern
      );

      variants.push({
        sku,
        attributeValueIds: [attr1.id, attr2.id],
        pricing: { ...config.defaultPricing },
        inventory: config.defaultInventory
          ? { ...config.defaultInventory }
          : { stock: 0, trackInventory: true },
      });
    }
  }

  logger.info(
    {
      productId,
      combinationsGenerated: variants.length,
      attr1Count: attr1Values.length,
      attr2Count: attr2Values.length,
    },
    `${variants.length} combinaisons générées (${attr1Values.length} × ${attr2Values.length})`
  );

  return variants;
}

// ============================================
// CRUD VARIANTES
// ============================================

/**
 * Créer une ou plusieurs variantes pour un produit
 */
export async function createVariants(
  productId: string,
  variants: CreateVariantData[]
) {
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
    variants.map((variantData) =>
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
            create: variantData.attributeValueIds.map((attributeValueId) => ({
              attributeValueId,
            })),
          },

          // Créer le pricing
          pricing: {
            create: {
              price: new Prisma.Decimal(variantData.pricing.price),
              currency: variantData.pricing.currency ?? 'CAD',
              priceType: variantData.pricing.priceType ?? 'base',
              isActive: variantData.pricing.isActive ?? true,
            },
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

  return createdVariants;
}

/**
 * Récupérer toutes les variantes d'un produit
 */
export async function getProductVariants(productId: string) {
  logger.info({ productId }, 'Récupération des variantes du produit');

  return prisma.productVariant.findMany({
    where: {
      productId,
      deletedAt: null,
    },
    include: {
      attributeValues: {
        include: {
          attributeValue: {
            include: {
              attribute: {
                include: {
                  translations: true,
                },
              },
              translations: true,
            },
          },
        },
      },
      pricing: {
        where: { isActive: true },
      },
      inventory: true,
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Récupérer une variante par ID
 */
export async function getVariantById(variantId: string) {
  logger.info({ variantId }, 'Récupération de la variante');

  return prisma.productVariant.findFirst({
    where: {
      id: variantId,
      deletedAt: null,
    },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
        },
      },
      attributeValues: {
        include: {
          attributeValue: {
            include: {
              attribute: {
                include: {
                  translations: true,
                },
              },
              translations: true,
            },
          },
        },
      },
      pricing: {
        where: { isActive: true },
      },
      inventory: true,
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

/**
 * Mettre à jour une variante
 */
export async function updateVariant(
  variantId: string,
  updateData: UpdateVariantData
) {
  logger.info({ variantId }, 'Mise à jour de la variante');

  // Vérifier que la variante existe
  const variant = await getVariantById(variantId);
  if (!variant) {
    throw new Error(`Variante non trouvée: ${variantId}`);
  }

  // Construire les données de mise à jour
  const variantUpdate: any = {};
  
  if (updateData.sku !== undefined) variantUpdate.sku = updateData.sku;
  if (updateData.barcode !== undefined) variantUpdate.barcode = updateData.barcode;
  if (updateData.weight !== undefined) {
    variantUpdate.weight = new Prisma.Decimal(updateData.weight);
  }
  if (updateData.dimensions !== undefined) {
    variantUpdate.dimensions = updateData.dimensions as Prisma.InputJsonValue;
  }

  // Transaction pour mettre à jour variante + pricing + inventory
  const updatedVariant = await prisma.$transaction(async (tx) => {
    // Mise à jour de la variante elle-même
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        ...variantUpdate,
        updatedAt: new Date(),
      },
    });

    // Mise à jour du pricing si fourni
    if (updateData.pricing && variant.pricing.length > 0) {
      const currentPricing = variant.pricing[0];
      
      await tx.productVariantPricing.update({
        where: { id: currentPricing.id },
        data: {
          price: updateData.pricing.price !== undefined
            ? new Prisma.Decimal(updateData.pricing.price)
            : undefined,
          currency: updateData.pricing.currency,
          priceType: updateData.pricing.priceType,
          isActive: updateData.pricing.isActive,
        },
      });
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

    return updated;
  });

  logger.info(
    {
      variantId,
      sku: updatedVariant.sku,
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

  logger.info(
    {
      variantId,
      sku: deleted.sku,
    },
    'Variante supprimée définitivement'
  );

  return deleted;
}
