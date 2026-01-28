import { getTranslations, getLocale } from 'next-intl/server';
import { formatPrice } from '@/lib/utils/currency';
import { SupportedCurrency } from '@/lib/config/site';

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
}

export async function OrderSummary({
  subtotal,
  tax,
  shipping,
  discount,
  total,
  currency,
}: OrderSummaryProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders.detail',
  });

  return (
    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
      <div className="flex flex-col gap-2 max-w-xs ml-auto">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('summary.subtotal')}</span>
          <span className="text-gray-900">
            {formatPrice(subtotal, currency as SupportedCurrency, locale)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('summary.tax')}</span>
          <span className="text-gray-900">
            {formatPrice(tax, currency as SupportedCurrency, locale)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('summary.shipping')}</span>
          <span className="text-gray-900">
            {formatPrice(shipping, currency as SupportedCurrency, locale)}
          </span>
        </div>
        {Number(discount) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{t('summary.discount')}</span>
            <span>
              -{formatPrice(discount, currency as SupportedCurrency, locale)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-1">
          <span>{t('summary.total')}</span>
          <span>
            {formatPrice(total, currency as SupportedCurrency, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
