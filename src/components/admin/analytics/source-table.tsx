import { getTranslations, getLocale } from 'next-intl/server';

import { SupportedCurrency } from '@/lib/config/site';
import { formatPrice } from '@/lib/utils/currency';

interface SourceData {
  source: string;
  visitors: number;
  orders: number;
  revenue: number;
  conversionRate: string;
}

interface SourceTableProps {
  data: SourceData[];
}

export async function SourceTable({ data }: SourceTableProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.analytics.sourceTable',
  });

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead className="admin-table-thead">
          <tr>
            <th className="admin-table-th">{t('source')}</th>
            <th className="admin-table-th text-right">{t('visitors')}</th>
            <th className="admin-table-th text-right">{t('orders')}</th>
            <th className="admin-table-th text-right">{t('revenue')}</th>
            <th className="admin-table-th text-right">{t('convRate')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map(item => (
            <tr key={item.source} className="admin-table-tr">
              <td className="admin-table-td font-medium text-gray-900">
                {['Direct / Organic', 'Direct / Organique'].includes(
                  item.source
                )
                  ? t('directOrganic')
                  : item.source}
              </td>
              <td className="admin-table-td text-right admin-text-subtle">
                {item.visitors}
              </td>
              <td className="admin-table-td text-right admin-text-subtle">
                {item.orders}
              </td>
              <td className="admin-table-td text-right font-medium text-gray-900">
                {formatPrice(item.revenue, 'CAD' as SupportedCurrency, locale)}
              </td>
              <td className="admin-table-td text-right">
                <span className="admin-badge-info">{item.conversionRate}%</span>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center admin-text-subtle"
              >
                {t('noData')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
