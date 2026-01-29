import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, Address, Parcel } from '@/lib/integrations/shippo';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { env } from '@/lib/core/env';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
import {
  shippingRequestSchema,
  ShippingRequestInput,
} from '@/lib/validators/shipping';
import { CAD_TO_USD_RATE, SITE_CURRENCY } from '@/lib/config/site';

// Initializing defaults (Will be overridden by DB values if found)
async function handler(
  req: NextRequest,
  _context: unknown,
  data: ShippingRequestInput
) {
  try {
    // Data is already validated by withValidation
    const { addressTo, cartId: bodyCartId } = data;

    // Sanitize ZIP code
    if (addressTo.zip) {
      addressTo.zip = addressTo.zip.replace(/\s+/g, '');
    }

    let cartId = req.cookies.get('cartId')?.value;

    if (!cartId && bodyCartId) {
      cartId = bodyCartId;
    }

    logger.info(
      { cartIdFound: !!cartId },
      'Attempting to fetch cart for shipping info'
    );

    let parcelLength = '';
    let parcelWidth = '';
    let parcelHeight = '';
    let totalWeight = 0; // Initialize to 0, will be updated by cart items

    let customsDeclaration = undefined;

    // Determine Origin Address
    // Priority: 1. Product specific origin, 2. Default Local Stock, 3. Environment Variables
    let originAddress: Address = {
      name: env.SHIPPO_FROM_NAME || '',
      street1: env.SHIPPO_FROM_STREET1 || '',
      street2: '',
      city: env.SHIPPO_FROM_CITY || '',
      state: env.SHIPPO_FROM_STATE || '',
      zip: env.SHIPPO_FROM_ZIP || '',
      country: env.SHIPPO_FROM_COUNTRY || '',
      phone: env.SHIPPO_FROM_PHONE || '',
      email: env.SHIPPO_FROM_EMAIL || '',
    };
    let usedSupplierId = null;

    let originIncoterm = 'DDU'; // Default

    if (cartId) {
      const cart = (await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  pricing: {
                    orderBy: { validFrom: 'desc' },
                    take: 1,
                  },
                  product: {
                    include: {
                      translations: true,
                      shippingOrigin: true,
                    },
                  },
                },
              } as any,
            },
          },
        },
      })) as any;

      if (cart && cart.items.length > 0) {
        logger.info({ itemCount: cart.items.length }, 'Cart found with items');

        // Check if the first item has a specific shipping origin
        const firstProduct = cart.items[0]?.variant?.product;

        if (firstProduct?.shippingOrigin) {
          const addr = firstProduct.shippingOrigin.address as any;
          if (addr && addr.street1) {
            originAddress = {
              name: firstProduct.shippingOrigin.name,
              street1: addr.street1,
              street2: addr.street2,
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              phone: addr.phone,
              email: addr.email,
            };
            usedSupplierId = firstProduct.shippingOrigin.id;
            originIncoterm =
              firstProduct.incoterm ||
              firstProduct.shippingOrigin.incoterm ||
              'DDU';
          }
        } else {
          // Try to find a default Local Stock supplier if no specific origin
          // Note: Ideally query this outside if we want it global, but per-cart context is fine
          const defaultSupplier = await prisma.supplier.findFirst({
            where: { type: 'LOCAL_STOCK', isActive: true },
            orderBy: { createdAt: 'asc' },
          });

          if (defaultSupplier && defaultSupplier.address) {
            const addr = defaultSupplier.address as any;
            originAddress = {
              name: defaultSupplier.name,
              street1: addr.street1,
              street2: addr.street2,
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              phone: addr.phone,
              email: addr.email,
            };
            usedSupplierId = defaultSupplier.id;
            originIncoterm = defaultSupplier.incoterm || 'DDU';
          }
        }

        logger.info(
          {
            usingOrigin: originAddress.name,
            supplierId: usedSupplierId,
            isDynamic: usedSupplierId !== null,
            incoterm: originIncoterm,
          },
          'Shipping Origin Determined'
        );

        let calculatedWeight = 0;
        let maxL = 0;
        let maxW = 0;
        let sumH = 0;

        cart.items.forEach((item: any) => {
          // Weight: Variant specific > Product default > 0
          let valW = item.variant?.weight ? Number(item.variant.weight) : 0;
          if (valW === 0 && item.variant?.product?.weight) {
            valW = Number(item.variant.product.weight);
          }
          calculatedWeight += valW * item.quantity;

          // Dimensions: Variant specific > Product default
          let dim = item.variant?.dimensions as any;
          if ((!dim || !dim.length) && item.variant?.product?.dimensions) {
            dim = item.variant.product.dimensions as any;
          }

          if (dim && dim.length && dim.width && dim.height) {
            const l = Number(dim.length) || 0;
            const width = Number(dim.width) || 0;
            const h = Number(dim.height) || 0;

            if (l > maxL) maxL = l;
            if (width > maxW) maxW = width;
            sumH += h * item.quantity; // Simple vertical stacking logic
          }
        });

        if (calculatedWeight > 0) {
          totalWeight = Math.round(calculatedWeight * 10) / 10;
        }

        if (maxL > 0 && maxW > 0 && sumH > 0) {
          parcelLength = maxL.toString();
          parcelWidth = maxW.toString();
          parcelHeight = sumH.toString();
        }

        // Customs Logic
        if (addressTo.country !== 'CA' && originAddress.country === 'CA') {
          logger.info({
            msg: 'International shipment detected. Preparing customs declaration.',
          });

          // Determine Customs Explanation (Product specific > Default)
          const exportExplanation =
            firstProduct?.exportExplanation || 'Merchandise';

          // Determine B13A (Env > Default)
          const b13aOption = env.SHIPPO_EXPORT_B13A_OPTION;
          const b13aNumber = env.SHIPPO_EXPORT_B13A_NUMBER;
          logger.info(
            { b13aOption, b13aNumber },
            'DEBUG: B13A Values from Env'
          );

          const customsItems = cart.items.map((item: any) => {
            const weight = item.variant?.weight
              ? Number(item.variant.weight)
              : 0.5;
            let unitPrice = '10.00';

            if (
              item.variant?.pricing &&
              Array.isArray(item.variant.pricing) &&
              item.variant.pricing.length > 0
            ) {
              unitPrice = item.variant.pricing[0].price?.toString() || '10.00';
            } else if (item.variant?.product?.price) {
              unitPrice = item.variant.product.price.toString();
            } else if (item.variant?.price?.amount) {
              unitPrice = item.variant.price.amount?.toString() || '10.00';
            }

            return {
              description: (
                item.variant?.product?.translations?.[0]?.name || 'Merchandise'
              ).trim(),
              quantity: item.quantity,
              netWeight: (Math.round(weight * 10) / 10).toString(),
              massUnit: 'kg' as const,
              valueAmount: unitPrice,
              valueCurrency: 'CAD',
              originCountry:
                item.variant?.product?.originCountry || originAddress.country,
              hsCode: item.variant?.product?.hsCode || undefined,
            };
          });

          customsDeclaration = {
            contentsType: 'MERCHANDISE' as const,
            contentsExplanation: exportExplanation,
            nonDeliveryOption: 'RETURN' as const,
            certify: true,
            certifySigner: originAddress.name,
            commercialInvoice: true,
            incoterm: originIncoterm as any,
            eelPfc: undefined,
            // Only send B13A info if explicitly required/filed.
            // For 'NOT_REQUIRED' (low value < 2K), omitting fields lets Shippo/Carrier handle exemption automatically.
            b13aFilingOption:
              b13aOption && b13aOption !== 'NOT_REQUIRED'
                ? b13aOption
                : undefined,
            b13aNumber:
              b13aOption && b13aOption !== 'NOT_REQUIRED'
                ? b13aNumber
                : undefined,
            items: customsItems,
          };
        } else {
          logger.info({
            msg: 'Domestic shipment. No customs declaration needed.',
          });
        }
      } else {
        logger.warn({ msg: 'Cart not found or empty when fetching rates' });
      }
    } else {
      logger.warn({ msg: 'No cartId cookie found properly' });
    }

    logger.info(
      {
        addressTo,
        totalWeight,
        hasCustoms: !!customsDeclaration,
        originAddress: originAddress.name,
        parcel: { l: parcelLength, w: parcelWidth, h: parcelHeight },
      },
      'Fetching shipping rates with dynamic origin'
    );

    const parcels = [
      {
        length: parcelLength,
        width: parcelWidth,
        height: parcelHeight,
        distanceUnit: 'cm' as const,
        weight: totalWeight.toString(),
        massUnit: 'kg' as const,
      },
    ];

    // DEBUG: Log full customs declaration for verification (ACEUM, HS Codes)
    if (customsDeclaration) {
      logger.info(
        {
          customsDeclaration,
          itemsDetail: (customsDeclaration as any).items.map((i: any) => ({
            desc: i.description,
            hsCode: i.hsCode,
            origin: i.originCountry,
            value: i.valueAmount,
          })),
        },
        'DEBUG: Full Customs Declaration Payload'
      );
    }

    // Call Shippo service with Dynamic Origin
    const shipment = await getShippingRates(
      originAddress,
      addressTo,
      parcels,
      customsDeclaration
    );

    // DEBUG: Log shipment details
    if (!shipment.rates || shipment.rates.length === 0) {
      logger.warn(
        { shipmentResponse: shipment },
        'Shippo returned 0 rates. Debugging details.'
      );
    }

    logger.info(
      { ratesCount: shipment.rates ? shipment.rates.length : 0 },
      'Shipping rates fetched successfully'
    );

    // FILTERING & RENAMING LOGIC
    // We want to simplify choices for the user: 1. Standard, 2. Express
    let filteredRates: any[] = [];

    if (shipment.rates) {
      let bestStandard: any = null;
      let bestExpress: any = null;

      for (const rate of shipment.rates) {
        const name = (rate.servicelevel.name || '').toLowerCase();
        const provider = (rate.provider || '').toLowerCase();

        // Focus on UPS as requested
        if (!provider.includes('ups')) continue;

        const price = parseFloat(rate.amount);
        let finalPrice = price;

        // CURRENCY CONVERSION (Shippo CAD -> Site USD)
        if (rate.currency === 'CAD' && SITE_CURRENCY === 'USD') {
          finalPrice = price * CAD_TO_USD_RATE;
          // Update the rate object to reflect the new currency/amount
          rate.amount = finalPrice.toFixed(2);
          rate.currency = 'USD';
        }

        // Helper to format time
        const formatTime = (r: any) => {
          if (r.duration_terms) {
            return r.duration_terms
              .replace(/days?/i, 'Jours')
              .replace(/day?/i, 'Jour')
              .trim();
          }
          if (r.days) {
            return `${r.days} Jour${r.days > 1 ? 's' : ''}`;
          }
          return null;
        };

        // 1. STANDARD Strategy
        if (name.includes('standard')) {
          if (!bestStandard || finalPrice < parseFloat(bestStandard.amount)) {
            bestStandard = { ...rate };
            bestStandard.displayName = 'Standard';
            bestStandard.displayTime = formatTime(rate) || '3-7 Jours';
          }
        }
        // 2. EXPRESS Strategy
        else if (
          (name.includes('express') || name.includes('saver')) &&
          !name.includes('early') &&
          !name.includes('plus') &&
          !name.includes('3 day')
        ) {
          if (!bestExpress || finalPrice < parseFloat(bestExpress.amount)) {
            bestExpress = { ...rate };
            bestExpress.displayName = 'Express';
            bestExpress.displayTime = formatTime(rate) || '1-3 Jours';
          }
        }
      }

      if (bestStandard) filteredRates.push(bestStandard);
      if (bestExpress) filteredRates.push(bestExpress);

      // Sort by price ascending
      filteredRates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    }

    logger.info(
      {
        originalCount: shipment.rates ? shipment.rates.length : 0,
        filteredCount: filteredRates.length,
      },
      'Shipping rates filtered and renamed'
    );

    return NextResponse.json({
      rates: filteredRates,
    });
  } catch (error) {
    logger.error({ error }, 'API Error /shipping/rates');
    throw error;
  }
}

export const POST = withError(
  withRateLimit(
    withValidation(shippingRequestSchema, handler),
    RateLimits.PUBLIC
  )
);
