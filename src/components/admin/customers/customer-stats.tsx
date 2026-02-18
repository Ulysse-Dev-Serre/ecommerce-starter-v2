import { getTranslations, getLocale } from 'next-intl/server';
import { DollarSign, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import { SupportedCurrency } from '@/lib/config/site';

interface CustomerStatsProps {
  totalSpent: number;
  totalOrders: number;
  currency: string;
}

export async function CustomerStats({
  totalSpent,
  totalOrders,
  currency,
}: CustomerStatsProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.customers.detail',
  });

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="admin-card">
        <div className="flex items-center gap-4 admin-text-main">
          <div className="rounded-lg admin-bg-primary-subtle p-2">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('totalSpent')}
            </p>
            <p className="text-2xl font-bold admin-text-main">
              {formatPrice(totalSpent, currency as SupportedCurrency, locale)}
            </p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4 admin-text-info">
          <div className="rounded-lg admin-bg-info-subtle p-2">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium admin-text-subtle">
              {t('totalOrders')}
            </p>
            <p className="text-2xl font-bold admin-text-main">{totalOrders}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
