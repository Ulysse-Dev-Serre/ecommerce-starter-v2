import { CartStatus } from '@/generated/prisma';

/**
 * Types UI pour les composants Cart
 * Ces types sont spécifiques à l'affichage et ne doivent PAS être utilisés dans les services
 * Pour les services, utiliser les types de /lib/types/domain/cart.ts
 */

/**
 * Format de prix pour l'affichage dans le panier
 */
export interface CartPricing {
  price: string;
  currency: string;
}

/**
 * Traduction d'un produit pour l'affichage
 */
export interface CartProductTranslation {
  name: string;
  language?: string;
}

/**
 * Média d'un produit pour l'affichage
 */
export interface CartMedia {
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
}

/**
 * Produit dans le contexte du panier (pour affichage)
 */
export interface CartProduct {
  id?: string;
  slug: string;
  translations: CartProductTranslation[];
  media: CartMedia[];
}

/**
 * Inventaire pour l'affichage dans le panier
 */
export interface CartInventory {
  stock: number;
  trackInventory: boolean;
  allowBackorder: boolean;
}

/**
 * Variante dans le contexte du panier (pour affichage)
 */
export interface CartVariant {
  id: string;
  sku: string;
  pricing: CartPricing[];
  product: CartProduct;
  inventory?: CartInventory | null;
  media?: CartMedia[];
}

/**
 * Ligne de panier pour l'affichage
 */
export interface CartItem {
  id: string;
  quantity: number;
  variant: CartVariant;
}

/**
 * Panier complet pour l'affichage (structure complète avec toutes les relations)
 */
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
