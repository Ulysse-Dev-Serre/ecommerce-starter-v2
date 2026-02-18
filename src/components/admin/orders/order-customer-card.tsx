import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Mail, User as UserIcon } from 'lucide-react';
import { User } from '@/generated/prisma';

interface OrderCustomerCardProps {
  user: User | null;
}

export async function OrderCustomerCard({ user }: OrderCustomerCardProps) {
  const locale = await getLocale();
  const tAdminOrders = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders',
  });

  return (
    <div className="admin-card">
      <h2 className="admin-section-title !mb-4 text-sm">
        <UserIcon className="h-4 w-4 admin-text-subtle" />
        {tAdminOrders('table.customer')}
      </h2>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full admin-bg-subtle flex items-center justify-center admin-text-main font-bold border admin-border-subtle">
          {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium admin-text-main">
            {user?.firstName} {user?.lastName}
          </p>
          <Link
            href={`/${locale}/admin/customers/${user?.id}`}
            className="text-xs text-blue-600 hover:admin-text-main transition-colors"
          >
            {tAdminOrders('table.viewDetails')}
          </Link>
        </div>
      </div>
      <div className="space-y-3 pt-3 border-t admin-border-subtle">
        <div className="flex items-center gap-2 text-sm admin-text-subtle">
          <Mail className="h-4 w-4" />
          {user?.email}
        </div>
      </div>
    </div>
  );
}
