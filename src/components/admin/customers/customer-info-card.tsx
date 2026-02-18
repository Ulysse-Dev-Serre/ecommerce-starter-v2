import { getTranslations, getLocale } from 'next-intl/server';
import { Mail, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { User } from '@/generated/prisma';

interface CustomerInfoCardProps {
  customer: User;
}

export async function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.customers.detail',
  });

  return (
    <div className="admin-card">
      <h3 className="admin-section-title !mb-4 text-sm font-semibold text-gray-900">
        {t('contactInfo')}
      </h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900">{customer.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {t('joinedOn', {
              date: formatDate(customer.createdAt, locale),
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
