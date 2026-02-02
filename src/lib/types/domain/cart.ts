import { CartStatus } from '@/generated/prisma';

/**
 * Entrée pour ajouter un article au panier
 */
export interface AddToCartInput {
  variantId: string;
  quantity: number;
}

/**
 * Entrée pour mettre à jour une ligne du panier
 */
export interface UpdateCartLineInput {
  quantity: number;
}

/**
 * Projection complète du panier (utilisée par les services)
 */
export interface CartProjection {
  id: string;
  userId: string | null;
  anonymousId: string | null;
  status: CartStatus;
  currency: string;
  items: {
    id: string;
    variantId: string;
    quantity: number;
    variant: {
      id: string;
      sku: string;
      weight: string;
      dimensions: any;
      product: {
        id: string;
        slug: string;
        weight?: string;
        dimensions?: any;
        translations: {
          language: string;
          name: string;
        }[];
      };
      pricing: {
        price: string;
        currency: string;
      }[];
      inventory: {
        stock: number;
        trackInventory: boolean;
        allowBackorder: boolean;
      } | null;
      media: {
        url: string;
        alt: string | null;
        isPrimary: boolean;
      }[];
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}
