import { CartStatus } from '@/generated/prisma';

export interface CartPricing {
  price: string;
  currency: string;
}

export interface CartProductTranslation {
  name: string;
  language?: string;
}

export interface CartMedia {
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
}

export interface CartProduct {
  id?: string;
  slug: string;
  translations: CartProductTranslation[];
  media: CartMedia[];
}

export interface CartInventory {
  stock: number;
  trackInventory: boolean;
  allowBackorder: boolean;
}

export interface CartVariant {
  id: string;
  sku: string;
  pricing: CartPricing[];
  product: CartProduct;
  inventory?: CartInventory | null;
  media?: CartMedia[];
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: CartVariant;
}

export interface Cart {
  id: string;
  userId: string | null;
  anonymousId: string | null;
  status: CartStatus;
  currency: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Projection complète du panier avec relations
 * Utilisée par les services pour manipulation du panier
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
      product: {
        id: string;
        slug: string;
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
