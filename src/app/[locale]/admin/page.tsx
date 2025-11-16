import Link from 'next/link';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

import { prisma } from '@/lib/db/prisma';
import { StatusBadge } from '@/components/admin/orders/status-badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch real data from DB
  const [
    totalRevenue,
    ordersCount,
    productsCount,
    customersCount,
    recentOrders,
  ] = await Promise.all([
    // Total revenue from completed payments
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    // Total orders count
    prisma.order.count(),
    // Total active products count
    prisma.product.count({
      where: { status: 'ACTIVE', deletedAt: null },
    }),
    // Total customers count
    prisma.user.count(),
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
  ]);

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${(totalRevenue._sum.amount || 0).toFixed(2)}`,
      change: 'CAD',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Orders',
      value: ordersCount.toString(),
      change: 'Total orders',
      trend: 'up',
      icon: ShoppingCart,
    },
    {
      title: 'Products',
      value: productsCount.toString(),
      change: 'Active products',
      trend: 'up',
      icon: Package,
    },
    {
      title: 'Customers',
      value: customersCount.toString(),
      change: 'Registered users',
      trend: 'up',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of your ecommerce performance
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart placeholder */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">Chart placeholder</p>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:text-primary/80"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                No orders yet
              </p>
            ) : (
              recentOrders.map(order => {
                const timeAgo = Math.floor(
                  (Date.now() - new Date(order.createdAt).getTime()) / 60000
                );
                const displayTime =
                  timeAgo < 60
                    ? `${timeAgo} minute${timeAgo !== 1 ? 's' : ''} ago`
                    : timeAgo < 1440
                      ? `${Math.floor(timeAgo / 60)} hour${Math.floor(timeAgo / 60) !== 1 ? 's' : ''} ago`
                      : `${Math.floor(timeAgo / 1440)} day${Math.floor(timeAgo / 1440) !== 1 ? 's' : ''} ago`;

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.email} • {displayTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
