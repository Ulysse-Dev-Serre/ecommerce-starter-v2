import { Address, CustomsDeclaration } from '@/lib/integrations/shippo';
import { ShippingItem } from './shipping.repository';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { SHIPPING_UNITS } from '@/lib/config/site';

export class CustomsService {
  /**
   * Prepares a customs declaration for international shipments.
   */
  static prepareDeclaration(
    originAddress: Address,
    addressTo: Address,
    items: ShippingItem[],
    originIncoterm: string
  ): CustomsDeclaration | undefined {
    // Only require customs for international shipments
    if (addressTo.country === originAddress.country) {
      return undefined;
    }

    if (!originAddress.name) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        'Missing sender name for customs declaration. Please check logistics settings.',
        400
      );
    }

    const firstProduct = items[0].variant.product;
    const exportExplanation = firstProduct.exportExplanation;

    if (!exportExplanation) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        'Missing export explanation for international shipment.',
        400
      );
    }

    const customsItems = items.map(item => {
      const variant = item.variant;
      const product = variant.product;
      const weight = variant.weight
        ? Number(variant.weight)
        : Number(product.weight);

      const description = product.translations?.[0]?.name?.trim();
      if (!description) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Missing description for customs (SKU: ${variant.sku})`,
          400
        );
      }

      const price = variant.pricing?.[0]?.price;
      const currency = variant.pricing?.[0]?.currency;

      if (price === undefined || price === null) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Missing price for customs declaration (SKU: ${variant.sku})`,
          400
        );
      }

      if (!product.originCountry) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Missing origin country for customs (SKU: ${variant.sku})`,
          400
        );
      }

      if (!currency) {
        throw new AppError(
          ErrorCode.SHIPPING_DATA_MISSING,
          `Missing currency for customs (SKU: ${variant.sku})`,
          400
        );
      }

      return {
        description,
        quantity: item.quantity,
        netWeight: weight.toString(),
        massUnit: SHIPPING_UNITS.MASS,
        valueAmount: price.toString(),
        valueCurrency: currency,
        originCountry: product.originCountry,
        hsCode: product.hsCode || undefined,
      };
    });

    return {
      contentsType: 'MERCHANDISE' as const,
      contentsExplanation: exportExplanation,
      nonDeliveryOption: 'RETURN' as const,
      certify: true,
      certifySigner: originAddress.name,
      commercialInvoice: true,
      incoterm: originIncoterm as 'DDP' | 'DDU',
      items: customsItems,
    };
  }
}
