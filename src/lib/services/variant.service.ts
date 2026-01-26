import { Prisma, Language } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { SITE_CURRENCY } from '../constants';

// ============================================
// TYPES
// ============================================

export interface SimpleVariantData {
  nameEN: string;
  nameFR: string;
  prices: Record<string, number>; // { CAD: 10, USD: 8, ... }
  stock: number;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

const GENERIC_ATTRIBUTE_KEY = 'variant_type';

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
  attributeValueIds: string[]; // Exactement 1 ID
  prices?: Record<string, number>; // New generic pricing
  pricing?: VariantPricing; // Legacy / Fallback
  inventory?: VariantInventory;
}

export interface UpdateVariantData {
  sku?: string;
  barcode?: string;
  weight?: number | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  pricing?: VariantPricing; // Legacy / Fallback
  prices?: Record<string, number>; // New generic format
  inventory?: VariantInventory;
}

export interface GenerateVariantsConfig {
  attributeId: string; // Attribut unique (couleur, type, etc.)
  defaultPricing: VariantPricing;
  defaultInventory?: VariantInventory;
  skuPattern?: string; // Ex: "SOIL-{attr}"
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Assure qu'un attribut générique "variant_type" existe
 * Crée l'attribut s'il n'existe pas, sinon le retourne
 */
async function ensureGenericVariantAttribute() {
  let attribute = await prisma.productAttribute.findUnique({
    where: { key: GENERIC_ATTRIBUTE_KEY },
  });

  if (!attribute) {
    logger.info(
      {
        action: 'create_generic_attribute',
        key: GENERIC_ATTRIBUTE_KEY,
      },
      "Création de l'attribut générique variant_type"
    );

    attribute = await prisma.productAttribute.create({
      data: {
        key: GENERIC_ATTRIBUTE_KEY,
        inputType: 'select',
        isRequired: true,
        sortOrder: 0,
        translations: {
          create: [
            { language: Language.EN, name: 'Variant' },
            { language: Language.FR, name: 'Variante' },
          ],
        },
      },
    });
  }

  return attribute;
}

/**
 * Crée ou récupère une valeur d'attribut pour un nom de variante
 */
async function ensureAttributeValue(
  attributeId: string,
  valueKey: string,
  nameEN: string,
  nameFR: string
) {
  let attributeValue = await prisma.productAttributeValue.findUnique({
    where: {
      attributeId_value: {
        attributeId,
        value: valueKey,
      },
    },
  });

  if (!attributeValue) {
    attributeValue = await prisma.productAttributeValue.create({
      data: {
        attributeId,
        value: valueKey,
        translations: {
          create: [
            { language: Language.EN, displayName: nameEN },
            { language: Language.FR, displayName: nameFR },
          ],
        },
      },
    });
  }

  return attributeValue;
}

/**
 * Génère un SKU automatique basé sur l'attribut
 */
function generateSku(
  productSlug: string,
  attrValue: string,
  pattern?: string
): string {
  if (pattern) {
    return pattern
      .replace('{product}', productSlug.toUpperCase())
      .replace('{attr}', attrValue.toUpperCase());
  }

  // Pattern par défaut: PRODUCTSLUG-ATTR
  return `${productSlug.toUpperCase()}-${attrValue.toUpperCase()}`;
}

/**
 * Valide qu'une variante a exactement 1 attribut
 */
function validateVariantAttributes(attributeValueIds: string[]): void {
  if (attributeValueIds.length !== 1) {
    throw new Error(
      `Une variante doit avoir exactement 1 attribut (reçu ${attributeValueIds.length})`
    );
  }
}

// ============================================
// GÉNÉRATION AUTOMATIQUE DE VARIANTES
// ============================================

/**
 * Génère toutes les variantes possibles pour 1 attribut
 */
export async function generateVariantCombinations(
  productId: string,
  config: GenerateVariantsConfig
): Promise<CreateVariantData[]> {
  logger.info(
    {
      productId,
      attributeId: config.attributeId,
    },
    'Génération des variantes'
  );

  // Récupérer le produit avec son slug
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    throw new Error(`Produit non trouvé: ${productId}`);
  }

  // Récupérer les valeurs de l'attribut
  const attrValues = await prisma.productAttributeValue.findMany({
    where: { attributeId: config.attributeId },
    select: { id: true, value: true },
  });

  if (attrValues.length === 0) {
    throw new Error(
      `Aucune valeur trouvée pour l'attribut ${config.attributeId}`
    );
  }

  // Générer une variante pour chaque valeur
  const variants: CreateVariantData[] = [];

  for (const attrValue of attrValues) {
    const sku = generateSku(product.slug, attrValue.value, config.skuPattern);

    variants.push({
      sku,
      attributeValueIds: [attrValue.id],
      pricing: { ...config.defaultPricing },
      inventory: config.defaultInventory
        ? { ...config.defaultInventory }
        : { stock: 0, trackInventory: true },
    });
  }

  logger.info(
    {
      productId,
      variantsGenerated: variants.length,
      attrValuesCount: attrValues.length,
    },
    `${variants.length} variante(s) générée(s)`
  );

  return variants;
}

// ============================================
// API SIMPLIFIÉE POUR VARIANTES MANUELLES
// ============================================

/**
 * Créer des variantes simples avec noms EN/FR
 */
export async function createSimpleVariants(
  productId: string,
  variants: SimpleVariantData[]
) {
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
                length: variantData.length || 0,
                width: variantData.width || 0,
                height: variantData.height || 0,
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

  return createdVariants;
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
  const updatedVariant = await prisma.$transaction(async tx => {
    // Mise à jour de la variante elle-même
    const updated = await tx.productVariant.update({
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
          p => p.currency === currency
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
