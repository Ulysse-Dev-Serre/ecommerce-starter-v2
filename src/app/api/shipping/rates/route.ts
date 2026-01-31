import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, Address } from '@/lib/integrations/shippo';
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

const DEFAULT_CUSTOMS_DESCRIPTION = 'Merchandise';

// --- HELPER: Format Delivery Time ---
function formatDeliveryTime(rate: any) {
  if (rate.duration_terms) {
    return rate.duration_terms
      .replace(/days?/i, 'Jours')
      .replace(/day?/i, 'Jour')
      .trim();
  }
  if (rate.days) {
    return `${rate.days} Jour${rate.days > 1 ? 's' : ''}`;
  }
  return null;
}

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

    // --- STEP 1: Determine Origin Address ---
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
      const cart = await prisma.cart.findUnique({
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
              },
            },
          },
        },
      });

      if (cart && cart.items.length > 0) {
        logger.info({ itemCount: cart.items.length }, 'Cart found with items');

        // Check if the first item has a specific shipping origin
        const firstItem = cart.items[0];
        const firstVariant = firstItem.variant;
        const firstProduct = firstVariant?.product;

        if (firstProduct?.shippingOrigin) {
          const originData = firstProduct.shippingOrigin;
          const addr = originData.address as unknown as {
            street1: string;
            street2?: string;
            city: string;
            state: string;
            zip: string;
            country: string;
            phone?: string;
            email?: string;
          };

          if (addr && addr.street1) {
            originAddress = {
              name: originData.name,
              street1: addr.street1,
              street2: addr.street2 || '',
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              phone: addr.phone || '',
              email: addr.email || '',
            };
            usedSupplierId = originData.id;
            originIncoterm =
              firstProduct.incoterm || originData.incoterm || 'DDU';
          }
        } else {
          // Try to find a default Local Stock supplier
          const defaultSupplier = await prisma.supplier.findFirst({
            where: { type: 'LOCAL_STOCK', isActive: true },
            orderBy: { createdAt: 'asc' },
          });

          if (defaultSupplier && defaultSupplier.address) {
            const addr = defaultSupplier.address as unknown as {
              street1: string;
              street2?: string;
              city: string;
              state: string;
              zip: string;
              country: string;
              phone?: string;
              email?: string;
            };

            originAddress = {
              name: defaultSupplier.name,
              street1: addr.street1,
              street2: addr.street2 || '',
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              phone: addr.phone || '',
              email: addr.email || '',
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

        // --- STEP 2: Calculate Parcel Dimensions (Basic Stacking) ---
        let calculatedWeight = 0;
        let maxL = 0;
        let maxW = 0;
        let sumH = 0;

        cart.items.forEach(item => {
          const variant = item.variant;
          const product = variant?.product;

          // Weight: Variant specific > Product default > 0
          let valW = variant?.weight ? Number(variant.weight) : 0;
          if (valW === 0 && product?.weight) {
            valW = Number(product.weight);
          }
          calculatedWeight += valW * item.quantity;

          // Dimensions: Variant specific > Product default
          let dim: any = variant?.dimensions;
          if (!dim && product?.dimensions) {
            dim = product.dimensions;
          }

          // Parse dimensions from JSON object { length, width, height }
          const l = Number(dim?.length || 0);
          const w = Number(dim?.width || 0);
          const h = Number(dim?.height || 0);

          if (l > 0 && w > 0 && h > 0) {
            maxL = Math.max(maxL, l);
            maxW = Math.max(maxW, w);
            sumH += h * item.quantity;
          }
        });

        if (calculatedWeight > 0) {
          totalWeight = Math.round(calculatedWeight * 10) / 10;
        }
        if (totalWeight <= 0) {
          const errorMsg =
            'Critical Data Error: Total shipment weight is 0. Please verify product weights.';
          logger.error({ cartId }, errorMsg);
          throw new Error(
            'Unable to calculate shipping: Invalid shipment weight.'
          );
        }

        if (maxL > 0 && maxW > 0 && sumH > 0) {
          parcelLength = maxL.toString();
          parcelWidth = maxW.toString();
          parcelHeight = sumH.toString();
        } else {
          const errorMsg =
            'Critical Data Error: No dimensions found for products in cart. Cannot calculate shipping rates.';
          logger.error({ cartId }, errorMsg);
          throw new Error(
            'Unable to calculate shipping: Missing product dimensions.'
          );
        }

        // --- STEP 3: Customs Declaration (International Only) ---
        if (addressTo.country !== 'CA' && originAddress.country === 'CA') {
          logger.info({
            msg: 'International shipment detected. Preparing customs declaration.',
          });

          // Determine Customs Explanation (Product specific > Default)
          const exportExplanation =
            firstProduct?.exportExplanation || DEFAULT_CUSTOMS_DESCRIPTION;

          // Determine B13A (Env > Default)
          const b13aOption = env.SHIPPO_EXPORT_B13A_OPTION;
          const b13aNumber = env.SHIPPO_EXPORT_B13A_NUMBER;

          const customsItems = cart.items.map(item => {
            const variant = item.variant;
            const product = variant?.product;

            const weight = variant?.weight ? Number(variant.weight) : 0.5;
            if (
              !variant?.pricing ||
              !Array.isArray(variant.pricing) ||
              variant.pricing.length === 0 ||
              !variant.pricing[0].price
            ) {
              const errorMsg = `Critical Data Error: Missing price for variant SKU: ${
                variant?.sku || 'UNKNOWN'
              }. Cannot generate customs declaration.`;
              logger.error({ variantId: variant?.id }, errorMsg);
              throw new Error(errorMsg);
            }

            const unitPrice = variant.pricing[0].price.toString();

            const description = (
              product?.translations?.[0]?.name || DEFAULT_CUSTOMS_DESCRIPTION
            ).trim();

            return {
              description,
              quantity: item.quantity,
              netWeight: (Math.round(weight * 10) / 10).toString(),
              massUnit: 'kg' as const,
              valueAmount: unitPrice,
              valueCurrency: 'CAD',
              originCountry: product?.originCountry || originAddress.country,
              hsCode: product?.hsCode || undefined,
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

    // DEBUG: Log full customs declaration for verification
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

    // --- STEP 4: Call Shippo Service ---
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

    // --- STEP 5: Filtering & Renaming Logic ---
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
          rate.amount = finalPrice.toFixed(2);
          rate.currency = 'USD';
        }

        // 1. STANDARD Strategy
        if (name.includes('standard')) {
          if (!bestStandard || finalPrice < parseFloat(bestStandard.amount)) {
            bestStandard = { ...rate };
            bestStandard.displayName = 'Standard';
            bestStandard.displayTime = formatDeliveryTime(rate) || '3-7 Jours';
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
            bestExpress.displayTime = formatDeliveryTime(rate) || '1-3 Jours';
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
