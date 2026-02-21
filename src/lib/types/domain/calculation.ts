import { Prisma, Decimal } from '@/generated/prisma';

import { SupportedCurrency } from '@/lib/config/site';

/**
 * Types centralisés pour le domaine Calculation
 * Utilisés pour les calculs de prix, taxes et totaux
 */

export type Currency = SupportedCurrency;

/**
 * Représente une ligne de panier calculée
 */
export interface CalculatedLineItem {
  cartItemId: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: Decimal;
  lineTotal: Decimal;
  currency: Currency;
}

/**
 * Résultat complet d'un calcul de panier
 */
export interface CartCalculation {
  currency: Currency;
  items: CalculatedLineItem[];
  subtotal: Decimal;
  itemCount: number;
  calculatedAt: Date;
}

/**
 * Résultat de validation du panier pour le checkout
 */
export interface CartValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Format sérialisé d'un calcul (pour transfert API)
 */
export interface SerializedCartCalculation {
  currency: Currency;
  items: Array<{
    cartItemId: string;
    variantId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    currency: Currency;
  }>;
  subtotal: string;
  itemCount: number;
  calculatedAt: string;
}
