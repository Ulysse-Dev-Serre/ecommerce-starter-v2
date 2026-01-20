import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

import { prisma } from '@/lib/db/prisma';
import { StatusBadge } from '@/components/admin/orders/status-badge';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
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
    // Current total revenue
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    // Previous Revenue (to calc trend)
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      _sum: { amount: true },
    }),
    // Total orders count
    prisma.order.count(),
    // Previous Orders Count
    prisma.order.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    // Total active products count
    prisma.product.count({
      where: { status: 'ACTIVE', deletedAt: null },
    }),
    // Total customers count
    prisma.user.count(),
    // Previous Customers Count
    prisma.user.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    // Recent orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
    // Payments for the last 7 days chart
    prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }),
  ]);

  // Process chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(now.getDate() - (6 - i));
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short' });

    const dayAmount = recentPayments
      .filter(p => p.createdAt.toDateString() === date.toDateString())
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      date: dateStr,
      amount: dayAmount,
    };
  });

  // Calculate trends
  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const diff = ((current - previous) / previous) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const revenueTrend = calcTrend(
    Number(totalRevenue._sum.amount || 0),
    Number(prevRevenue._sum.amount || 0)
  );
  const ordersTrend = calcTrend(ordersCount, prevOrdersCount);
  const customersTrend = calcTrend(customersCount, prevCustomersCount);

  const stats = [
    {
      title: "Chiffre d'affaires",
      value: `$${(totalRevenue._sum.amount || 0).toFixed(2)}`,
      change: revenueTrend,
      trend: Number(revenueTrend.replace('%', '')) >= 0 ? 'up' : 'down',
      icon: DollarSign,
    },
    {
      title: 'Commandes',
      value: ordersCount.toString(),
      change: ordersTrend,
      trend: Number(ordersTrend.replace('%', '')) >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
    },
    {
      title: 'Produits',
      value: productsCount.toString(),
      change: 'Actifs',
      trend: 'up',
      icon: Package,
    },
    {
      title: 'Clients registrados',
      value: customersCount.toString(),
      change: customersTrend,
      trend: Number(customersTrend.replace('%', '')) >= 0 ? 'up' : 'down',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-sm text-gray-600">
          Vue d'ensemble de la performance de votre boutique
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-gray-100 p-2">
                  <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Aperçu des revenus
              </h3>
              <p className="text-sm text-gray-500">7 derniers jours</p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Recent orders */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Commandes récentes
            </h3>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:text-primary/80"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                Aucune commande
              </p>
            ) : (
              recentOrders.map(order => {
                const timeAgo = Math.floor(
                  (Date.now() - new Date(order.createdAt).getTime()) / 60000
                );
                const displayTime =
                  timeAgo < 60
                    ? `${timeAgo} min`
                    : timeAgo < 1440
                      ? `${Math.floor(timeAgo / 60)}h`
                      : `${Math.floor(timeAgo / 1440)}j`;

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.user?.email} • {displayTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium text-gray-900">
                        ${order.totalAmount.toString()}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
