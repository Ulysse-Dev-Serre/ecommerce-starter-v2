/**
 * Types UI pour les composants Checkout
 * Ces types sont spécifiques à l'affichage et aux formulaires
 * Ne doivent PAS être utilisés dans les services backend
 */

/**
 * Format d'adresse pour le formulaire de checkout (format Stripe)
 * Utilisé dans les composants de formulaire d'adresse
 */
export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/**
 * Note: ShippingRate a été déplacé vers /lib/integrations/shippo/types.ts
 * car c'est un type lié à l'API Shippo, pas spécifique à l'UI
 */
