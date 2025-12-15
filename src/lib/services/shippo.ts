import { Shippo } from 'shippo';

if (!process.env.SHIPPO_API_KEY) {
  throw new Error('SHIPPO_API_KEY is not defined in environment variables');
}

const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY });

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

/**
 * Calculate shipping rates for a given shipment
 */
export async function getShippingRates(
  addressFrom: Address,
  addressTo: Address,
  parcels: Parcel[]
) {
  try {
    const shipment = await shippo.shipments.create({
      addressFrom: addressFrom,
      addressTo: addressTo,
      parcels: parcels,
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
  try {
    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: 'PDF',
      async: false,
    });

    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export default shippo;
