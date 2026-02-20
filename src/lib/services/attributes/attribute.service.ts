import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  CreateAttributeData,
  AddAttributeValueData,
} from '@/lib/types/domain/attribute';

import { Language } from '@/generated/prisma';

/**
 * Récupère tous les attributs produits avec leurs valeurs et traductions
 *
 * @param language - Langue optionnelle pour filtrer les traductions
 * @returns Liste des attributs produits
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
 * Récupère un attribut spécifique par son ID
 *
 * @param id - ID de l'attribut
 * @returns L'attribut trouvé ou null
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
 * Crée un nouvel attribut produit
 *
 * @param data - Données de l'attribut
 * @returns L'attribut créé
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
 * Ajoute une nouvelle valeur possible à un attribut existant
 *
 * @param attributeId - ID de l'attribut parent
 * @param data - Données de la valeur
 * @returns La valeur créée
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
