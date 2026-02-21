import { Prisma, Decimal } from '@/generated/prisma';
import { render } from '@react-email/render';

import { SupportedCurrency } from '@/lib/config/site';
import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resend, FROM_EMAIL } from '@/lib/integrations/resend/client';
import { Address, OrderWithIncludes } from '@/lib/types/domain/order';

import { OrderStatus } from '@/generated/prisma';

import { OrderConfirmationEmail } from '@/components/emails/order-confirmation';

/**
 * Interface simplifiée pour les items de notification (emails)
 */
export interface NotificationLineItem {
  productName: string;
  quantity: number;
  unitPrice: Decimal | number;
  currency: SupportedCurrency;
  sku?: string;
  variantId?: string | null;
}

/**
 * Envoie l'email de confirmation de commande au client
 */
export async function sendOrderConfirmationEmail(
  order: OrderWithIncludes,
  calculation: { items: NotificationLineItem[] },
  shippingAddress: Address | null,
  recipientEmail: string
) {
  try {
    const dict = await getDictionary(order.language.toLowerCase());

    const emailHtml = await render(
      OrderConfirmationEmail({
        orderId: order.orderNumber,
        customerName: (
          shippingAddress?.name ||
          (order.user?.firstName
            ? `${order.user.firstName} ${order.user.lastName || ''}`
            : '')
        ).trim(),
        items: calculation.items.map((item: NotificationLineItem) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice.toString(),
          currency: item.currency as SupportedCurrency,
        })),
        subtotal: order.subtotalAmount.toString(),
        shippingCost: order.shippingAmount.toString(),
        taxCost: order.taxAmount.toString(),
        totalAmount: order.totalAmount.toString(),
        currency: order.currency as SupportedCurrency,
        locale: order.language.toLowerCase(),
        shippingAddress: {
          street: shippingAddress?.street1
            ? shippingAddress.street1 +
              (shippingAddress.street2 ? ' ' + shippingAddress.street2 : '')
            : '',
          city: shippingAddress?.city || '',
          state: shippingAddress?.state || '',
          zip: shippingAddress?.zip || '',
          country: shippingAddress?.country || '',
        },
      })
    );
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
  } catch (emailError: unknown) {
    const error = emailError as Error;
    logger.error(
      {
        error,
        message: error.message,
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
  order: OrderWithIncludes,
  calculation: { items: NotificationLineItem[] },
  shippingAddress: Address | null
) {
  if (!env.ADMIN_EMAIL) return;

  try {
    const { AdminNewOrderEmail } = await import(
      '@/components/emails/admin-new-order'
    );

    const dict = await getDictionary(env.ADMIN_LOCALE);
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;

    const adminHtml = await render(
      AdminNewOrderEmail({
        orderId: order.orderNumber,
        internalOrderId: order.id,
        customerName: (
          shippingAddress?.name ||
          (order.user?.firstName
            ? `${order.user.firstName} ${order.user.lastName || ''}`
            : '')
        ).trim(),
        totalAmount: order.totalAmount.toString(),
        currency: order.currency as SupportedCurrency,
        itemsCount: calculation.items.length,
        siteUrl,
        locale: env.ADMIN_LOCALE as string,
      })
    );

    const subject = dict.Emails.admin_new_order_alert.subject
      .replace('{totalAmount}', order.totalAmount.toString())
      .replace('{currency}', order.currency)
      .replace('{orderNumber}', order.orderNumber);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: env.ADMIN_EMAIL,
      subject,
      html: adminHtml,
    });

    logger.info({}, 'Admin notification email sent');
  } catch (adminEmailError: unknown) {
    logger.error(
      { error: adminEmailError },
      'Failed to send admin notification'
    );
  }
}

/**
 * Envoie l'email d'expédition au client
 */
