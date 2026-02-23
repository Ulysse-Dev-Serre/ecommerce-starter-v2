import { getTranslations } from 'next-intl/server';

import {
  getAllUsersAdmin,
  getCustomerStatsAdmin,
} from '@/lib/services/users/user-admin.service';

import { CustomerListHeader } from '@/components/admin/customers/customer-list-header';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import { CustomerStatsGrid } from '@/components/admin/customers/customer-stats-grid';

export const dynamic = 'force-dynamic';

interface CustomersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({
  params,
  searchParams,
}: CustomersPageProps) {
  const { locale } = await params;
  const { q: query } = await searchParams;
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.customers',
  });

  // 1. Fetch Stats & Customers List
  const [{ totalCount, newToday, newWeek, newMonth }, { users: customers }] =
    await Promise.all([
      getCustomerStatsAdmin(),
      getAllUsersAdmin({
        search: query,
        limit: 50,
      }),
    ]);

  const stats = [
    {
      title: t('stats.total'),
      value: totalCount,
      variant: 'blue' as const,
    },
    {
      title: t('stats.today'),
      value: newToday,
      variant: 'green' as const,
    },
    {
      title: t('stats.last7Days'),
      value: newWeek,
      variant: 'purple' as const,
    },
    {
      title: t('stats.last30Days'),
      value: newMonth,
      variant: 'orange' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <CustomerListHeader locale={locale} />
      <CustomerStatsGrid stats={stats} />
      <CustomerListTable
        customers={customers}
        query={query}
        locale={locale}
        tSearchPlaceholder={t('table.searchPlaceholder')}
      />
    </div>
  );
}
