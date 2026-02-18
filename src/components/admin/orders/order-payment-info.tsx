import { getTranslations, getLocale } from 'next-intl/server';
import { CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { SupportedCurrency } from '@/lib/config/site';
import { OrderPayment } from '@/lib/types/domain/order';

interface OrderPaymentInfoProps {
  payments: OrderPayment[];
}

export async function OrderPaymentInfo({ payments }: OrderPaymentInfoProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders.detail',
  });

  return (
    <div className="admin-card p-0 overflow-hidden">
      <div className="border-b admin-border-subtle admin-bg-subtle px-6 py-4">
        <h3 className="admin-section-title !mb-0 text-sm">
          <CreditCard className="h-4 w-4 admin-text-subtle" />
          {t('paymentInfo')}
        </h3>
      </div>
      <div className="p-6">
        {payments.length === 0 ? (
          <p className="text-sm admin-text-subtle">{t('noPaymentData')}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {payments.map((p, idx) => (
              <div
                key={p.id}
                className={
                  idx > 0
                    ? 'pt-6 border-t border-gray-100 md:border-t-0 md:pt-0'
                    : ''
                }
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="admin-text-subtle">{t('payment.method')}</dt>
                  <dd className="font-medium admin-text-main">{p.method}</dd>

                  <dt className="admin-text-subtle">{t('payment.status')}</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </dd>

                  <dt className="admin-text-subtle">{t('payment.amount')}</dt>
                  <dd className="admin-text-main">
                    {formatPrice(
                      p.amount,
                      p.currency as SupportedCurrency,
                      locale
                    )}
                  </dd>

                  <dt className="admin-text-subtle">
                    {t('payment.transactionId')}
                  </dt>
                  <dd className="admin-text-main break-all font-mono text-[10px]">
                    {p.externalId}
                  </dd>

                  <dt className="admin-text-subtle">
                    {t('payment.processedAt')}
                  </dt>
                  <dd className="admin-text-main">
                    {p.processedAt
                      ? formatDate(p.processedAt, locale)
                      : t('na')}
                  </dd>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
