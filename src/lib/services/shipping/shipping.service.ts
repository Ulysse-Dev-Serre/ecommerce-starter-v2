import {
  getShippingRates,
  Address,
  ShippingRate,
  Parcel,
  CustomsDeclaration,
} from '@/lib/integrations/shippo';
import { logger } from '@/lib/core/logger';
import { convertCurrency } from '@/lib/utils/currency';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  SITE_CURRENCY,
  SHIPPING_UNITS,
  SHIPPING_PROVIDERS_FILTER,
  SHIPPING_STRATEGIES,
  COUNTRY_TO_CURRENCY,
} from '@/lib/config/site';
import { PackingService, PackableItem, PackedParcel } from './packing.service';
import { ShippingItem, ShippingRepository } from './shipping.repository';
import { CustomsService } from './customs.service';

import { ShippingRequestInput } from '@/lib/validators/shipping';

export interface CalculateRatesResult {
  parcels: Parcel[];
  rates: ShippingRate[];
  customsDeclaration?: CustomsDeclaration;
  packingResult: PackedParcel[];
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
    const { items: bodyItems } = data;
    // 0. Standardize and validate destination address early
    const addressTo = this.validateAddress(
      data.addressTo,
      'Destination Address'
    );

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

    // 0. Sanitize and Normalize destination address (SSOT)
    addressTo = this.validateAddress(addressTo, 'Destination Address');

    // 1. Resolve Origin Address & Incoterm
    const firstProduct = items[0].variant.product;
    let originAddress: Address;
    let originIncoterm: string; // Zero Fallback: No default here, must be resolved from origin or fail

    if (firstProduct?.shippingOrigin) {
      const originData = firstProduct.shippingOrigin;
      if (!originData.address || typeof originData.address !== 'object') {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Origin address is invalid or missing for location: ${originData.name}. 0 Fallback Policy enforced.`,
          400
        );
      }

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
          shipmentId: (shipment as Record<string, unknown>).object_id,
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
      const errorMessage =
        shippoError instanceof Error
          ? shippoError.message
          : 'Unknown Shippo error';
      logger.error(
        {
          error: errorMessage,
          details: shippoError,
        },
        'Shippo Integration call failed'
      );

      throw new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Shipping carrier integration failed: ${errorMessage}`,
        502
      );
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
   * Strict validation and normalization for Address objects.
   * Handles multiple incoming formats (Stripe line1, Prisma postalCode, etc.)
   * Throws AppError if required fields are missing.
   */
  public static validateAddress(data: unknown, source: string): Address {
    if (!data || typeof data !== 'object') {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        `Invalid address data from ${source}`,
        400
      );
    }

    const d = data as Record<string, unknown>;

    // 1. Normalize Fields from common sources (Stripe, Prisma, DB)
    const normalized: Record<string, unknown> = { ...d };

    // Zip / Postal code
    if (!normalized.zip) {
      normalized.zip = d.zip || d.zipCode || d.postalCode || d.postal_code;
    }

    // Street / Line
    if (!normalized.street1) {
      normalized.street1 = d.street1 || d.line1;
    }
    if (!normalized.street2) {
      normalized.street2 = d.street2 || d.line2;
    }

    // Name
    if (!normalized.name && (d.firstName || d.lastName)) {
      normalized.name = `${d.firstName || ''} ${d.lastName || ''}`.trim();
    }

    // 2. Validate Required Fields
    const required = ['street1', 'city', 'country', 'zip', 'name'];
    for (const field of required) {
      if (!normalized[field]) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Incomplete address from ${source}. Missing required field: ${field}. (Zero Fallback Policy)`,
          400
        );
      }
    }

    // Country-specific validation for State/Province (Dynamic via site.ts)
    const country = String(normalized.country).toUpperCase();
    const isSupportedRegionalMarket =
      Object.keys(COUNTRY_TO_CURRENCY).includes(country);

    if (isSupportedRegionalMarket && !normalized.state) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        `State/Province is required for ${country} addresses (Regional Market) in ${source}. (Zero Fallback Policy)`,
        400
      );
    }

    return {
      name: String(normalized.name),
      company: normalized.company ? String(normalized.company) : '',
      street1: String(normalized.street1),
      street2: normalized.street2 ? String(normalized.street2) : '',
      city: String(normalized.city),
      state: normalized.state ? String(normalized.state) : '',
      zip: String(normalized.zip).replace(/\s+/g, ''), // Standardize zip
      country,
      phone: normalized.phone ? String(normalized.phone) : '',
      email: normalized.email ? String(normalized.email) : '',
    } as Address;
  }
}
