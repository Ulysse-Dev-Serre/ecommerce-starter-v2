import { getTranslations } from 'next-intl/server';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  return (
    <LegalPageTemplate
      title={t('privacyPolicy.title')}
      lastUpdated={t('lastUpdated', {
        date: new Date().toLocaleDateString(locale),
      })}
      content={t('privacyPolicy.content')}
    />
  );
}
