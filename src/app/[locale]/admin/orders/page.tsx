import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/core/db';
import { OrderFilters } from '@/components/admin/orders/filters';
import { OrderStatus } from '@/generated/prisma';
import { OrderListTable } from '@/components/admin/orders/order-list-table';
import { OrderPagination } from '@/components/admin/orders/order-pagination';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function OrdersPage({
  params,
  searchParams,
}: OrdersPageProps) {
  const { locale } = await params;
  const { page = '1', limit = '20', status, search } = await searchParams;

  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders',
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};
  if (status && status !== 'ALL') {
    where.status = status as OrderStatus;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  // Fetch data
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">{t('title')}</h1>
        <p className="admin-page-subtitle">{t('subtitle')}</p>
      </div>

      <OrderFilters locale={locale} />

      <OrderListTable orders={orders} locale={locale} />

      {totalPages > 1 && (
        <OrderPagination
          pageNum={pageNum}
          limitNum={limitNum}
          total={total}
          totalPages={totalPages}
          status={status}
          search={search}
        />
      )}
    </div>
  );
}
