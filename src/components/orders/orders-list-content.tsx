import {
  VIBE_HOVER_GROUP,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
  VIBE_ANIMATION_FADE_IN,
} from '@/lib/config/vibe-styles';
import Link from 'next/link';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { Order, OrderItem, Payment } from '@/generated/prisma';
import { SupportedCurrency } from '@/lib/config/site';

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
  const t = await getTranslations({ locale, namespace: 'orders.list' });
  const tDetail = await getTranslations({ locale, namespace: 'orders.detail' });

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
    <div className={`flex-grow py-8 lg:py-12 ${VIBE_ANIMATION_FADE_IN}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vibe-container-max-4xl">
        <h1 className="text-3xl font-bold mb-8 vibe-mb-12">{t('title')}</h1>

        {orders.length === 0 ? (
          <div className="vibe-info-box">
            <PackageOpen className="vibe-w-16 vibe-h-16 text-muted-foreground/30 mb-6" />
            <p className="text-2xl font-bold text-foreground text-muted-foreground vibe-mb-8">
              {t('noOrders')}
            </p>
            <Link href={`/${locale}/shop`} className="vibe-button-primary">
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <div
                key={order.id}
                className={`vibe-card ${VIBE_HOVER_GROUP} ${VIBE_ANIMATION_SLIDE_IN_BOTTOM}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="vibe-flex-wrap-justify-between-items-start gap-6">
                  <div className="vibe-stack-y-2">
                    <p className="text-xl font-bold text-foreground text-3xl font-bold text-foreground">
                      {tDetail('orderNumber')} #{order.orderNumber}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>{formatDate(order.createdAt, locale)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span>
                        {order.items.length}{' '}
                        {order.items.length > 1
                          ? tDetail('items').toLowerCase()
                          : tDetail('items').toLowerCase().replace(/s$/, '')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      status={order.status}
                      label={statusLabels[order.status]}
                      className="px-4 py-1.5 font-black uppercase tracking-wider"
                    />
                    <p className="vibe-mt-3 font-bold vibe-text-3xl">
                      {formatPrice(
                        order.totalAmount,
                        order.currency as SupportedCurrency,
                        locale
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border pt-4 mt-4 flex justify-end">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="vibe-flex-items-center-gap-2 font-medium text-foreground hover:text-primary transition-all duration-300 group/link"
                  >
                    {t('viewDetails')}
                    <ArrowRight className="h-16 w-16 group-hover:vibe-translate-x-1 transition-all duration-300" />
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
