import { ProductStatus, Language, Product } from '@/generated/prisma';

/**
 * Filtres pour la liste de produits
 */
export interface ProductListFilters {
  status?: ProductStatus;
  isFeatured?: boolean;
  categorySlug?: string;
  language?: Language;
  search?: string;
}

/**
 * Options de pagination et tri pour les produits
 */
export interface ProductListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  includeAttributes?: boolean; // false = mode LIST, true = mode DETAIL
}

/**
 * Projection d'une variante de produit
 */
export interface ProductVariantProjection {
  id: string;
  sku: string;
  pricing: {
    price: string;
    currency: string;
    priceType: string;
  }[];
  inventory: {
    stock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  } | null;
  attributeValues: Array<{
    attributeValue?: {
      value: string;
      attribute: {
        key: string;
        translations: {
          language: string;
          name: string;
        }[];
      };
      translations: {
        language: string;
        displayName: string;
      }[];
    };
    variantId?: string;
    attributeValueId?: string;
  }>;
  media: {
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}

/**
 * Projection complète d'un produit
 */
export interface ProductProjection {
  id: string;
  slug: string;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: {
    language: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
  }[];
  variants: ProductVariantProjection[];
  categories: {
    category: {
      slug: string;
      translations: {
        language: string;
        name: string;
      }[];
    };
  }[];
  media: {
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}

/**
 * Données pour créer un produit
 */
export interface CreateProductData {
  slug: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  originCountry?: string;
  hsCode?: string;
  exportExplanation?: string;
  incoterm?: string;
  shippingOriginId?: string;
  weight?: number;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };
  translations?: {
    language: Language;
    name: string;
    description?: string;
    shortDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
  }[];
}

/**
 * Données pour mettre à jour un produit
 */
export interface UpdateProductData {
  slug?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  originCountry?: string | null;
  hsCode?: string | null;
  shippingOriginId?: string | null;
  exportExplanation?: string | null;
  incoterm?: string | null;
  weight?: number | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  translations?: {
    language: Language;
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }[];
}

/**
 * Produit avec traductions (pour admin)
 */
export type ProductWithTranslations = Product & {
  translations: {
    id: string;
    language: Language;
    name: string;
    description: string | null;
    shortDescription: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  }[];
};

/**
 * Vue modèle pour affichage client
 */
export interface ProductViewModel {
  images: {
    url: string;
    alt: string | null;
    isPrimary: boolean;
  }[];
  variants: {
    id: string;
    sku: string;
    pricing: {
      price: string;
      currency: string;
    }[];
    stock: number;
    attributes: {
      name: string;
      value: string;
    }[];
  }[];
}
