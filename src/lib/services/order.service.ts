import Stripe from 'stripe';

import { OrderStatus, Language } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { createTransaction, getReturnShippingRates } from './shippo';
import { stripe } from '../../lib/stripe/client';
import { calculateCart, type Currency } from './calculation.service';
import { CartProjection } from './cart.service';
import { decrementStock } from './inventory.service';
import { resend, FROM_EMAIL } from '../../lib/resend';
import { OrderConfirmationEmail } from '../../components/emails/order-confirmation';
import { render } from '@react-email/render';
import { i18n } from '../i18n/config';

const fr = require('../i18n/dictionaries/fr.json');
const en = require('../i18n/dictionaries/en.json');
const dictionaries: Record<string, any> = { fr, en };

export interface CreateOrderFromCartInput {
  cart: CartProjection;
  userId: string;
  paymentIntent: Stripe.PaymentIntent;
  shippingAddress?: any;
  billingAddress?: any;
}

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  return orderNumber;
}

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
      shipments: true, // Inclure les shipments dans la réponse
    },
  });

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

  // --- ENVOI EMAIL TRANSACTIONNEL ---
  try {
    // 1. Déterminer l'email destinataire
    // L'email fiable est celui confirmé par Stripe dans le Payment Intent (receipt_email)
    const recipientEmail = paymentIntent.receipt_email;

    if (recipientEmail) {
      // 2. Préparer les données pour le template
      const emailHtml = await render(
        OrderConfirmationEmail({
          orderId: order.orderNumber,
          customerName: shippingAddress?.firstName || 'Client',
          items: calculation.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice.toString(),
            currency: item.currency,
          })),
          subtotal: subtotalAmount.toString(),
          shippingCost: shippingAmount.toString(),
          taxCost: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          currency: cart.currency,
          locale: order.language.toLowerCase(), // Utiliser la langue enregistrée
          shippingAddress: {
            street: shippingAddress?.street1
              ? shippingAddress.street1 +
                (shippingAddress.street2 ? ' ' + shippingAddress.street2 : '')
              : 'N/A',
            city: shippingAddress?.city || '',
            state: shippingAddress?.state || '',
            postalCode: shippingAddress?.postalCode || '',
            country: shippingAddress?.country || '',
          },
        })
      );

      // 3. Envoyer via Resend
      const dict =
        dictionaries[order.language.toLowerCase()] || dictionaries.en;
      const subject = dict.Emails.confirmation.subject.replace(
        '{orderNumber}',
        order.orderNumber
      );

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject,
        html: emailHtml,
      });

      if (error) {
        logger.error(
          { error, orderId: order.id },
          'Failed to send confirmation email'
        );
      } else {
        logger.info(
          { emailId: data?.id, recipientEmail },
          'Order confirmation email sent'
        );
      }
    } else {
      logger.warn(
        { orderId: order.id },
        'No recipient email found, skipping confirmation email'
      );
    }
  } catch (emailError: any) {
    // On ne veut pas faire échouer la création de commande si l'envoi d'email échoue
    logger.error(
      {
        error: emailError,
        message: emailError.message,
        stack: emailError.stack,
        orderId: order.id,
      },
      'Error sending confirmation email'
    );
  }

  // --- ENVOI NOTIFICATION ADMIN ---
  if (process.env.ADMIN_EMAIL) {
    try {
      const { AdminNewOrderEmail } = await import(
        '../../components/emails/admin-new-order'
      );

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'https://agtechnest.com';

      const adminHtml = await render(
        AdminNewOrderEmail({
          orderId: order.orderNumber,
          internalOrderId: order.id,
          customerName: shippingAddress?.firstName
            ? `${shippingAddress.firstName} ${shippingAddress.lastName || ''}`
            : 'Client',
          totalAmount: totalAmount.toString(),
          currency: cart.currency,
          itemsCount: calculation.items.length,
          siteUrl,
        })
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: `Nouvelle commande : ${totalAmount} ${cart.currency} (${order.orderNumber})`,
        html: adminHtml,
      });

      logger.info({}, 'Admin notification email sent');
    } catch (adminEmailError) {
      logger.error(
        { error: adminEmailError },
        'Failed to send admin notification'
      );
    }
  }

  return order;
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized: This order does not belong to you');
  }

  return order;
}

export async function getOrderByNumber(orderNumber: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized: This order does not belong to you');
  }

  return order;
}

/**
 * Get all orders for a specific user
 */
export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      payments: {
        select: {
          status: true,
          method: true,
        },
      },
    },
  });

  return orders;
}

/**
 * Get order by ID for admin (no user restriction)
 */
