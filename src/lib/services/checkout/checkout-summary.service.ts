import { prisma } from '@/lib/core/db';
import { SITE_CURRENCY } from '@/lib/config/site';
import { getOrCreateCart } from '@/lib/services/cart';
import { Language } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import {
  CheckoutSessionInput,
  CheckoutSummary,
  CheckoutSummaryItem,
} from '@/lib/types/domain/checkout';

/**
 * Calcule le résumé de checkout
 * Supporte deux modes :
 * 1. Standard : depuis un panier existant (userId/anonymousId)
 * 2. Direct Purchase : achat rapide d'un produit (directVariantId)
 *
 * @param params - Paramètres de session checkout
 * @returns Résumé de checkout ou null si panier vide/invalide
 */
export async function getCheckoutSummary(
  params: CheckoutSessionInput
): Promise<CheckoutSummary | null> {
  const { userId, anonymousId, locale, directVariantId, directQuantity } =
    params;

  const currency = SITE_CURRENCY;
  let initialTotal = 0;
  let currentCartId = '';
  const summaryItems: CheckoutSummaryItem[] = [];

  // Mode Direct Purchase
  if (directVariantId && directQuantity) {
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

      const image = variant.media[0]?.url || variant.product.media[0]?.url;

      summaryItems.push({
        name:
          variant.product.translations[0]?.name ||
          variant.product.slug + (variant.sku ? ` (${variant.sku})` : ''),
        quantity: parseInt(directQuantity),
        price: price,
        currency: currency,
        image: image,
      });

      logger.info(
        {
          action: 'checkout_summary_direct',
          variantId: directVariantId,
          quantity: directQuantity,
          total: initialTotal,
        },
        'Direct purchase checkout summary calculated'
      );
    }
  } else {
    // Mode Standard Cart
    if (!userId && !anonymousId) {
      logger.warn(
        { action: 'checkout_summary_missing_identity' },
        'No userId or anonymousId provided for standard checkout'
      );
      return null;
    }

    const cart = await getOrCreateCart(userId, anonymousId);

    if (!cart || cart.items.length === 0) {
      logger.info(
        { action: 'checkout_summary_empty_cart', userId, anonymousId },
        'Empty cart for checkout'
      );
      return null;
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

    logger.info(
      {
        action: 'checkout_summary_cart',
        cartId: cart.id,
        itemCount: cart.items.length,
        total: initialTotal,
      },
      'Cart checkout summary calculated'
    );
  }

  return {
    currency,
    initialTotal,
    cartId: currentCartId,
    summaryItems,
  };
}
