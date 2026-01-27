import { getTranslations } from 'next-intl/server';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'legal.termsOfService',
  });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });

  return (
    <LegalPageTemplate
      title={t('title')}
      lastUpdated={tLegal('lastUpdated', {
        date: new Date().toLocaleDateString(locale),
      })}
      content={t('content')}
    />
  );
}
