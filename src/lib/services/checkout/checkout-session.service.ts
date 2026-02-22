import Stripe from 'stripe';

import { DEFAULT_CURRENCY, STRIPE_AUTOMATIC_TAX } from '@/lib/config/site';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { stripe } from '@/lib/integrations/stripe/client';
import { toStripeAmount } from '@/lib/integrations/stripe/utils';
import { StripeCheckoutInput } from '@/lib/types/domain/checkout';

/**
 * Crée une session Stripe Checkout
 * Utilisé pour le mode "Checkout Session" (redirection vers Stripe)
 *
 * @param input - Paramètres de session checkout
 * @returns Session Stripe créée
 */
export async function createCheckoutSession(
  input: StripeCheckoutInput
): Promise<Stripe.Checkout.Session> {
  const {
    items,
    currency,
    userId,
    cartId,
    anonymousId,
    successUrl,
    cancelUrl,
  } = input;

  // Récupérer les détails des variants depuis la DB
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: items.map(i => i.variantId) },
      deletedAt: null,
    },
    include: {
      pricing: {
        where: { isActive: true, priceType: 'base' },
      },
      media: {
        where: { isPrimary: true },
        take: 1,
      },
      product: {
        include: {
          translations: {
            take: 1,
          },
        },
      },
    },
  });

  if (variants.length !== items.length) {
    throw new Error('Some variants not found');
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    item => {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      // Chercher le prix pour la devise demandée, avec fallback
      let pricing = variant.pricing.find(p => p.currency === currency);
      let usedCurrency = currency;

      if (!pricing && currency !== DEFAULT_CURRENCY) {
        // Fallback to default currency from config
        const fallbackCurrency = DEFAULT_CURRENCY;
        pricing = variant.pricing.find(p => p.currency === fallbackCurrency);
        if (pricing) {
          usedCurrency = fallbackCurrency;
          logger.warn(
            {
              action: 'checkout_price_fallback',
              variantId: variant.id,
              sku: variant.sku,
              requestedCurrency: currency,
              fallbackCurrency,
            },
            `Price not found for ${currency}, using ${fallbackCurrency}`
          );
        }
      }

      if (!pricing) {
        throw new Error(
          `No active pricing found for variant ${variant.sku} in ${currency} or fallback currency`
        );
      }

      const productName = variant.product.translations[0]?.name || 'Product';
      const imageUrl = variant.media[0]?.url;

      return {
        price_data: {
          currency: usedCurrency.toLowerCase(),
          product_data: {
            name: `${productName} (${variant.sku})`,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: toStripeAmount(pricing.price.toString(), usedCurrency),
        },
        quantity: item.quantity,
      };
    }
  );

  logger.info(
    {
      action: 'checkout_session_create',
      currency,
      itemCount: items.length,
      userId: userId || 'anonymous',
    },
    'Creating Stripe checkout session'
  );

  // Stripe Tax nécessite une adresse d'origine configurée dans le dashboard
  // https://dashboard.stripe.com/settings/tax
  const enableAutomaticTax = STRIPE_AUTOMATIC_TAX;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Activer Stripe Tax pour calcul automatique des taxes (si configuré)
    ...(enableAutomaticTax && { automatic_tax: { enabled: true } }),
    // Collecter l'adresse pour le calcul des taxes (remis à auto pour éviter le warning en dev)
    billing_address_collection: 'auto',
    metadata: {
      userId: userId || '',
      cartId: cartId || '',
      anonymousId: anonymousId || '',
      currency,
      items: JSON.stringify(items),
    },
    payment_intent_data: {
      metadata: {
        userId: userId || '',
        cartId: cartId || '',
        anonymousId: anonymousId || '',
        currency,
        items: JSON.stringify(items),
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  logger.info(
    {
      action: 'checkout_session_created',
      sessionId: session.id,
      currency,
      automaticTax: enableAutomaticTax,
    },
    'Stripe checkout session created successfully'
  );

  return session;
}
