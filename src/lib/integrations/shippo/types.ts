/**
 * Types pour l'intégration Shippo
 * Centralisés ici pour éviter la duplication
 */

export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string; // ISO 2 code (e.g. 'US', 'FR')
  phone?: string;
  email?: string;
}

export interface Parcel {
  length: string;
  width: string;
  height: string;
  distanceUnit: 'cm' | 'in' | 'ft' | 'mm' | 'm' | 'yd';
  weight: string;
  massUnit: 'g' | 'oz' | 'lb' | 'kg';
}

export interface CustomsItem {
  description: string;
  quantity: number;
  netWeight: string;
  massUnit: 'g' | 'oz' | 'lb' | 'kg';
  valueAmount: string;
  valueCurrency: string;
  originCountry: string; // ISO 2 code
  hsCode?: string;
}

export interface CustomsDeclaration {
  contentsType:
    | 'MERCHANDISE'
    | 'GIFT'
    | 'SAMPLE'
    | 'RETURN_MERCHANDISE'
    | 'HUMANITARIAN_DONATION'
    | 'DOCUMENTS'
    | 'OTHER';
  contentsExplanation?: string;
  incoterm?: 'DDP' | 'DDU';
  eelPfc?: string;
  b13aFilingOption?: string;
  b13aNumber?: string;
  nonDeliveryOption: 'RETURN' | 'ABANDON';
  certify: boolean;
  certifySigner: string;
  commercialInvoice?: boolean;
  items: CustomsItem[];
}

/**
 * Tarif de livraison retourné par Shippo
 * Type unifié pour éviter la duplication (anciennement dupliqué dans /lib/types/checkout.ts)
 */
export interface ShippingRate {
  objectId?: string;
  object_id?: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
  };
  days?: number;
  duration_terms?: string;
  // Champs ajoutés pour l'UI
  displayName?: string;
  displayTime?: string;
}

export interface Transaction {
  objectId?: string;
  object_id?: string;
  status: 'SUCCESS' | 'ERROR' | 'QUEUED' | 'WAITING' | string;
  trackingNumber?: string;
  tracking_number?: string;
  trackingUrl?: string;
  tracking_url?: string;
  labelUrl?: string;
  label_url?: string;
  messages?: { text: string; code?: string }[];
  provider?: string;
}
