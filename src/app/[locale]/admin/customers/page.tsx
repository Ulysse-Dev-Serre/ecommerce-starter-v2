import Link from 'next/link';
import { Users, UserPlus, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';

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
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: t('stats.today'),
      value: newToday,
      icon: UserPlus,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: t('stats.last7Days'),
      value: newWeek,
      icon: UserPlus,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: t('stats.last30Days'),
      value: newMonth,
      icon: UserPlus,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">{t('title')}</h1>
        <p className="admin-page-subtitle">{t('subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.title} className="admin-card">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg ${stat.bg} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <form className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={t('table.searchPlaceholder')}
              className="admin-input pl-10"
            />
          </form>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead className="admin-table-thead">
              <tr>
                <th className="admin-table-th">{t('table.client')}</th>
                <th className="admin-table-th">{t('table.email')}</th>
                <th className="admin-table-th">
                  {t('table.registrationDate')}
                </th>
                <th className="admin-table-th text-right">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    {t('table.noCustomers')}
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="admin-table-tr">
                    <td className="admin-table-td">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {customer.firstName?.[0] ||
                            customer.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="admin-table-td text-gray-600">
                      {customer.email}
                    </td>
                    <td className="admin-table-td text-gray-600">
                      {customer.createdAt.toLocaleDateString(
                        locale === 'fr' ? 'fr-FR' : 'en-US'
                      )}
                    </td>
                    <td className="admin-table-td text-right">
                      <Link
                        href={`/${locale}/admin/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('table.viewDetails')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
