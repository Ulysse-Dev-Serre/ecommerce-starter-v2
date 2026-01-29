import { OrderStatus } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { resend, FROM_EMAIL } from '@/lib/core/resend';
import { render } from '@react-email/render';
import { OrderConfirmationEmail } from '@/components/emails/order-confirmation';
import { env } from '@/lib/core/env';

import fr from '@/lib/i18n/dictionaries/fr.json';
import en from '@/lib/i18n/dictionaries/en.json';
const dictionaries: Record<string, any> = { fr, en };

/**
 * Envoie l'email de confirmation de commande au client
 */
export async function sendOrderConfirmationEmail(
  order: any,
  calculation: any,
  shippingAddress: any,
  recipientEmail: string
) {
  try {
    const emailHtml = await render(
      OrderConfirmationEmail({
        orderId: order.orderNumber,
        customerName: shippingAddress?.firstName || 'Client',
        items: calculation.items.map((item: any) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice.toString(),
          currency: item.currency,
        })),
        subtotal: order.subtotalAmount.toString(),
        shippingCost: order.shippingAmount.toString(),
        taxCost: order.taxAmount.toString(),
        totalAmount: order.totalAmount.toString(),
        currency: order.currency,
        locale: order.language.toLowerCase(),
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

    const dict = dictionaries[order.language.toLowerCase()] || dictionaries.en;
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
  } catch (emailError: any) {
    logger.error(
      {
        error: emailError,
        message: emailError.message,
        orderId: order.id,
      },
      'Error sending confirmation email'
    );
  }
}

/**
 * Envoie la notification admin de nouvelle commande
 */
export async function sendAdminNewOrderAlert(
  order: any,
  calculation: any,
  shippingAddress: any
) {
  if (!env.ADMIN_EMAIL) return;

  try {
    const { AdminNewOrderEmail } = await import(
      '@/components/emails/admin-new-order'
    );

    const siteUrl = env.NEXT_PUBLIC_SITE_URL;

    const adminHtml = await render(
      AdminNewOrderEmail({
        orderId: order.orderNumber,
        internalOrderId: order.id,
        customerName: shippingAddress?.firstName
          ? `${shippingAddress.firstName} ${shippingAddress.lastName || ''}`
          : 'Client',
        totalAmount: order.totalAmount.toString(),
        currency: order.currency,
        itemsCount: calculation.items.length,
        siteUrl,
        locale: env.ADMIN_LOCALE || 'fr',
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: env.ADMIN_EMAIL,
      subject: `Nouvelle commande : ${order.totalAmount} ${order.currency} (${order.orderNumber})`,
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

/**
 * Envoie l'email d'expédition au client
 */
export async function sendShippedEmail(order: any) {
  try {
    let recipientEmail = order.user?.email;

    if (!recipientEmail && order.payments.length > 0) {
      const paymentMetadata = order.payments[0].transactionData as any;
      recipientEmail = paymentMetadata?.receipt_email || paymentMetadata?.email;
    }

    const shipment = order.shipments[0];

    if (recipientEmail && shipment && shipment.trackingCode) {
      const { OrderShippedEmail } = await import(
        '@/components/emails/order-shipped'
      );

      const shippingAddr = order.shippingAddress as any;

      const emailHtml = await render(
        OrderShippedEmail({
          orderId: order.orderNumber,
          customerName:
            shippingAddr?.firstName || order.user?.firstName || 'Client',
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
        logger.error(
          { error, orderId: order.id },
          'Failed to send shipped email'
        );
      } else {
        logger.info({ emailId: data?.id }, 'Shipped email sent successfully');
      }
    } else {
      logger.warn(
        {
          orderId: order.id,
          hasEmail: !!recipientEmail,
          hasShipment: !!shipment,
        },
        'Skipping shipped email: Missing email or shipment info'
      );
    }
  } catch (err: any) {
    logger.error({ err }, 'Error in shipped email flow');
  }
}

/**
 * Envoie l'email de livraison au client
 */
export async function sendDeliveredEmail(order: any) {
  try {
    let recipientEmail = order.user?.email;

    if (!recipientEmail && order.payments.length > 0) {
      const paymentMetadata = order.payments[0].transactionData as any;
      recipientEmail = paymentMetadata?.receipt_email || paymentMetadata?.email;
    }

    if (recipientEmail) {
      const { OrderDeliveredEmail } = await import(
        '@/components/emails/order-delivered'
      );

      const shippingAddr = order.shippingAddress as any;

      const emailHtml = await render(
        OrderDeliveredEmail({
          orderId: order.orderNumber,
          customerName:
            shippingAddr?.firstName || order.user?.firstName || 'Client',
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
      const subject = dict.Emails.delivered.subject.replace(
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
          'Failed to send delivered email'
        );
      } else {
        logger.info({ emailId: data?.id }, 'Delivered email sent successfully');
      }
    }
  } catch (err: any) {
    logger.error({ err }, 'Error in delivered email flow');
  }
}

/**
 * Envoie l'email de remboursement au client
 */
export async function sendRefundedEmail(order: any) {
  try {
    let recipientEmail = order.user?.email;

    if (!recipientEmail && order.payments.length > 0) {
      const paymentMetadata = order.payments[0].transactionData as any;
      recipientEmail = paymentMetadata?.receipt_email || paymentMetadata?.email;
    }

    if (recipientEmail) {
      const { OrderRefundedEmail } = await import(
        '@/components/emails/order-refunded'
      );

      const shippingAddr = order.shippingAddress as any;

      const emailHtml = await render(
        OrderRefundedEmail({
          orderId: order.orderNumber,
          customerName:
            shippingAddr?.firstName || order.user?.firstName || 'Client',
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
        logger.error(
          { error, orderId: order.id },
          'Failed to send refund email'
        );
      } else {
        logger.info({ emailId: data?.id }, 'Refund email sent successfully');
      }
    }
  } catch (err: any) {
    logger.error({ err }, 'Error in refund email flow');
  }
}

/**
 * Envoie l'email approprié basé sur un changement de statut de commande
 */
export async function sendStatusChangeEmail(
  order: any,
  newStatus: OrderStatus
) {
  switch (newStatus) {
    case OrderStatus.SHIPPED:
      await sendShippedEmail(order);
      break;
    case OrderStatus.DELIVERED:
      await sendDeliveredEmail(order);
      break;
    case OrderStatus.REFUNDED:
    case OrderStatus.CANCELLED:
      await sendRefundedEmail(order);
      break;
    default:
      // Pas d'email pour les autres statuts
      break;
  }
}
