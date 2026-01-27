import { Link } from 'lucide-react'; // Placeholder to fix lint but we need real Link
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
  productData: Record<string, { image?: string; slug: string; name?: string }>;
}

export async function OrderDetailContent({
  order,
  user,
  locale,
  productData,
}: OrderDetailContentProps) {
  const t = await getTranslations({ locale, namespace: 'Orders.detail' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tRefund = await getTranslations({ locale, namespace: 'Orders.refund' });

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
    <div className="min-h-screen bg-muted/20 pb-12 animate-in fade-in duration-700 vibe-section-py">
      <div className="vibe-layout-container max-w-6xl">
        <NextLink
          href={`/${locale}/orders`}
          className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToOrders')}
        </NextLink>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              {t('orderNumber')} #{order.orderNumber}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {t('date')} : {formatDate(order.createdAt, locale)}
            </p>
          </div>
          <StatusBadge
            status={order.status}
            label={statusLabels[order.status]}
            className="px-6 py-2.5 text-base font-black uppercase tracking-widest"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <OrderStepper status={order.status} labels={statusLabels} />

            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
              <div className="vibe-info-box bg-info/5 border-info/20 text-info">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
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
              productData={productData}
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

          <OrderSummary order={order} locale={locale} labels={summaryLabels} />
        </div>
      </div>
    </div>
  );
}
