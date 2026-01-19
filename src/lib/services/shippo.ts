import { Shippo } from 'shippo';
import { logger } from '@/lib/logger';

// Initialize Shippo only if API key is present, otherwise we relies on Mock mode or error out later
const shippoApiKey = process.env.SHIPPO_API_KEY;
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
    | 'RETURN'
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
 * Calculate shipping rates for a given shipment
 */
export async function getShippingRates(
  addressFrom: Address,
  addressTo: Address,
  parcels: Parcel[],
  customsDeclaration?: CustomsDeclaration
) {
  // MOCK MODE
  if (process.env.SHIPPO_MOCK_MODE === 'true') {
    logger.info({ msg: 'SHIPPO: Mock mode enabled, returning fake rates' });
    return {
      object_status: 'SUCCESS',
      rates: [
        {
          object_id: 'mock_rate_standard_' + Date.now(),
          amount: '15.00',
          currency: 'CAD',
          provider: 'MOCK_POST',
          servicelevel: {
            name: 'Standard Mock',
            token: 'mock_std',
          },
          days: 3,
          duration_terms: '3-5 days',
          attributes: [],
        },
        {
          object_id: 'mock_rate_express_' + Date.now(),
          amount: '25.00',
          currency: 'CAD',
          provider: 'MOCK_POST',
          servicelevel: {
            name: 'Express Mock',
            token: 'mock_exp',
          },
          days: 1,
          duration_terms: '1 day',
          attributes: [],
        },
      ],
    };
  }

  if (!shippo) {
    throw new Error('SHIPPO_API_KEY is not defined and Mock mode is disabled');
  }

  try {
    const carrierAccounts = process.env.SHIPPO_UPS_ACCOUNT_ID
      ? [process.env.SHIPPO_UPS_ACCOUNT_ID]
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
 * Purchase a label for a specific rate
 */
export async function createTransaction(rateId: string) {
  // MOCK MODE
  if (process.env.SHIPPO_MOCK_MODE === 'true') {
    logger.info(
      { rateId },
      'SHIPPO: Mock mode enabled, creating fake transaction'
    );

    // Simulate error if rateId contains "fail"
    if (rateId.includes('fail')) {
      return {
        status: 'ERROR',
        messages: [{ text: 'Simulated failure in mock mode' }],
      };
    }

    return {
      status: 'SUCCESS',
      object_id: 'mock_trans_' + Date.now(),
      tracking_number: 'MOCK' + Date.now(),
      tracking_url: 'https://shippo-delivery.com/mock/' + Date.now(),
      label_url: 'https://placehold.co/600x400/png?text=Shipping+Label+Mock', // Valid imitation URL
      rate: rateId,
    };
  }

  if (!shippo) {
    throw new Error('SHIPPO_API_KEY is not defined and Mock mode is disabled');
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
