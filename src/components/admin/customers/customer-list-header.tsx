import { getTranslations } from 'next-intl/server';

interface CustomerListHeaderProps {
  locale: string;
}

export async function CustomerListHeader({ locale }: CustomerListHeaderProps) {
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.customers',
  });

  return (
    <div>
      <h1 className="admin-page-title">{t('title')}</h1>
      <p className="admin-page-subtitle">{t('subtitle')}</p>
    </div>
  );
}
