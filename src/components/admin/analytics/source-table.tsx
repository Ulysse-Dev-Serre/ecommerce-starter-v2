import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils/currency';
import { SupportedCurrency } from '@/lib/constants';

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

export function SourceTable({ data }: SourceTableProps) {
  const t = useTranslations('adminDashboard.analytics.sourceTable');
  const locale = useLocale();

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
                {item.source === 'Direct / Organic' ||
                item.source === 'Direct / Organique'
                  ? t('directOrganic')
                  : item.source}
              </td>
              <td className="admin-table-td text-right text-gray-600">
                {item.visitors}
              </td>
              <td className="admin-table-td text-right text-gray-600">
                {item.orders}
              </td>
              <td className="admin-table-td text-right text-gray-900 font-medium">
                {formatPrice(item.revenue, 'CAD' as SupportedCurrency, locale)}
              </td>
              <td className="admin-table-td text-right">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {item.conversionRate}%
                </span>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                {t('noData')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
