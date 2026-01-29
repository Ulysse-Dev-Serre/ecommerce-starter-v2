/**
 * Adresse de shipping/facturation
 */
export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  name?: string;
  street1?: string;
  street2?: string;
  line1?: string;
  line2?: string;
  city: string;
  state: string;
  postalCode?: string;
  postal_code?: string;
  zip?: string;
  country: string;
  phone?: string;
  email?: string;
}

/**
 * Tarif de livraison (Shippo)
 */
export interface ShippingRate {
  objectId: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
  };
  estimatedDays: number;
  durationTerms: string;
}

/**
 * Détails d'une transaction shipping (Shippo)
 */
export interface ShippingTransaction {
  objectId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  commercialInvoiceUrl?: string;
  rate: string;
}

/**
 * Étiquette de livraison
 */
export interface ShippingLabel {
  carrier: string;
  trackingCode: string;
  trackingUrl: string;
  labelUrl: string;
  shippoTransactionId: string;
}

/**
 * Informations de tracking
 */
export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  status?: string;
  estimatedDelivery?: Date;
}
