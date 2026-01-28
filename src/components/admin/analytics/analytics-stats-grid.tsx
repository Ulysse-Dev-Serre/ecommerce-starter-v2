import { getTranslations, getLocale } from 'next-intl/server';
import { formatPrice } from '@/lib/utils/currency';
import { SupportedCurrency } from '@/lib/config/site';

interface AnalyticsStatsGridProps {
  sessions: number;
  purchases: number;
  totalRevenue: number;
}

export async function AnalyticsStatsGrid({
  sessions,
  purchases,
  totalRevenue,
}: AnalyticsStatsGridProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.analytics',
  });

  const conversionRate =
    sessions > 0 ? ((purchases / sessions) * 100).toFixed(2) : '0';
  const averageOrderValue = purchases > 0 ? totalRevenue / purchases : 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="admin-card">
        <p className="text-sm font-medium text-gray-500">
          {t('overallConversion')}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {conversionRate}%
        </p>
      </div>
      <div className="admin-card">
        <p className="text-sm font-medium text-gray-500">
          {t('avgOrderValue')}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          {formatPrice(averageOrderValue, 'CAD' as SupportedCurrency, locale)}
        </p>
      </div>
      <div className="admin-card">
        <p className="text-sm font-medium text-gray-500">
          {t('totalSessions')}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{sessions}</p>
      </div>
    </div>
  );
}
