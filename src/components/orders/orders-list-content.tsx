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
    <div className="flex-1 vibe-section-py animate-in fade-in duration-700">
      <div className="vibe-layout-container max-w-4xl">
        <h1 className="vibe-page-header mb-12">{t('title')}</h1>

        {orders.length === 0 ? (
          <div className="vibe-info-box">
            <PackageOpen className="w-16 h-16 text-muted-foreground/30 mb-6" />
            <p className="text-xl text-muted-foreground mb-8">
              {t('noOrders')}
            </p>
            <Link
              href={`/${locale}/shop`}
              className="vibe-button vibe-button-primary"
            >
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <div
                key={order.id}
                className="vibe-card group animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-wrap justify-between items-start gap-6">
                  <div className="space-y-2">
                    <p className="font-extrabold text-2xl text-foreground">
                      {tDetail('orderNumber')} #{order.orderNumber}
                    </p>
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
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
                    <p className="mt-3 text-3xl font-black text-foreground">
                      {formatPrice(
                        order.totalAmount,
                        order.currency as any,
                        locale
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="inline-flex items-center gap-2 text-base font-bold text-foreground hover:text-primary transition-all group/link"
                  >
                    {t('viewDetails')}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
