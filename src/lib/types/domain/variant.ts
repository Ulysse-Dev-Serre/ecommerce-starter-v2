import {
  ProductVariant,
  ProductVariantPricing,
  ProductVariantInventory,
  ProductMedia,
  ProductAttribute,
  ProductAttributeValue,
  ProductVariantAttributeValue,
} from '@/generated/prisma';

import { Dimensions } from './product';

/**
 * Simplified data for quick variant creation (Client Side / Admin Form)
 */
export interface SimpleVariantData {
  names: Record<string, string>; // { en: "Green", fr: "Vert", ... }
  prices: Record<string, number>; // { CAD: 10, USD: 8, ... }
  stock: number;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Configuration pour la tarification d'une variante
 */
export interface VariantPricing {
  price: number;
  currency?: string;
  priceType?: string;
  isActive?: boolean;
}

/**
 * Configuration pour l'inventaire d'une variante
 */
export interface VariantInventory {
  stock: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
}

/**
 * Données complètes pour la création d'une variante
 */
export interface CreateVariantData {
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: Dimensions;
  attributeValueIds: string[]; // Exactement 1 ID dans le modèle actuel
  prices?: Record<string, number>; // Nouveau format générique
  pricing?: VariantPricing; // Ancien format / Fallback
  inventory?: VariantInventory;
}

/**
 * Données pour la mise à jour d'une variante
 */
export interface UpdateVariantData {
  sku?: string;
  barcode?: string;
  weight?: number | null;
  dimensions?: Dimensions | null;
  pricing?: VariantPricing; // Legacy / Fallback
  prices?: Record<string, number>; // New generic format
  inventory?: VariantInventory;
}

/**
 * Configuration pour la génération automatique de combinaisons
 */
export interface GenerateVariantsConfig {
  attributeId: string; // Attribut unique (couleur, type, etc.)
  defaultPricing: VariantPricing;
  defaultInventory?: VariantInventory;
  skuPattern?: string; // Ex: "SOIL-{attr}"
}

/**
 * Variante avec toutes ses relations (utilisé pour les retours API Admin)
 */
export type VariantWithRelations = ProductVariant & {
  product?: {
    id: string;
    slug: string;
  };
  attributeValues: (ProductVariantAttributeValue & {
    attributeValue: ProductAttributeValue & {
      attribute: ProductAttribute;
    };
  })[];
  pricing: ProductVariantPricing[];
  inventory: ProductVariantInventory | null;
  media?: ProductMedia[];
};
