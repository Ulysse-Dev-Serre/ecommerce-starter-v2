import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { CustomerListHeader } from '@/components/admin/customers/customer-list-header';
import { CustomerStatsGrid } from '@/components/admin/customers/customer-stats-grid';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';

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

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now);
  thisWeek.setDate(now.getDate() - 7);
  const thisMonth = new Date(now);
  thisMonth.setMonth(now.getMonth() - 1);

  // 1. Fetch Stats
  const [totalCount, newToday, newWeek, newMonth] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
  ]);

  // 2. Fetch Customers List
  const customers = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit to 50 for now
  });

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
