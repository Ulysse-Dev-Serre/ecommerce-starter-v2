import {
  VIBE_HOVER_GROUP,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
  VIBE_ANIMATION_FADE_IN,
} from '@/lib/vibe-styles';
import Link from 'next/link';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { Order, OrderItem, Payment } from '@/generated/prisma';

type UserOrder = Order & {
  items: OrderItem[];
  payments: Pick<Payment, 'status' | 'method'>[];
};

interface OrdersListContentProps {
  orders: UserOrder[];
  locale: string;
}

export async function OrdersListContent({
  orders,
  locale,
}: OrdersListContentProps) {
  const t = await getTranslations({ locale, namespace: 'Orders.list' });
  const tDetail = await getTranslations({ locale, namespace: 'Orders.detail' });

  const statusLabels: Record<string, string> = {
    PENDING: tDetail('statusPending'),
    PAID: tDetail('statusPaid'),
    SHIPPED: tDetail('statusShipped'),
    IN_TRANSIT: tDetail('statusInTransit'),
    DELIVERED: tDetail('statusDelivered'),
    CANCELLED: tDetail('statusCancelled'),
    REFUNDED: tDetail('statusRefunded'),
    REFUND_REQUESTED: tDetail('statusRefundRequested'),
  };

  return (
    <div className={`flex-1 vibe-section-py ${VIBE_ANIMATION_FADE_IN}`}>
      <div className="vibe-layout-6xl max-w-4xl">
        <h1 className="vibe-page-header vibe-mb-12">{t('title')}</h1>

        {orders.length === 0 ? (
          <div className="vibe-info-box">
            <PackageOpen className="vibe-w-16 vibe-h-16 vibe-text-muted-soft vibe-mb-6" />
            <p className="vibe-text-price-xl vibe-text-muted vibe-mb-8">
              {t('noOrders')}
            </p>
            <Link href={`/${locale}/shop`} className="vibe-button-primary">
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="vibe-stack-y-6">
            {orders.map((order, idx) => (
              <div
                key={order.id}
                className={`vibe-card ${VIBE_HOVER_GROUP} ${VIBE_ANIMATION_SLIDE_IN_BOTTOM}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="vibe-flex-wrap-justify-between-items-start vibe-gap-6">
                  <div className="vibe-stack-y-2">
                    <p className="vibe-text-xl-bold text-2xl">
                      {tDetail('orderNumber')} #{order.orderNumber}
                    </p>
                    <div className="vibe-flex-items-center-gap-3 vibe-text-xs-bold-muted-caps">
                      <span>{formatDate(order.createdAt, locale)}</span>
                      <span className="vibe-badge-dot-muted" />
                      <span>
                        {order.items.length}{' '}
                        {order.items.length > 1
                          ? tDetail('items').toLowerCase()
                          : tDetail('items').toLowerCase().replace(/s$/, '')}
                      </span>
                    </div>
                  </div>
                  <div className="vibe-text-right">
                    <StatusBadge
                      status={order.status}
                      label={statusLabels[order.status]}
                      className="vibe-px-4 vibe-py-1-5 vibe-text-black-caps"
                    />
                    <p className="vibe-mt-3 vibe-text-bold text-3xl">
                      {formatPrice(
                        order.totalAmount,
                        order.currency as any,
                        locale
                      )}
                    </p>
                  </div>
                </div>
                <div className="vibe-mt-8 vibe-pt-6 vibe-section-divider-top vibe-flex-justify-end">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="vibe-flex-items-center-gap-2 vibe-text-medium vibe-text-foreground vibe-hover-primary vibe-transition-all group/link"
                  >
                    {t('viewDetails')}
                    <ArrowRight className="vibe-icon-md group-hover:vibe-translate-x-1 vibe-transition" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