export async function getOrderByIdAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          clerkId: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              translations: true,
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
            },
          },
        },
      },
      payments: true,
      shipments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  comment?: string,
  userId?: string
) {
  // Logic to process Stripe refund before updating local status
  if (status === 'REFUNDED' || status === 'CANCELLED') {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (existingOrder) {
      const stripePayment = existingOrder.payments.find(
        p => p.method === 'STRIPE' && p.status === 'COMPLETED'
      );

      if (stripePayment?.externalId) {
        try {
          // Check if the payment intent is already refunded is tricky without calling API,
          // but calling create refund directly will handle it (throws unique error)
          await stripe.refunds.create({
            payment_intent: stripePayment.externalId,
          });
          logger.info(
            { orderId, paymentIntent: stripePayment.externalId },
            'Stripe refund executed successfully'
          );
        } catch (error: any) {
          // If already refunded, allow the function to proceed to update local status
          if (error.code === 'charge_already_refunded') {
            logger.warn(
              { orderId },
              'Charge already refunded in Stripe, proceeding with local status update'
            );
          } else {
            logger.error({ error, orderId }, 'Stripe refund failed');
            // Block the local update if Stripe refund fails for other reasons
            throw new Error(`Stripe refund failed: ${error.message}`);
          }
        }
      }
    }
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      statusHistory: {
        create: {
          status: status as OrderStatus,
          comment,
          createdBy: userId,
        },
      },
    },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      shipments: true, // Pour le tracking
      payments: true, // Pour l'email (si dispo ici)
      user: true, // Pour l'email utilisateur
    },
  });

  logger.info(
    {
      orderId,
      newStatus: status,
      updatedBy: userId,
    },
    'Order status updated'
  );

  // --- ENVOI EMAIL EXPEDITION ---
  if (status === OrderStatus.SHIPPED) {
    try {
      // 1. Trouver l'email (User ou Payment Receipt)
      // Priorité : Email du compte User > Email du paiement Stripe
      let recipientEmail = order.user?.email;

      if (!recipientEmail && order.payments.length > 0) {
        // Fallback sur l'email du premier paiement (Stripe)
        const paymentMetadata = order.payments[0].transactionData as any;
        recipientEmail =
          paymentMetadata?.receipt_email || paymentMetadata?.email;
      }

      // 2. Récupérer information de suivi (Premier shipment valide)
      const shipment = order.shipments[0]; // On prend le dernier ou premier ?
      // Normalement on crée le shipment AVANT de passer en Shipped.

      if (recipientEmail && shipment && shipment.trackingCode) {
        const { OrderShippedEmail } = await import(
          '../../components/emails/order-shipped'
        );

        const shippingAddr = order.shippingAddress as any;

        const emailHtml = await render(
          OrderShippedEmail({
            orderId: order.orderNumber,
            customerName:
              order.user?.firstName || shippingAddr?.firstName || 'Client',
            trackingNumber: shipment.trackingCode,
            trackingUrl: `https://parcelsapp.com/en/tracking/${shipment.trackingCode}`,
            carrierName: shipment.carrier || 'Transporteur',
            shippingAddress: {
              street: shippingAddr?.street1 || shippingAddr?.street || '',
              city: shippingAddr?.city || '',
              state: shippingAddr?.state || '',
              postalCode: shippingAddr?.postalCode || '',
              country: shippingAddr?.country || '',
            },
            locale: order.language.toLowerCase(),
          })
        );

        const dict =
          dictionaries[order.language.toLowerCase()] || dictionaries.en;
        const subject = dict.Emails.shipped.subject.replace(
          '{orderNumber}',
          order.orderNumber
        );

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipientEmail,
          subject,
          html: emailHtml,
        });

        if (error) {
          logger.error({ error, orderId }, 'Failed to send shipped email');
        } else {
          logger.info({ emailId: data?.id }, 'Shipped email sent successfully');
        }
      } else {
        logger.warn(
          { orderId, hasEmail: !!recipientEmail, hasShipment: !!shipment },
          'Skipping shipped email: Missing email or shipment info'
        );
      }
    } catch (err: any) {
      logger.error({ err }, 'Error in shipped email flow');
    }
  } else if (
    status === OrderStatus.REFUNDED ||
    status === OrderStatus.CANCELLED
  ) {
    // --- ENVOI EMAIL REMBOURSEMENT ---
    try {
      let recipientEmail = order.user?.email;

      if (!recipientEmail && order.payments.length > 0) {
        const paymentMetadata = order.payments[0].transactionData as any;
        recipientEmail =
          paymentMetadata?.receipt_email || paymentMetadata?.email;
      }

      if (recipientEmail) {
        const { OrderRefundedEmail } = await import(
          '../../components/emails/order-refunded'
        );

        const shippingAddr = order.shippingAddress as any;

        const emailHtml = await render(
          OrderRefundedEmail({
            orderId: order.orderNumber,
            customerName:
              order.user?.firstName || shippingAddr?.firstName || 'Client',
            amountRefunded: order.totalAmount.toString(),
            currency: order.currency,
            locale: order.language.toLowerCase(),
          })
        );

        const dict =
          dictionaries[order.language.toLowerCase()] || dictionaries.en;
        const subject = dict.Emails.refunded.subject.replace(
          '{orderNumber}',
          order.orderNumber
        );

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipientEmail,
          subject,
          html: emailHtml,
        });

        if (error) {
          logger.error({ error, orderId }, 'Failed to send refund email');
        } else {
          logger.info({ emailId: data?.id }, 'Refund email sent successfully');
        }
      }
    } catch (err: any) {
      logger.error({ err }, 'Error in refund email flow');
    }
  }

  return order;
}

