import { notFound } from 'next/navigation';

import { SITE_CURRENCY } from '@/lib/config/site';
import { prisma } from '@/lib/core/db';

import { CustomerAcquisitionCard } from '@/components/admin/customers/customer-acquisition-card';
import { CustomerAddressBook } from '@/components/admin/customers/customer-address-book';
import { CustomerHeader } from '@/components/admin/customers/customer-header';
import { CustomerInfoCard } from '@/components/admin/customers/customer-info-card';
import { CustomerNotesCard } from '@/components/admin/customers/customer-notes-card';
import { CustomerOrderTable } from '@/components/admin/customers/customer-order-table';
import { CustomerStats } from '@/components/admin/customers/customer-stats';

export const dynamic = 'force-dynamic';

interface CustomerDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { locale, id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          shipments: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const totalSpent = customer.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );
  const displayCurrency = SITE_CURRENCY;
  const totalOrders = customer.orders.length;

  return (
    <div className="space-y-6">
      <CustomerHeader customer={customer} locale={locale} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerStats
            totalSpent={totalSpent}
            totalOrders={totalOrders}
            currency={displayCurrency}
          />
          <CustomerOrderTable orders={customer.orders} />
          <CustomerAddressBook addresses={customer.addresses} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CustomerInfoCard customer={customer} />
          <CustomerAcquisitionCard customer={customer} />
          <CustomerNotesCard customer={customer} />
        </div>
      </div>
    </div>
  );
}
