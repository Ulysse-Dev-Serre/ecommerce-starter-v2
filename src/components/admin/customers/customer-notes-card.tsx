import { getTranslations } from 'next-intl/server';
import { User } from '@/generated/prisma';

interface CustomerNotesCardProps {
  customer: User;
}

export async function CustomerNotesCard({
  customer: _customer,
}: CustomerNotesCardProps) {
  const t = await getTranslations('adminDashboard.customers.detail');

  return (
    <div className="admin-card">
      <h3 className="font-semibold text-gray-900 mb-2 italic">
        {t('internalNote')}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed">
        {t('internalNoteHelper')}
      </p>
      <textarea
        className="mt-3 admin-input min-h-[100px]"
        placeholder={t('addNotePlaceholder')}
      ></textarea>
      <button className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
        {t('saveNote')}
      </button>
    </div>
  );
}
