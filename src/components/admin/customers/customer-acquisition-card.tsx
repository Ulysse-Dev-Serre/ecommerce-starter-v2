import { getTranslations } from 'next-intl/server';
import { Target } from 'lucide-react';

interface CustomerAcquisitionCardProps {
  customer: any;
}

export async function CustomerAcquisitionCard({
  customer,
}: CustomerAcquisitionCardProps) {
  const t = await getTranslations('adminDashboard.customers.detail');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-gray-900">
          {t('acquisitionSource')}
        </h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm py-1 border-b border-gray-50">
          <span className="text-gray-500 text-xs uppercase font-medium">
            Source
          </span>
          <span className="font-medium text-gray-900">
            {customer.utmSource || t('directUnknown')}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-gray-50">
          <span className="text-gray-500 text-xs uppercase font-medium">
            Medium
          </span>
          <span className="font-medium text-gray-900">
            {customer.utmMedium || '—'}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-gray-50">
          <span className="text-gray-500 text-xs uppercase font-medium">
            Campagne
          </span>
          <span className="font-medium text-gray-900">
            {customer.utmCampaign || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