export async function sendShippedEmail(order: OrderWithIncludes) {
  try {
    const recipientEmail = order.orderEmail;
    const shipment = order.shipments[0];

    if (recipientEmail && shipment && shipment.trackingCode) {
      const { OrderShippedEmail } = await import(
        '@/components/emails/order-shipped'
      );

      const shippingAddr = order.shippingAddress as Address;

      const dict = await getDictionary(order.language.toLowerCase());

      const emailHtml = await render(
        OrderShippedEmail({
          orderId: order.orderNumber,
          customerName: (
            shippingAddr?.name ||
            (order.user?.firstName
              ? `${order.user.firstName} ${order.user.lastName || ''}`
              : '')
          ).trim(),
          trackingNumber: shipment.trackingCode,
          trackingUrl: `https://parcelsapp.com/en/tracking/${shipment.trackingCode}`,
          carrierName: shipment.carrier || '',
          shippingAddress: {
            street: shippingAddr?.street1 || '',
            city: shippingAddr?.city || '',
            state: shippingAddr?.state || '',
            zip: shippingAddr?.zip || '',
            country: shippingAddr?.country || '',
          },
          locale: order.language.toLowerCase(),
        })
      );

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
  } catch (err: unknown) {
    logger.error({ err }, 'Error in shipped email flow');
  }
}

/**
 * Envoie l'email de livraison au client
 */
export async function sendDeliveredEmail(order: OrderWithIncludes) {
  try {
    const recipientEmail = order.orderEmail;

    if (recipientEmail) {
      const { OrderDeliveredEmail } = await import(
        '@/components/emails/order-delivered'
      );

      const shippingAddr = order.shippingAddress as Address;

      const dict = await getDictionary(order.language.toLowerCase());

      const emailHtml = await render(
        OrderDeliveredEmail({
          orderId: order.orderNumber,
          customerName: (
            shippingAddr?.name ||
            (order.user?.firstName
              ? `${order.user.firstName} ${order.user.lastName || ''}`
              : '')
          ).trim(),
          shippingAddress: {
            street: shippingAddr?.street1 || '',
            city: shippingAddr?.city || '',
            state: shippingAddr?.state || '',
            zip: shippingAddr?.zip || '',
            country: shippingAddr?.country || '',
          },
          locale: order.language.toLowerCase(),
        })
      );

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
  } catch (err: unknown) {
    logger.error({ err }, 'Error in delivered email flow');
  }
}

/**
 * Envoie l'email de remboursement au client
 */
export async function sendRefundedEmail(order: OrderWithIncludes) {
  try {
    logger.info(
      { orderId: order.id, orderNumber: order.orderNumber },
      'sendRefundedEmail called'
    );

    const recipientEmail = order.orderEmail;

    logger.info(
      {
        recipientEmail,
        hasUser: !!order.user,
        hasOrderEmail: !!order.orderEmail,
        hasPayments: order.payments?.length > 0,
      },
      'Email resolution result'
    );

    if (recipientEmail) {
      const dict = await getDictionary(order.language.toLowerCase());

      const { OrderRefundedEmail } = await import(
        '@/components/emails/order-refunded'
      );

      const shippingAddr = order.shippingAddress as Address;

      const emailHtml = await render(
        OrderRefundedEmail({
          orderId: order.orderNumber,
          customerName: (
            shippingAddr?.name ||
            (order.user?.firstName
              ? `${order.user.firstName} ${order.user.lastName || ''}`
              : '')
          ).trim(),
          amountRefunded: order.totalAmount.toString(),
          currency: order.currency as SupportedCurrency,
          locale: order.language.toLowerCase(),
        })
      );

      const subject = dict.Emails.refunded.subject.replace(
        '{orderNumber}',
        order.orderNumber
      );

      logger.info(
        { to: recipientEmail, from: FROM_EMAIL, subject },
        'Sending refund email via Resend'
      );

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject,
        html: emailHtml,
      });

      if (error) {
        logger.error(
          { error, orderId: order.id, recipientEmail },
          'Failed to send refund email'
        );
      } else {
        logger.info(
          { emailId: data?.id, recipientEmail },
          'Refund email sent successfully'
        );
      }
    } else {
      logger.warn(
        { orderId: order.id, orderNumber: order.orderNumber },
        'No recipient email found - skipping refund email'
      );
    }
  } catch (err: unknown) {
    const error = err as Error;
    logger.error(
      { err: error, message: error.message, orderId: order?.id },
      'Error in refund email flow'
    );
  }
}

/**
 * Envoie l'email approprié basé sur un changement de statut de commande
 */
export async function sendStatusChangeEmail(
  order: OrderWithIncludes,
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

/**
 * Envoie une alerte admin pour une demande de remboursement
 */
export async function sendRefundRequestAlert(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  hasAttachment: boolean;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  const adminEmail = env.ADMIN_EMAIL;

  logger.info(
    {
      orderNumber: params.orderNumber,
      adminEmail,
      hasAdminEmail: !!adminEmail,
    },
    'sendRefundRequestAlert called'
  );

  if (!adminEmail) {
    logger.warn({}, 'No ADMIN_EMAIL configured - skipping admin alert');
    return;
  }

  try {
    const { default: RefundRequestAdminEmail } = await import(
      '@/components/emails/refund-request-admin'
    );

    const dict = await getDictionary(env.ADMIN_LOCALE);

    const emailHtml = await render(
      RefundRequestAdminEmail({
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        reason: params.reason,
        imageUrl: params.hasAttachment ? 'Attached' : undefined,
        locale: env.ADMIN_LOCALE as string,
      })
    );

    const subject = dict.Emails.refund_request_admin.subject.replace(
      '{orderNumber}',
      params.orderNumber
    );

    logger.info(
      {
        to: adminEmail,
        from: FROM_EMAIL,
        subject,
        orderNumber: params.orderNumber,
      },
      'Sending refund request alert to admin via Resend'
    );

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject,
      html: emailHtml,
      attachments: params.attachments,
    });

    if (error) {
      logger.error(
        { error, orderNumber: params.orderNumber, adminEmail },
        'Failed to send refund request email to admin'
      );
    } else {
      logger.info(
        { emailId: data?.id, orderNumber: params.orderNumber, adminEmail },
        'Refund request email sent to admin successfully'
      );
    }
  } catch (error: unknown) {
    logger.error(
      { error, orderNumber: params.orderNumber },
      'Error sending refund request email'
    );
  }
}
