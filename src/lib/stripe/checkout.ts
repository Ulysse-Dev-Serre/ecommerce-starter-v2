import { env } from '@/lib/env';
import Stripe from 'stripe';
import { SupportedCurrency } from '../types/currency';

import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { toStripeAmount } from '../utils/currency';
import { stripe } from './client';

export type CheckoutCurrency = SupportedCurrency;

export interface CreateCheckoutSessionParams {
  items: Array<{ variantId: string; quantity: number }>;
  currency: CheckoutCurrency;
  userId?: string;
  cartId?: string;
  anonymousId?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  items,
  currency,
  userId,
  cartId,
  anonymousId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
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

      if (!pricing) {
        // Fallback sur l'autre devise
        const fallbackCurrency = currency === 'CAD' ? 'USD' : 'CAD';
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
  const enableAutomaticTax = env.STRIPE_AUTOMATIC_TAX;

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

export interface CreatePaymentIntentParams {
  items: Array<{ variantId: string; quantity: number }>;
  currency: CheckoutCurrency;
  userId?: string;
  cartId?: string;
  anonymousId?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent({
  items,
  currency,
  userId,
  cartId,
  anonymousId,
  metadata = {},
}: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  // 1. Récupérer et valider les variants (similaire à createCheckoutSession)
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: items.map(i => i.variantId) },
      deletedAt: null,
    },
    include: {
      pricing: {
        where: { isActive: true, priceType: 'base' },
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

  // 2. Calculer le montant total
  let totalAmount = 0;

  // Calcul du sous-total des items
  items.forEach(item => {
    const variant = variants.find(v => v.id === item.variantId);
    if (!variant) throw new Error(`Variant ${item.variantId} not found`);

    let pricing = variant.pricing.find(p => p.currency === currency);
    // Fallback simple si devise non trouvée (devrait être mieux géré en prod)
    if (!pricing) {
      pricing = variant.pricing.find(
        p => p.currency === (currency === 'CAD' ? 'USD' : 'CAD')
      );
    }

    if (!pricing) throw new Error(`Price not found for variant ${variant.sku}`);

    totalAmount += Number(pricing.price) * item.quantity;
  });

  // Convertir en centimes pour Stripe
  const amountInCents = toStripeAmount(totalAmount.toString(), currency);

  logger.info(
    {
      action: 'payment_intent_create',
      currency,
      amount: totalAmount,
      userId: userId || 'anonymous',
    },
    'Creating Stripe Payment Intent'
  );

  // 2b. Récupérer l'email de l'utilisateur (OBLIGATOIRE CAR AUTHENTIFIÉ)
  let receiptEmail: string | undefined;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      receiptEmail = user.email;
    }
  }

  // 3. Créer le PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: receiptEmail, // <--- LA CLÉ DU PROBLÈME EST ICI
    metadata: {
      userId: userId || '',
      cartId: cartId || '',
      anonymousId: anonymousId || '',
      items: JSON.stringify(items),
      integration_check: 'accept_a_payment',
      subtotal: amountInCents.toString(), // CRUCIAL pour l'update du shipping
      ...metadata,
    },
    // Activer Stripe Tax si configuré
    // automatic_tax will be enabled in update-intent when we have the address
    // automatic_tax will be enabled in update-intent when we have the address
  });

  return paymentIntent;
}
