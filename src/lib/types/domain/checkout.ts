import { SupportedCurrency } from '@/lib/config/site';

/**
 * Types centralisés pour le domaine Checkout
 * Utilisés par les services checkout et les intégrations de paiement
 */

// ==================== Types de Base ====================

/**
 * Devise supportée pour le checkout
 */
export type CheckoutCurrency = SupportedCurrency;

/**
 * Item dans un panier ou checkout
 * Structure commune pour éviter la duplication
 */
export interface CheckoutItem {
  variantId: string;
  quantity: number;
}

/**
 * Item détaillé dans le résumé de checkout
 * Contient les informations d'affichage
 */
export interface CheckoutSummaryItem {
  name: string;
  quantity: number;
  price: number;
  currency: CheckoutCurrency;
  image?: string;
}

// ==================== Inputs (Paramètres) ====================

/**
 * Paramètres pour générer un résumé de checkout
 * Supporte deux modes :
 * 1. Standard : depuis un panier existant (userId/anonymousId)
 * 2. Direct Purchase : achat rapide d'un produit (directVariantId)
 */
export interface CheckoutSessionInput {
  userId?: string;
  anonymousId?: string;
  locale: string;
  // Mode Direct Purchase
  directVariantId?: string;
  directQuantity?: string;
}

/**
 * Paramètres pour créer une session Stripe Checkout
 */
export interface StripeCheckoutInput {
  items: CheckoutItem[];
  currency: CheckoutCurrency;
  userId?: string;
  cartId?: string;
  anonymousId?: string;
  successUrl: string;
  cancelUrl: string;
}

// ==================== Outputs (Résultats) ====================

/**
 * Résumé de checkout calculé
 * Utilisé pour afficher le récapitulatif avant paiement
 */
export interface CheckoutSummary {
  currency: CheckoutCurrency;
  initialTotal: number;
  cartId: string;
  summaryItems: CheckoutSummaryItem[];
}

/**
 * Résultat de validation de checkout
 * Utilisé avant de créer la session de paiement
 */
export interface CheckoutValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Contexte de checkout pour tracking
 */
export interface CheckoutContext {
  cartId?: string;
  userId?: string;
  anonymousId?: string;
  currency: CheckoutCurrency;
  itemCount: number;
  totalAmount: number;
}

// ==================== Intent Options ====================

export interface CreateIntentOptions {
  cartId: string;
  currency: CheckoutCurrency;
  locale: string;
  directItem?: {
    variantId: string;
    quantity: number;
  };
}

export interface UpdateIntentOptions {
  paymentIntentId: string;
  shippingRate: any;
  currency: CheckoutCurrency;
  shippingDetails: any;
}
