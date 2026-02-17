import { CartStatus } from '@/generated/prisma';
import { Dimensions } from './product';

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
      dimensions: Dimensions | null;
      product: {
        id: string;
        slug: string;
        weight?: string;
        dimensions?: Dimensions | null;
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
