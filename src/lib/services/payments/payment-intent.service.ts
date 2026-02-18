import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { toStripeAmount } from '@/lib/integrations/stripe/utils';
import { stripe } from '@/lib/integrations/stripe/client';
import {
  PaymentIntentInput,
  PaymentIntentResult,
} from '@/lib/types/domain/payment';
import { CheckoutCurrency, CheckoutItem } from '@/lib/types/domain/checkout';
import Stripe from 'stripe';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { env } from '@/lib/core/env';
import { SupportedCurrency } from '@/lib/config/site';

/**
 * Crée un PaymentIntent Stripe
 * Utilisé pour le mode "Custom Checkout" (Stripe Elements intégré)
 *
 * @param input - Paramètres de création PaymentIntent
 * @returns PaymentIntent créé avec clientSecret
 */
export async function createPaymentIntent(
  input: PaymentIntentInput
): Promise<PaymentIntentResult> {
  const { items, currency, userId, cartId, anonymousId, metadata = {} } = input;

  // 1. Récupérer et valider les variants
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
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'Some products were not found or are no longer available',
      404
    );
  }

  // 2. Calculer le montant total
  let totalAmount = 0;

  // Calcul du sous-total des items
  items.forEach(item => {
    const variant = variants.find(v => v.id === item.variantId);
    if (!variant) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        `Variant ${item.variantId} not found`,
        404
      );
    }

    let pricing = variant.pricing.find(p => p.currency === currency);
    // Fallback simple si devise non trouvée
    if (!pricing) {
      pricing = variant.pricing.find(
        p => p.currency === (currency === 'CAD' ? 'USD' : 'CAD')
      );
    }

    if (!pricing) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        `Price not found for variant ${variant.sku}`,
        404
      );
    }

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
    receipt_email: receiptEmail,
    metadata: {
      userId: userId || '',
      cartId: cartId || '',
      anonymousId: anonymousId || '',
      items: JSON.stringify(items),
      integration_check: 'accept_a_payment',
      subtotal: amountInCents.toString(), // CRUCIAL pour l'update du shipping
      ...metadata,
    },
    // automatic_tax will be enabled in update-intent when we have the address
  });

  logger.info(
    {
      action: 'payment_intent_created',
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency,
    },
    'Payment Intent created successfully'
  );

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amount: totalAmount,
    currency,
    status: paymentIntent.status,
  };
}

/**
 * Met à jour un PaymentIntent existant avec les frais de port et l'adresse.
 * Gère également l'activation optionnelle de la taxe automatique Stripe.
 *
 * @param paymentIntentId - ID Stripe du PaymentIntent
 * @param updates - Données de mise à jour (shipping cost, address, email)
 * @returns PaymentIntent mis à jour
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  data: {
    shippingAmount: string;
    currency?: SupportedCurrency;
    shippingDetails?: {
      name: string;
      phone: string;
      email?: string;
      street1: string;
      street2?: string | null;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }
): Promise<Stripe.PaymentIntent> {
  const { shippingAmount, currency, shippingDetails } = data;

  // 1. Récupérer l'intent courant pour avoir le sous-total
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const resolvedCurrency = (currency ||
    intent.currency.toUpperCase()) as SupportedCurrency;

  // Calcul du sous-total (depuis les metadata ou retrocalcul)
  const subtotalStr = intent.metadata.subtotal;
  let subtotal = 0;

  if (subtotalStr) {
    subtotal = Number(subtotalStr);
  } else {
    const previousShipping = intent.metadata.shipping_cost
      ? Number(intent.metadata.shipping_cost)
      : 0;
    const previousShippingCents = toStripeAmount(
      previousShipping.toString(),
      resolvedCurrency
    );
    subtotal = intent.amount - previousShippingCents;
  }

  const shippingAmountCents = toStripeAmount(shippingAmount, resolvedCurrency);
  const newTotalCents = subtotal + shippingAmountCents;

  // 2. Préparer le payload
  const updatePayload: Stripe.PaymentIntentUpdateParams = {
    amount: newTotalCents,
    metadata: {
      ...intent.metadata,
      shipping_cost: shippingAmount,
      subtotal: subtotal.toString(),
    },
  };

  if (shippingDetails) {
    updatePayload.shipping = {
      name: shippingDetails.name,
      phone: shippingDetails.phone,
      address: {
        line1: shippingDetails.street1,
        line2: shippingDetails.street2 || undefined,
        city: shippingDetails.city,
        state: shippingDetails.state,
        postal_code: shippingDetails.zip,
        country: shippingDetails.country,
      },
    };

    if (shippingDetails.email) {
      updatePayload.receipt_email = shippingDetails.email;
    }
  }

  // 3. Appliquer la mise à jour (avec fallback Taxe)
  logger.info(
    { paymentIntentId, amount: newTotalCents },
    'Updating PaymentIntent'
  );

  let updatedIntent: Stripe.PaymentIntent;

  try {
    if (env.STRIPE_AUTOMATIC_TAX) {
      try {
        updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
          ...updatePayload,
          automatic_tax: { enabled: true },
        } as any);
      } catch (taxError) {
        logger.warn(
          { error: taxError },
          'Stripe Tax activation failed, falling back'
        );
        updatedIntent = await stripe.paymentIntents.update(
          paymentIntentId,
          updatePayload
        );
      }
    } else {
      updatedIntent = await stripe.paymentIntents.update(
        paymentIntentId,
        updatePayload
      );
    }
  } catch (error) {
    throw new AppError(
      ErrorCode.PAYMENT_FAILED,
      'Failed to update payment intent',
      500,
      { originalError: error }
    );
  }

  return updatedIntent;
}
