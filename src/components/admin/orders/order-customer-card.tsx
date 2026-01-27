import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { User, Mail } from 'lucide-react';

interface OrderCustomerCardProps {
  user: any;
}

export async function OrderCustomerCard({ user }: OrderCustomerCardProps) {
  const locale = await getLocale();
  const tAdminOrders = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders',
  });

  return (
    <div className="admin-card">
      <h3 className="admin-section-title !mb-4 text-sm">
        <User className="h-4 w-4 text-gray-500" />
        {tAdminOrders('table.customer')}
      </h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
          {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <Link
            href={`/${locale}/admin/customers/${user?.id}`}
            className="text-xs text-blue-600 hover:underline"
          >
            {tAdminOrders('table.viewDetails')}
          </Link>
        </div>
      </div>
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          {user?.email}
        </div>
      </div>
    </div>
  );
}
