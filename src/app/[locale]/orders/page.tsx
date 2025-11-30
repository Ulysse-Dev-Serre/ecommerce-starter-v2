import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getUserOrders } from '@/lib/services/order.service';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({
  params,
}: OrdersPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const orders = await getUserOrders(user.id);

  const t = {
    fr: {
      title: 'Mes commandes',
      noOrders: "Vous n'avez pas encore de commandes.",
      shopNow: 'Commencer vos achats',
      orderNumber: 'Commande',
      date: 'Date',
      status: 'Statut',
      total: 'Total',
      viewDetails: 'Voir détails',
    },
    en: {
      title: 'My Orders',
      noOrders: "You don't have any orders yet.",
      shopNow: 'Start shopping',
      orderNumber: 'Order',
      date: 'Date',
      status: 'Status',
      total: 'Total',
      viewDetails: 'View details',
    },
  }[locale] || {
    title: 'My Orders',
    noOrders: "You don't have any orders yet.",
    shopNow: 'Start shopping',
    orderNumber: 'Order',
    date: 'Date',
    status: 'Status',
    total: 'Total',
    viewDetails: 'View details',
  };

  const statusLabels: Record<string, Record<string, string>> = {
    fr: {
      PENDING: 'En attente',
      PAID: 'Payée',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    },
    en: {
      PENDING: 'Pending',
      PAID: 'Paid',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="flex-1 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-6">{t.noOrders}</p>
            <Link
              href={`/${locale}/shop`}
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.shopNow}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-lg">
                      {t.orderNumber} #{order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t.date}:{' '}
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === 'fr' ? 'fr-CA' : 'en-CA'
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} article
                      {order.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                    >
                      {statusLabels[locale]?.[order.status] || order.status}
                    </span>
                    <p className="mt-2 text-xl font-bold">
                      {order.totalAmount.toString()} {order.currency}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="text-primary hover:underline"
                  >
                    {t.viewDetails} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
