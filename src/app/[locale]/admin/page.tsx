import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { prisma } from '@/lib/core/db';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { formatPrice } from '@/lib/utils/currency';
import { SITE_CURRENCY, SupportedCurrency } from '@/lib/config/site';
import { formatDate } from '@/lib/utils/date';
import { env } from '@/lib/core/env';
import { DashboardStatsGrid } from '@/components/admin/dashboard/dashboard-stats-grid';
import { RecentOrdersList } from '@/components/admin/dashboard/recent-orders-list';

export const dynamic = 'force-dynamic';

interface AdminDashboardProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.dashboard',
  });

  const currency = SITE_CURRENCY;
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  // Fetch real data from DB
  const [
    totalRevenue,
    prevRevenue,
    ordersCount,
    prevOrdersCount,
    productsCount,
    customersCount,
    prevCustomersCount,
    recentOrders,
    recentPayments,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _sum: { amount: true },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.product.count({
      where: { status: 'ACTIVE', deletedAt: null },
    }),
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // Process chart data
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(now.getDate() - (6 - i));
    const dayAmount = recentPayments
      .filter(p => p.createdAt.toDateString() === date.toDateString())
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      date: formatDate(date, locale, { weekday: 'short' }),
      amount: dayAmount,
    };
  });

  // Calculate trends
  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const diff = ((current - previous) / previous) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const stats = [
    {
      title: t('stats.revenue'),
      value: formatPrice(totalRevenue._sum.amount || 0, currency, locale),
      change: calcTrend(
        Number(totalRevenue._sum.amount || 0),
        Number(prevRevenue._sum.amount || 0)
      ),
      trend:
        (totalRevenue._sum.amount || 0) >= (prevRevenue._sum.amount || 0)
          ? 'up'
          : ('down' as any),
      icon: DollarSign,
    },
    {
      title: t('stats.orders'),
      value: ordersCount.toString(),
      change: calcTrend(ordersCount, prevOrdersCount),
      trend: ordersCount >= prevOrdersCount ? 'up' : ('down' as any),
      icon: ShoppingCart,
    },
    {
      title: t('stats.products'),
      value: productsCount.toString(),
      change: t('stats.active'),
      trend: 'up' as any,
      icon: Package,
    },
    {
      title: t('stats.customers'),
      value: customersCount.toString(),
      change: calcTrend(customersCount, prevCustomersCount),
      trend: customersCount >= prevCustomersCount ? 'up' : ('down' as any),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">{t('title')}</h1>
        <p className="admin-page-subtitle">{t('subtitle')}</p>
      </div>

      <DashboardStatsGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 admin-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold vibe-admin-text-main">
                {t('revenueOverview')}
              </h3>
              <p className="text-sm admin-text-subtle">{t('last7Days')}</p>
            </div>
            <TrendingUp className="h-5 w-5 admin-text-subtle" />
          </div>
          <RevenueChart data={chartData} label={t('stats.revenue')} />
        </div>

        <RecentOrdersList orders={recentOrders} />
      </div>
    </div>
  );
}
