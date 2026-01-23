'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function OrderFilters({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || '';
  const currentSearch = searchParams.get('search') || '';

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page'); // Reset to page 1
    router.push(`/${locale}/admin/orders?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <form
          action={`/${locale}/admin/orders`}
          method="get"
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Search by order number or email..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {currentStatus && (
            <input type="hidden" name="status" value={currentStatus} />
          )}
        </form>
      </div>
      <OrderStatusFilter locale={locale} currentStatus={currentStatus} />
    </div>
  );
}

// Sub-component to handle translations cleanly

function OrderStatusFilter({
  locale,
  currentStatus,
}: {
  locale: string;
  currentStatus: string;
}) {
  const t = useTranslations('Orders.detail');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.delete('page'); // Reset to page 1
    router.push(`/${locale}/admin/orders?${params.toString()}`);
  };

  return (
    <select
      name="status"
      value={currentStatus}
      onChange={e => handleStatusChange(e.target.value)}
      className="rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">{t('status')}</option>
      <option value="PENDING">{t('statusPending')}</option>
      <option value="PAID">{t('statusPaid')}</option>
      <option value="SHIPPED">{t('statusShipped')}</option>
      <option value="DELIVERED">{t('statusDelivered')}</option>
      <option value="CANCELLED">{t('statusCancelled')}</option>
      <option value="REFUNDED">{t('statusRefunded')}</option>
    </select>
  );
}
