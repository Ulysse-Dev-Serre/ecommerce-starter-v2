import { prisma } from '@/lib/db/prisma';
import { SITE_CURRENCY } from '@/lib/constants';
import { getOrCreateCart } from '@/lib/services/cart.service';
import { Language } from '@/generated/prisma';

export interface CheckoutSummaryParams {
  userId?: string;
  anonymousId?: string;
  locale: string;
  directVariantId?: string;
  directQuantity?: string;
}

export interface CheckoutSummaryResult {
  currency: string;
  initialTotal: number;
  cartId: string;
  summaryItems: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: string;
    image?: string;
  }>;
}

export class CheckoutService {
  static async getCheckoutSummary({
    userId,
    anonymousId,
    locale,
    directVariantId,
    directQuantity,
  }: CheckoutSummaryParams): Promise<CheckoutSummaryResult | null> {
    const currency = SITE_CURRENCY;
    let initialTotal = 0;
    let currentCartId = '';
    const summaryItems: CheckoutSummaryResult['summaryItems'] = [];

    if (directVariantId && directQuantity) {
      // Direct Purchase Mode
      currentCartId = 'direct_purchase';

      const variant = await prisma.productVariant.findUnique({
        where: { id: directVariantId },
        include: {
          pricing: true,
          media: { take: 1, orderBy: { sortOrder: 'asc' } },
          product: {
            include: {
              translations: {
                where: { language: locale.toUpperCase() as Language },
              },
              media: { take: 1, orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      if (variant) {
        const priceRecord = variant.pricing.find(p => p.currency === currency);
        const price = Number(priceRecord?.price || 0);
        initialTotal = price * parseInt(directQuantity);

        const image = (variant.media[0]?.url ||
          (variant.product as any).media[0]?.url) as string | undefined;

        summaryItems.push({
          name:
            variant.product.translations[0]?.name ||
            variant.product.slug + (variant.sku ? ` (${variant.sku})` : ''),
          quantity: parseInt(directQuantity),
          price: price,
          currency: currency,
          image: image,
        });
      }
    } else {
      // Standard Cart Mode
      if (!userId && !anonymousId) {
        return null; // Signal that redirect is needed or no cart available
      }

      const cart = await getOrCreateCart(userId, anonymousId);

      if (!cart || cart.items.length === 0) {
        return null; // Empty cart
      }

      currentCartId = cart.id;
      initialTotal = Number(
        cart.items.reduce((acc, item) => {
          const priceRecord = item.variant.pricing.find(
            p => p.currency === SITE_CURRENCY
          );

          const price = Number(priceRecord?.price || 0);
          const image = item.variant.media[0]?.url;

          summaryItems.push({
            name:
              item.variant.product.translations[0]?.name ||
              item.variant.product.slug,
            quantity: item.quantity,
            price: price,
            currency: SITE_CURRENCY,
            image: image,
          });

          return acc + price * item.quantity;
        }, 0)
      );
    }

    return {
      currency,
      initialTotal,
      cartId: currentCartId,
      summaryItems,
    };
  }
}
