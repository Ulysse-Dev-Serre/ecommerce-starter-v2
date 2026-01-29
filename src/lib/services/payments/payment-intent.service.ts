import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { toStripeAmount } from '@/lib/utils/currency';
import { stripe } from '@/lib/integrations/stripe/client';
import {
  PaymentIntentInput,
  PaymentIntentResult,
} from '@/lib/types/domain/payment';
import { CheckoutCurrency, CheckoutItem } from '@/lib/types/domain/checkout';
import Stripe from 'stripe';

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
    throw new Error('Some variants not found');
  }

  // 2. Calculer le montant total
  let totalAmount = 0;

  // Calcul du sous-total des items
  items.forEach(item => {
    const variant = variants.find(v => v.id === item.variantId);
    if (!variant) throw new Error(`Variant ${item.variantId} not found`);

    let pricing = variant.pricing.find(p => p.currency === currency);
    // Fallback simple si devise non trouvée
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
 * Met à jour un PaymentIntent existant
 * Utilisé pour ajouter les frais de shipping après calcul
 *
 * @param paymentIntentId - ID du PaymentIntent à mettre à jour
 * @param updates - Mises à jour à appliquer
 * @returns PaymentIntent mis à jour
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  updates: {
    amount?: number;
    shipping?: Stripe.PaymentIntentUpdateParams.Shipping;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.PaymentIntent> {
  logger.info(
    {
      action: 'payment_intent_update',
      paymentIntentId,
      amount: updates.amount,
    },
    'Updating Payment Intent'
  );

  const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
    amount: updates.amount,
    shipping: updates.shipping,
    metadata: updates.metadata,
  });

  logger.info(
    {
      action: 'payment_intent_updated',
      paymentIntentId,
      newAmount: paymentIntent.amount,
    },
    'Payment Intent updated successfully'
  );

  return paymentIntent;
}
