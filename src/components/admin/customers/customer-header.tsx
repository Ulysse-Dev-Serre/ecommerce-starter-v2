import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { User } from '@/generated/prisma';

interface CustomerHeaderProps {
  customer: User;
  locale: string;
}

export async function CustomerHeader({
  customer,
  locale,
}: CustomerHeaderProps) {
  const t = await getTranslations('adminDashboard.customers.detail');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/customers`}
          className="admin-btn-secondary p-2"
        >
          <ArrowLeft className="h-5 w-5 admin-text-subtle" />
        </Link>
        <div>
          <h1 className="admin-page-title">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="admin-page-subtitle">
            {t('customerId')}: {customer.id}
          </p>
        </div>
      </div>
    </div>
  );
}
