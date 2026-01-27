import { getTranslations } from 'next-intl/server';

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.categories',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">{t('title')}</h1>
        <p className="admin-page-subtitle">{t('subtitle')}</p>
      </div>

      <div className="admin-card text-center py-12">
        <p className="text-gray-500">{t('comingSoon')}</p>
      </div>
    </div>
  );
}
