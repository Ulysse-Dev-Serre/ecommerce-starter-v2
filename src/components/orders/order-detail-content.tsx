import { VIBE_HOVER_GROUP, VIBE_ANIMATION_FADE_IN } from '@/lib/vibe-styles';
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

type OrderDetail = Order & {
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
};

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
      className={`vibe-min-h-screen vibe-bg-muted-extra-soft vibe-pb-12 vibe-section-py ${VIBE_ANIMATION_FADE_IN}`}
    >
      <div className="vibe-layout-container vibe-container-max-6xl">
        <NextLink
          href={`/${locale}/orders`}
          className={`${VIBE_HOVER_GROUP} vibe-nav-link-prev vibe-mb-8`}
        >
          <ArrowLeft className="vibe-mr-2 vibe-icon-sm group-hover:vibe-translate-x-n1 vibe-transition" />
          {t('backToOrders')}
        </NextLink>

        <div className="vibe-flex-wrap-justify-between-items-end vibe-gap-6 vibe-mb-12">
          <div className="vibe-stack-y-2">
            <h1 className="vibe-page-header vibe-mb-0">
              {t('orderNumber')} #{order.orderNumber}
            </h1>
            <p className="vibe-text-p-lg vibe-text-muted">
              {t('date')} : {formatDate(order.createdAt, locale)}
            </p>
          </div>
          <StatusBadge
            status={order.status}
            label={statusLabels[order.status]}
            className="vibe-px-6 vibe-py-2 vibe-text-black-caps"
          />
        </div>

        <div className="vibe-grid-layout">
          <div className="vibe-grid-main vibe-stack-y-10">
            <OrderStepper status={order.status} labels={statusLabels} />

            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
              <div className="vibe-info-box vibe-info-box-styled">
                <h3 className="vibe-text-xl-bold vibe-mb-4 vibe-flex-items-center-gap-2">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingTitle')
                    : tRefund('refundDoneTitle')}
                </h3>
                <p className="whitespace-pre-wrap leading-relaxed vibe-text-medium">
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

          <div className="vibe-grid-side">
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