export async function createReturnLabel(
  orderId: string,
  isPreview: boolean = false
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) throw new Error('Order not found');

  const addr = order.shippingAddress as any;
  const customerAddress = {
    name: addr.name || `${addr.firstName} ${addr.lastName}`,
    street1: addr.street1 || addr.line1,
    street2: addr.street2 || addr.line2,
    city: addr.city,
    state: addr.state,
    zip: (addr.postalCode || addr.postal_code || addr.zip || '').replace(
      /\s+/g,
      ''
    ),
    country: addr.country,
    phone: addr.phone,
    email: order.user?.email || addr.email,
  };

  const warehouseAddress = {
    name: 'AgTechNest Warehouse',
    street1: '546 rue leclerc',
    street2: 'app 7',
    city: 'Repentigny',
    state: 'QC',
    zip: 'J6A7R3',
    country: 'CA',
    phone: process.env.SHIPPO_FROM_PHONE || '5140000000',
    email: 'agtechnest@gmail.com',
  };

  // Prepare a generic parcel (standard box)
  const parcels = [
    {
      length: '20',
      width: '15',
      height: '10',
      distanceUnit: 'cm' as const,
      weight: '1',
      massUnit: 'kg' as const,
    },
  ];

  // International Return Customs (e.g. US -> CA)
  let customsDeclaration = undefined;
  if (customerAddress.country !== 'CA') {
    customsDeclaration = {
      contentsType: 'RETURN_MERCHANDISE' as const,
      contentsExplanation: 'Customer return',
      nonDeliveryOption: 'RETURN' as const,
      certify: true,
      certifySigner: customerAddress.name,
      items: [
        {
          description: 'Return items',
          quantity: 1,
          netWeight: '1',
          massUnit: 'kg' as const,
          valueAmount: '50.00',
          valueCurrency: 'CAD',
          originCountry: 'CA',
        },
      ],
    };
  }

  try {
    const shipment = await getReturnShippingRates(
      customerAddress,
      warehouseAddress,
      parcels,
      customsDeclaration
    );

    if (!shipment.rates || shipment.rates.length === 0) {
      throw new Error('No return rates found');
    }

    // Sort rates by amount to find the cheapest
    const sortedRates = [...shipment.rates].sort(
      (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount)
    );

    const bestRate = sortedRates[0] as any;
    const rateId = bestRate.objectId || bestRate.object_id;

    // If we are just previewing, return the rate info now
    if (isPreview) {
      return {
        isPreview: true,
        amount: bestRate.amount,
        currency: bestRate.currency,
        provider: bestRate.provider,
      };
    }

    const transaction = (await createTransaction(rateId)) as any;

    if (transaction.status !== 'SUCCESS') {
      throw new Error(
        'Failed to purchase return label: ' +
          (transaction.messages?.[0]?.text || 'Unknown error')
      );
    }

    // Save the shipment in DB
    await prisma.shipment.create({
      data: {
        orderId,
        carrier: transaction.provider || bestRate.provider,
        trackingCode: transaction.trackingNumber || transaction.tracking_number,
        trackingUrl: transaction.trackingUrl || transaction.tracking_url,
        labelUrl: transaction.labelUrl || transaction.label_url,
        status: 'PENDING',
        carrierService: 'RETURN',
      } as any,
    });

    // Send email
    try {
      const finalLabelUrl = transaction.labelUrl || transaction.label_url;

      if (!finalLabelUrl) {
        throw new Error(
          "Shippo a confirmé l'achat mais n'a pas renvoyé d'URL pour le PDF. Veuillez réessayer ou vérifier sur Shippo."
        );
      }

      logger.info({ orderId, finalLabelUrl }, 'Preparing return label email');

      const { OrderReturnLabelEmail } = await import(
        '../../components/emails/order-return-label'
      );
      const emailHtml = await render(
        OrderReturnLabelEmail({
          orderId: order.orderNumber,
          customerName:
            order.user?.firstName || addr.name?.split(' ')[0] || 'Client',
          labelUrl: finalLabelUrl,
          locale: order.language.toLowerCase(),
        })
      );

      const dict =
        dictionaries[order.language.toLowerCase()] || dictionaries.en;
      const subject = dict.Emails.returnLabel.subject.replace(
        '{orderNumber}',
        order.orderNumber
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerAddress.email,
        subject,
        html: emailHtml,
      });
      logger.info(
        { orderId },
        'Return label created and email sent successfully'
      );
    } catch (emailErr) {
      logger.error({ emailErr, orderId }, 'Failed to send return label email');
    }

    return transaction;
  } catch (err: any) {
    logger.error({ err: err.message, orderId }, 'Error in createReturnLabel');
    throw err;
  }
}
