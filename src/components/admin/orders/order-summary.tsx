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
    <div className="admin-bg-subtle px-6 py-4 border-t admin-border-subtle">
      <div className="flex flex-col gap-2 max-w-xs ml-auto">
        <div className="flex justify-between text-sm">
          <span className="admin-text-subtle">{t('summary.subtotal')}</span>
          <span className="admin-text-main font-medium">
            {formatPrice(subtotal, currency as SupportedCurrency, locale)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="admin-text-subtle">{t('summary.tax')}</span>
          <span className="admin-text-main font-medium">
            {formatPrice(tax, currency as SupportedCurrency, locale)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="admin-text-subtle">{t('summary.shipping')}</span>
          <span className="admin-text-main font-medium">
            {formatPrice(shipping, currency as SupportedCurrency, locale)}
          </span>
        </div>
        {Number(discount) > 0 && (
          <div className="flex justify-between text-sm admin-text-success font-medium">
            <span>{t('summary.discount')}</span>
            <span>
              -{formatPrice(discount, currency as SupportedCurrency, locale)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t admin-border-subtle pt-2 mt-1 admin-text-main">
          <span>{t('summary.total')}</span>
          <span>
            {formatPrice(total, currency as SupportedCurrency, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
