import {
  VIBE_HOVER_GROUP,
  VIBE_ANIMATION_FADE_IN,
} from '@/lib/config/vibe-styles';
import NextLink from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/ui/status-badge';
import { OrderStepper } from '@/components/orders/order-stepper';
import { OrderTracking } from '@/components/orders/order-tracking';
import { OrderItemsList } from '@/components/orders/order-items-list';
import { OrderSummary } from '@/components/orders/order-summary';
import { RefundRequestForm } from '@/components/orders/refund-request-form';
import { Order, OrderItem, Payment, Shipment } from '@/generated/prisma';

// Ideally we should import OrderWithIncludes from the service or types definition
import { OrderWithIncludes } from '@/lib/types/domain/order';

type OrderDetail = OrderWithIncludes;

interface OrderDetailContentProps {
  order: OrderDetail;
  user: { firstName: string | null; email: string };
  locale: string;
  itemData: Record<
    string,
    {
      image?: string;
      slug: string;
      name: string;
      attributes: { name: string; value: string }[];
    }
  >;
}

export async function OrderDetailContent({
  order,
  user,
  locale,
  itemData,
}: OrderDetailContentProps) {
  const t = await getTranslations({ locale, namespace: 'orders.detail' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tRefund = await getTranslations({ locale, namespace: 'orders.refund' });

  const statusLabels: Record<string, string> = {
    PENDING: t('statusPending'),
    PAID: t('statusPaid'),
    SHIPPED: t('statusShipped'),
    IN_TRANSIT: t('statusInTransit'),
    DELIVERED: t('statusDelivered'),
    CANCELLED: t('statusCancelled'),
    REFUNDED: t('statusRefunded'),
    REFUND_REQUESTED: t('statusRefundRequested'),
  };

  const trackingLabels = {
    tracking: t('tracking'),
    trackPackage: t('trackPackage'),
    standardShipping: t('standardShipping'),
  };

  const itemsLabels = {
    itemsTitle: t('items'),
    quantity: tCommon('quantity'),
    productFallback: t('productFallback'),
    variant: t('variant'),
  };

  const summaryLabels = {
    summary: t('summary'),
    subtotal: t('subtotal'),
    shipping: t('shipping'),
    tax: t('tax'),
    discount: tCommon('discount'),
    total: t('total'),
    shippingAddress: t('shippingAddress'),
    billingAddress: t('billingAddress'),
  };

  const shippingAddr = order.shippingAddress as Record<string, any> | null;

  return (
    <div
      className={`min-h-screen bg-muted/20 vibe-pb-12 py-8 lg:py-12 ${VIBE_ANIMATION_FADE_IN}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vibe-container-max-6xl">
        <NextLink
          href={`/${locale}/orders`}
          className={`${VIBE_HOVER_GROUP} inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8 vibe-mb-8`}
        >
          <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-all duration-300" />
          {t('backToOrders')}
        </NextLink>

        <div className="vibe-flex-wrap-justify-between-items-end gap-6 vibe-mb-12">
          <div className="vibe-stack-y-2">
            <h1 className="text-3xl font-bold mb-8 vibe-mb-0">
              {t('orderNumber')} #{order.orderNumber}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed text-muted-foreground">
              {t('date')} : {formatDate(order.createdAt, locale)}
            </p>
          </div>
          <StatusBadge
            status={order.status}
            label={statusLabels[order.status]}
            className="vibe-px-6 vibe-py-2 font-black uppercase tracking-wider"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-6 space-y-10">
            <OrderStepper status={order.status} labels={statusLabels} />

            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
              <div className="vibe-info-box bg-info/5 border-info/20 text-info">
                <h3 className="text-xl font-bold text-foreground mb-4 vibe-flex-items-center-gap-2">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingTitle')
                    : tRefund('refundDoneTitle')}
                </h3>
                <p className="whitespace-pre-wrap leading-relaxed font-medium">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingMessage', {
                        name:
                          user.firstName ||
                          shippingAddr?.name?.split(' ')[0] ||
                          tRefund('clientFallback'),
                        amount: formatPrice(
                          order.totalAmount,
                          order.currency as any,
                          locale
                        ),
                        orderNumber: order.orderNumber,
                      })
                    : tRefund('refundDoneMessage', {
                        amount: formatPrice(
                          order.totalAmount,
                          order.currency as any,
                          locale
                        ),
                        currency: order.currency,
                      })}
                </p>
              </div>
            )}

            <OrderTracking
              shipments={order.shipments}
              labels={trackingLabels}
            />

            <OrderItemsList
              items={order.items}
              itemData={itemData}
              currency={order.currency}
              locale={locale}
              labels={itemsLabels}
            />

            <RefundRequestForm
              orderId={order.id}
              orderNumber={order.orderNumber}
              locale={locale}
              status={order.status}
              hasLabel={order.shipments.some(s => !!s.labelUrl)}
            />
          </div>

          <div className="lg:col-span-4 h-full">
            <OrderSummary
              order={order}
              locale={locale}
              labels={summaryLabels}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
