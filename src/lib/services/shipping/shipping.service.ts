import {
  getShippingRates,
  Address,
  ShippingRate,
  Parcel,
  CustomsDeclaration,
} from '@/lib/integrations/shippo';
import { logger } from '@/lib/core/logger';
import { env } from '@/lib/core/env';
import { convertCurrency } from '@/lib/utils/currency';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  SITE_CURRENCY,
  SHIPPING_UNITS,
  DEFAULT_SHIPPING_INCOTERM,
  SHIPPING_PROVIDERS_FILTER,
  SHIPPING_STRATEGIES,
} from '@/lib/config/site';
import { PackingService, PackableItem } from './packing.service';
import { ShippingItem, ShippingRepository } from './shipping.repository';
import { CustomsService } from './customs.service';

import { ShippingRequestInput } from '@/lib/validators/shipping';

export interface CalculateRatesResult {
  parcels: Parcel[];
  rates: ShippingRate[];
  customsDeclaration?: CustomsDeclaration;
  packingResult: any;
}

/**
 * Orchestrator Service for Shipping.
 * Decoupled from Persistence (Prisma) and Domain Logic (Customs, Packing).
 */
export class ShippingService {
  /**
   * Main entry point for fetching shipping rates.
   * Standardizes input, resolves items, calculates rates, and applying filtering.
   */
  static async getShippingRates(
    cartId: string | undefined,
    data: ShippingRequestInput
  ): Promise<ShippingRate[]> {
    logger.info(
      { cartId, addressTo: data.addressTo },
      'Service received shipping rates request'
    );
    const { addressTo, items: bodyItems } = data;

    // Standardize zip code
    if (addressTo.zip) {
      addressTo.zip = addressTo.zip.replace(/\s+/g, '');
    }

    // 1. Resolve shipping items (Enriched from Prisma via Repository)
    const shippingItems = await ShippingRepository.resolveItems(
      cartId,
      bodyItems
    );

    if (shippingItems.length === 0) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        'No shipping items found.',
        400
      );
    }

    // 2. Fetch raw rates via 3D packing and Shippo
    const { rates: rawRates } = await this.calculateRates(
      addressTo,
      shippingItems
    );

    // 3. Filter, convert currency and label the rates
    return this.filterAndLabelRates(rawRates);
  }

  /**
   * Calculates shipping rates using 3D Packing and Shippo.
   * Orchestrates Repository, PackingService, and CustomsService.
   */
  static async calculateRates(
    addressTo: Address,
    items: ShippingItem[]
  ): Promise<CalculateRatesResult> {
    if (items.length === 0) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        'No shipping items found.',
        400
      );
    }

    // 0. Sanitize destination address (ensure no nulls from DB)
    addressTo = this.validateAddress(addressTo, 'Destination Address');

    // Standardize zip code
    if (addressTo.zip) {
      addressTo.zip = addressTo.zip.replace(/\s+/g, '');
    }

    // 1. Resolve Origin Address & Incoterm
    const firstProduct = items[0].variant.product;
    let originAddress: Address;
    let originIncoterm = DEFAULT_SHIPPING_INCOTERM;

    if (firstProduct?.shippingOrigin) {
      const originData = firstProduct.shippingOrigin;
      originAddress = this.validateAddress(
        { ...(originData.address as object), name: originData.name },
        `Shipping Origin: ${originData.name}`
      );
      if (!originData.incoterm) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Incoterm is missing for shipping origin: ${originData.name}. 0 Fallback Policy: Please configure an Incoterm (DDP/DDU) for this location.`,
          400
        );
      }
      originIncoterm = originData.incoterm;
    } else {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        `Shipping origin missing for product ${firstProduct.translations?.[0]?.name || firstProduct.id}. 0 Fallback Policy: Please configure a shipping origin for this product.`,
        400
      );
    }

    // 2. Prepare packable items for the PackingService
    const packableItems: PackableItem[] = items.map(item => {
      const variant = item.variant;
      const product = variant.product;
      const weight = variant.weight
        ? Number(variant.weight)
        : Number(product.weight);
      const dim = (variant.dimensions || product.dimensions) as {
        width?: number;
        length?: number;
        height?: number;
      } | null;

      if (!weight || !dim || !dim.width || !dim.length || !dim.height) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Missing dimensions or weight for SKU: ${variant.sku}`,
          400
        );
      }

      return {
        id: variant.sku,
        width: Number(dim.width),
        length: Number(dim.length),
        height: Number(dim.height),
        weight: weight,
        quantity: item.quantity,
      };
    });

    // 3. Optimized 3D packing selection
    const packedParcelsResult = PackingService.pack(packableItems);

    if (packedParcelsResult.length === 0) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        'No suitable box found for the items in our catalog.',
        400
      );
    }

    // 4. Map to Shippo Parcels
    const parcels: Parcel[] = packedParcelsResult.map(p => ({
      length: p.length.toString(),
      width: p.width.toString(),
      height: p.height.toString(),
      distanceUnit: SHIPPING_UNITS.DISTANCE,
      weight: p.weight.toString(),
      massUnit: SHIPPING_UNITS.MASS,
    }));

    // 5. Customs Declaration (Delegated to CustomsService)
    const customsDeclaration = CustomsService.prepareDeclaration(
      originAddress,
      addressTo,
      items,
      originIncoterm
    );

    // 6. Fetch rates from Shippo
    try {
      logger.info(
        {
          origin: originAddress,
          destination: addressTo,
          parcelsCount: parcels.length,
          hasCustoms: !!customsDeclaration,
        },
        'Calling Shippo Integration'
      );

      const shipment = await getShippingRates(
        originAddress,
        addressTo,
        parcels,
        customsDeclaration
      );

      logger.info(
        {
          ratesCount: shipment.rates?.length || 0,
          shipmentId: (shipment as any).object_id,
        },
        'Shippo Integration responded successfully'
      );

      return {
        parcels,
        rates: (shipment.rates || []) as ShippingRate[],
        customsDeclaration,
        packingResult: packedParcelsResult,
      };
    } catch (shippoError) {
      logger.error(
        {
          error:
            shippoError instanceof Error ? shippoError.message : 'Shippo Error',
          details: shippoError,
        },
        'Shippo Integration call failed'
      );
      throw shippoError;
    }
  }

  /**
   * Filters, converts currency, and labels shipping rates based on strategies.
   * Centralizes post-processing of Shippo rates.
   */
  static filterAndLabelRates(rawRates: ShippingRate[]): ShippingRate[] {
    let filteredRates: ShippingRate[] = [];

    let bestStandard: ShippingRate | null = null;
    let bestExpress: ShippingRate | null = null;

    logger.info({ count: rawRates.length }, 'Processing raw shipping rates');
    for (const rate of rawRates) {
      logger.info(
        {
          provider: rate.provider,
          service: rate.servicelevel?.name,
          amount: rate.amount,
          currency: rate.currency,
        },
        'Raw rate found'
      );
      const name = (rate.servicelevel?.name || '').toLowerCase();
      const provider = (rate.provider || '').toLowerCase();

      // 1. Provider Filter
      if (
        SHIPPING_PROVIDERS_FILTER.length > 0 &&
        !SHIPPING_PROVIDERS_FILTER.some(p => provider.includes(p.toLowerCase()))
      ) {
        continue;
      }

      // 2. Currency Conversion
      let finalPrice = parseFloat(rate.amount);
      try {
        if (rate.currency !== SITE_CURRENCY) {
          finalPrice = convertCurrency(
            finalPrice,
            rate.currency,
            SITE_CURRENCY
          );
          rate.amount = finalPrice.toFixed(2);
          rate.currency = SITE_CURRENCY;
        }
      } catch (error) {
        logger.error(
          { from: rate.currency, to: SITE_CURRENCY, error },
          'Currency conversion failed. Skipping rate.'
        );
        continue;
      }

      // 3. Strategy Classification
      const isStandard =
        SHIPPING_STRATEGIES.STANDARD.KEYWORDS.some(k => name.includes(k)) &&
        !SHIPPING_STRATEGIES.STANDARD.EXCLUDES.some(k => name.includes(k));

      if (isStandard) {
        if (!bestStandard || finalPrice < parseFloat(bestStandard.amount)) {
          bestStandard = {
            ...rate,
            displayName: SHIPPING_STRATEGIES.STANDARD.LABEL,
            displayTime:
              rate.duration_terms ||
              (rate.days ? String(rate.days) : undefined),
          };
        }
      } else {
        const isExpress =
          SHIPPING_STRATEGIES.EXPRESS.KEYWORDS.some(k => name.includes(k)) &&
          !SHIPPING_STRATEGIES.EXPRESS.EXCLUDES.some(k => name.includes(k));

        if (isExpress) {
          if (!bestExpress || finalPrice < parseFloat(bestExpress.amount)) {
            bestExpress = {
              ...rate,
              displayName: SHIPPING_STRATEGIES.EXPRESS.LABEL,
              displayTime:
                rate.duration_terms ||
                (rate.days ? String(rate.days) : undefined),
            };
          }
        }
      }
    }

    if (bestStandard) filteredRates.push(bestStandard);
    if (bestExpress) filteredRates.push(bestExpress);

    // Sort by price (cheapest first)
    return filteredRates.sort(
      (a, b) => parseFloat(a.amount) - parseFloat(b.amount)
    );
  }

  /**
   * Strict validation for Address objects.
   * Throws AppError if required fields are missing.
   */
  private static validateAddress(data: any, source: string): Address {
    if (!data || typeof data !== 'object') {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        `Invalid address data from ${source}`,
        400
      );
    }

    // Map postalCode to zip if missing
    if (!data.zip && data.postalCode) {
      data.zip = data.postalCode;
    }

    const required = ['street1', 'city', 'country', 'zip', 'name'];
    for (const field of required) {
      if (!data[field]) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Incomplete address from ${source}. Missing required field: ${field}.`,
          400
        );
      }
    }

    return {
      name: String(data.name),
      company: data.company ? String(data.company) : '',
      street1: String(data.street1),
      street2: data.street2 ? String(data.street2) : '',
      city: String(data.city),
      state: data.state ? String(data.state) : '',
      zip: String(data.zip),
      country: String(data.country),
      phone: data.phone ? String(data.phone) : '',
      email: data.email ? String(data.email) : '',
    };
  }
}
