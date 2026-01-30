import { Language } from '@/generated/prisma';

/**
 * Types centralisés pour le domaine Attribute
 * Utilisés pour la gestion des caractéristiques techniques des produits
 */

// ==================== Inputs (Données de création) ====================

/**
 * Données nécessaires pour créer un attribut produit
 */
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

/**
 * Données nécessaires pour ajouter une valeur à un attribut
 */
export interface AddAttributeValueData {
  value: string;
  translations: Array<{
    language: Language;
    displayName: string;
  }>;
}

// ==================== Outputs (Modèles de domaine) ====================

/**
 * Représentation d'une valeur d'attribut avec ses traductions
 */
export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  translations: Array<{
    language: Language;
    displayName: string;
  }>;
}

/**
 * Représentation d'un attribut produit complet
 */
export interface ProductAttribute {
  id: string;
  key: string;
  inputType: string;
  isRequired: boolean;
  sortOrder: number;
  translations: Array<{
    language: Language;
    name: string;
  }>;
  values?: AttributeValue[];
}
