import { getTranslations, getLocale } from 'next-intl/server';
import { DollarSign, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';

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
        <div className="flex items-center gap-4 text-primary">
          <div className="rounded-lg bg-primary/10 p-2">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              {t('totalSpent')}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(totalSpent, currency as any, locale)}
            </p>
          </div>
        </div>
      </div>
      <div className="admin-card">
        <div className="flex items-center gap-4 text-blue-600">
          <div className="rounded-lg bg-blue-50 p-2">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              {t('totalOrders')}
            </p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
