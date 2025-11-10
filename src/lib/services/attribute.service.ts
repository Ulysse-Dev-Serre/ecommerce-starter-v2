import { prisma } from '@/lib/db/prisma';
import { Language } from '@/generated/prisma';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface CreateAttributeData {
  key: string;
  inputType?: string;
  isRequired?: boolean;
  sortOrder?: number;
  translations: Array<{
    language: Language;
    name: string;
  }>;
}

export interface AddAttributeValueData {
  value: string;
  translations: Array<{
    language: Language;
    displayName: string;
  }>;
}

// ============================================
// FONCTIONS
// ============================================

/**
 * Récupérer tous les attributs produits
 */
export async function getProductAttributes(language?: Language) {
  logger.info({ language }, 'Fetching product attributes');

  return prisma.productAttribute.findMany({
    where: {},
    include: {
      translations: language ? { where: { language } } : true,
      values: {
        include: {
          translations: language ? { where: { language } } : true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Récupérer un attribut par ID
 */
export async function getAttributeById(id: string) {
  logger.info({ attributeId: id }, 'Fetching attribute by ID');

  return prisma.productAttribute.findUnique({
    where: { id },
    include: {
      translations: true,
      values: {
        include: {
          translations: true,
        },
      },
    },
  });
}

/**
 * Créer un nouvel attribut
 */
export async function createProductAttribute(data: CreateAttributeData) {
  logger.info({ key: data.key }, 'Creating product attribute');

  return prisma.productAttribute.create({
    data: {
      key: data.key,
      inputType: data.inputType ?? 'select',
      isRequired: data.isRequired ?? false,
      sortOrder: data.sortOrder ?? 0,
      translations: {
        create: data.translations,
      },
    },
    include: {
      translations: true,
      values: true,
    },
  });
}

/**
 * Ajouter une valeur à un attribut
 */
export async function addAttributeValue(
  attributeId: string,
  data: AddAttributeValueData
) {
  logger.info({ attributeId, value: data.value }, 'Adding attribute value');

  return prisma.productAttributeValue.create({
    data: {
      attributeId,
      value: data.value,
      translations: {
        create: data.translations,
      },
    },
    include: {
      translations: true,
    },
  });
}
