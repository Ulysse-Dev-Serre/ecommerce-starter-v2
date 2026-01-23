import { Shippo } from 'shippo';
import { logger } from '@/lib/logger';
import { env } from '../env';

// Initialize Shippo only if API key is present, otherwise we relies on Mock mode or error out later
const shippoApiKey = env.SHIPPO_API_KEY;
const shippo = shippoApiKey ? new Shippo({ apiKeyHeader: shippoApiKey }) : null;

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

export interface Rate {
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

/**
 * Calculate shipping rates for a given shipment
 */
export async function getShippingRates(
  addressFrom: Address,
  addressTo: Address,
  parcels: Parcel[],
  customsDeclaration?: CustomsDeclaration
) {
  if (!shippo) {
    throw new Error('SHIPPO_API_KEY is not defined');
  }

  try {
    const carrierAccounts = env.SHIPPO_UPS_ACCOUNT_ID
      ? [env.SHIPPO_UPS_ACCOUNT_ID]
      : undefined;

    const shipment = await shippo.shipments.create({
      addressFrom: addressFrom,
      addressTo: addressTo,
      parcels: parcels,
      customsDeclaration: customsDeclaration as any,
      carrierAccounts: carrierAccounts,
      async: false,
    });

    return shipment;
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
}

/**
 * Calculate return shipping rates (inverses From/To and adds is_return flag)
 */
export async function getReturnShippingRates(
  addressFrom: Address, // This will be the CUSTOMER address
  addressTo: Address, // This will be YOUR WAREHOUSE address
  parcels: Parcel[],
  customsDeclaration?: CustomsDeclaration
) {
  if (!shippo) {
    throw new Error('SHIPPO_API_KEY is not defined');
  }

  try {
    // If shipping from outside CA (e.g. US), don't restrict to Canadian UPS account
    const carrierAccounts =
      addressFrom.country === 'CA' && env.SHIPPO_UPS_ACCOUNT_ID
        ? [env.SHIPPO_UPS_ACCOUNT_ID]
        : undefined;

    // ONLY use isReturn (scan-based) for domestic shipments.
    // International returns (US -> CA) usually don't support scan-based payment
    // and must be created as standard prepaid shipments.
    const isDomesticReturn = addressFrom.country === addressTo.country;

    const shipment = await shippo.shipments.create({
      addressFrom: addressFrom,
      addressTo: addressTo,
      parcels: parcels,
      customsDeclaration: customsDeclaration as any,
      carrierAccounts: carrierAccounts,
      extra: {
        isReturn: isDomesticReturn,
      },
      async: false,
    });

    return shipment;
  } catch (error) {
    console.error('Error creating return shipment:', error);
    throw error;
  }
}

/**
 * Purchase a label for a specific rate
 */
/**
 * Purchase a label for a specific rate
 */
export async function createTransaction(rateId: string) {
  if (!shippo) {
    throw new Error('SHIPPO_API_KEY is not defined');
  }

  try {
    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: 'PDF_4x6',
      async: false,
    });

    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export default shippo;
