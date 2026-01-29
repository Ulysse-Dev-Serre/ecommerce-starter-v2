import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  CreateVariantData,
  GenerateVariantsConfig,
} from '@/lib/types/domain/variant';

/**
 * Génère un SKU automatique basé sur l'attribut
 */
export function generateSku(
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
export function validateVariantAttributes(attributeValueIds: string[]): void {
  if (attributeValueIds.length !== 1) {
    throw new Error(
      `Une variante doit avoir exactement 1 attribut (reçu ${attributeValueIds.length})`
    );
  }
}

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
