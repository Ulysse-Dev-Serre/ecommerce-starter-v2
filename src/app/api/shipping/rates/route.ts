import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, Address, Parcel } from '@/lib/services/shippo';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withError } from '@/lib/middleware/withError';

// Schema validation aligning with frontend
const shippingRequestSchema = z.object({
  addressTo: z.object({
    name: z.string(),
    street1: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

// Default warehouse address (Fallback)
const WAREHOUSE_ADDRESS: Address = {
  name: 'AgTechNest Warehouse',
  street1: '123 Tech Blvd',
  city: 'Montreal',
  state: 'QC',
  zip: 'H2X 1Y6',
  country: 'CA',
};

// Default parcel configuration (unused mostly if we define parcels dynamically)
const DEFAULT_PARCEL: Parcel = {
  length: '20',
  width: '15',
  height: '10',
  distanceUnit: 'cm',
  weight: '1',
  massUnit: 'kg',
};

async function handler(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = shippingRequestSchema.safeParse(body);

    if (!result.success) {
      logger.warn(
        { error: 'Zod validation failed' },
        'Invalid address data for shipping rates'
      );
      return NextResponse.json(
        { error: 'Invalid address data' },
        { status: 400 }
      );
    }

    const { addressTo } = result.data;

    // Sanitize ZIP code
    if (addressTo.zip) {
      addressTo.zip = addressTo.zip.replace(/\s+/g, '');
    }

    let cartId = req.cookies.get('cartId')?.value;

    if (!cartId && body.cartId) {
      cartId = body.cartId;
    }

    logger.info(
      { cartIdFound: !!cartId },
      'Attempting to fetch cart for shipping info'
    );

    let totalWeight = 1; // Default fallback
    let customsDeclaration = undefined;

    // Determine Origin Address
    // Priority: 1. Product specific origin, 2. Default Local Stock, 3. Hardcoded Fallback
    let originAddress = WAREHOUSE_ADDRESS;
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
        cart.items.forEach((item: any) => {
          const w = item.variant?.weight ? Number(item.variant.weight) : 0;
          calculatedWeight += w * item.quantity;
        });

        if (calculatedWeight > 0) totalWeight = calculatedWeight;

        // Customs Logic
        if (addressTo.country !== 'CA' && originAddress.country === 'CA') {
          logger.info({
            msg: 'International shipment detected. Preparing customs declaration.',
          });

          // Determine Customs Explanation (Product specific > Default)
          const exportExplanation =
            firstProduct?.exportExplanation || 'Merchandise';

          // Determine B13A (Env > Default)
          const b13aOption =
            process.env.SHIPPO_EXPORT_B13A_OPTION || 'NOT_REQUIRED';
          const b13aNumber =
            process.env.SHIPPO_EXPORT_B13A_NUMBER || 'NO B13A REQUIRED';
          const eelPfc = process.env.SHIPPO_EXPORT_EEL_PFC || 'NOEEI_30_37_a';

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
              netWeight: weight.toString(),
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
            incoterm: originIncoterm as any,
            eelPfc: eelPfc,
            b13aFilingOption: b13aOption,
            b13aNumber: b13aNumber,
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
      },
      'Fetching shipping rates with dynamic origin'
    );

    const parcels = [
      {
        length: '20',
        width: '15',
        height: '10',
        distanceUnit: 'cm' as const,
        weight: totalWeight.toString(),
        massUnit: 'kg' as const,
      },
    ];

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

    return NextResponse.json({
      rates: shipment.rates,
    });
  } catch (error) {
    logger.error({ error }, 'API Error /shipping/rates');
    throw error;
  }
}

export const POST = withError(withRateLimit(handler, RateLimits.PUBLIC));
