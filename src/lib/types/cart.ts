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
