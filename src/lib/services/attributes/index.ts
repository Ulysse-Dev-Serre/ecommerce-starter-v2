/**
 * Barrel export pour le domaine Attribute
 * Permet d'accéder aux services de gestion des attributs produits
 */

export * from './attribute.service';

// Re-export des types pour faciliter l'accès depuis le reste du système
export type {
  CreateAttributeData,
  AddAttributeValueData,
  ProductAttribute,
  AttributeValue,
} from '@/lib/types/domain/attribute';
