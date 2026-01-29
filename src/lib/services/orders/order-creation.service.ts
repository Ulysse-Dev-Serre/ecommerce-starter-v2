import Stripe from 'stripe';
import { OrderStatus, Language } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { i18n } from '@/lib/i18n/config';
import { calculateCart, type Currency } from '../calculation.service';
import { decrementStock } from '../inventory';
import { CreateOrderFromCartInput } from '@/lib/types/domain/order';

/**
 * Génère un numéro de commande unique
 * Format: ORD-{YEAR}-{NUMBER}
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  return orderNumber;
}

/**
 * Crée une commande à partir d'un panier après paiement réussi
 * - Génère le numéro de commande
 * - Calcule les montants (subtotal, tax, shipping, total)
 * - Crée les items de commande avec snapshot produit
 * - Enregistre le paiement Stripe
 * - Décrémente le stock
 *
 * Note: N'envoie PAS d'emails - utilisez order-notifications.service.ts pour ça
 */
export async function createOrderFromCart({
  cart,
  userId,
  paymentIntent,
  shippingAddress,
  billingAddress,
}: CreateOrderFromCartInput) {
  const orderNumber = await generateOrderNumber();

  // Utiliser le service de calcul centralisé
  const currency = cart.currency as Currency;
  const calculation = calculateCart(cart, currency);

  const subtotalAmount = parseFloat(calculation.subtotal.toString());
  const taxAmount = 0; // Géré par Stripe Tax

  // Récupérer la langue depuis les metadata
  const locale = (
    paymentIntent.metadata?.locale || i18n.defaultLocale
  ).toLowerCase();

  // Récupérer les frais de port depuis les metadata du PaymentIntent
  const shippingCostMeta = paymentIntent.metadata?.shipping_cost;
  const shippingAmount = shippingCostMeta ? parseFloat(shippingCostMeta) : 0;

  // Récupérer l'ID du tarif Shippo (si le client a choisi une livraison)
  const shippingRateId = paymentIntent.metadata?.shipping_rate_id;
  let shipmentCreateData;

  const discountAmount = 0;

  // Utiliser le total de Stripe s'il correspond à la somme, sinon recalculer
  // Note: Stripe amount est en cents, nos montants DB sont en dollars/unités
  const stripeTotal = paymentIntent.amount / 100;
  const calculatedTotal =
    subtotalAmount + taxAmount + shippingAmount - discountAmount;

  // Sécurité: Si le total calculé diffère significativement du total payé, on log un warning
  if (Math.abs(stripeTotal - calculatedTotal) > 0.01) {
    logger.warn(
      { orderNumber, stripeTotal, calculatedTotal },
      'Écart détecté entre le montant payé sur Stripe et le calcul du panier'
    );
  }

  // Pour la DB, on utilise le total calculé pour garantir la cohérence mathématique des colonnes,
  // tout en ayant logué l'alerte si un écart existait avec Stripe.
  const totalAmount = calculatedTotal;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: OrderStatus.PAID,
      currency: cart.currency,
      subtotalAmount,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || {},
      language: locale.toUpperCase() === 'FR' ? Language.FR : Language.EN,
      // Création automatique de l'expédition si l'étiquette a été achetée
      shipments: shipmentCreateData
        ? {
            create: shipmentCreateData,
          }
        : undefined,
      items: {
        create: calculation.items.map(item => {
          const cartItem = cart.items.find(i => i.variantId === item.variantId);
          return {
            variantId: item.variantId,
            productId: cartItem?.variant.product.id || '',
            productSnapshot: {
              name: item.productName,
              sku: item.sku,
              image: cartItem?.variant.media.find(m => m.isPrimary)?.url,
            },
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice.toString()),
            totalPrice: parseFloat(item.lineTotal.toString()),
            currency: item.currency,
          };
        }),
      },
      payments: {
        create: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          method: 'STRIPE',
          externalId: paymentIntent.id,
          status: 'COMPLETED',
          transactionData: paymentIntent as any,
          processedAt: new Date(),
        },
      },
    },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  // Décrémenter le stock
  await decrementStock(
    cart.items.map(item => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    }))
  );

  logger.info(
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      itemsCount: calculation.items.length,
    },
    'Order created from cart'
  );

  return order;
}
