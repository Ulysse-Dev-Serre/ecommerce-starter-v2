import { getTranslations } from 'next-intl/server';
import { Target } from 'lucide-react';
import { User } from '@/generated/prisma';

interface CustomerAcquisitionCardProps {
  customer: Pick<User, 'utmSource' | 'utmMedium' | 'utmCampaign'>;
}

export async function CustomerAcquisitionCard({
  customer,
}: CustomerAcquisitionCardProps) {
  const t = await getTranslations('adminDashboard.customers.detail');

  return (
    <div className="admin-card">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-gray-900">
          {t('acquisitionSource')}
        </h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm py-1 border-b border-gray-50">
          <span className="admin-text-subtle text-xs uppercase font-medium">
            {t('source')}
          </span>
          <span className="font-medium text-gray-900">
            {customer.utmSource || t('directUnknown')}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-gray-50">
          <span className="admin-text-subtle text-xs uppercase font-medium">
            {t('medium')}
          </span>
          <span className="font-medium text-gray-900">
            {customer.utmMedium || '—'}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-gray-50">
          <span className="admin-text-subtle text-xs uppercase font-medium">
            {t('campaign')}
          </span>
          <span className="font-medium text-gray-900">
            {customer.utmCampaign || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
