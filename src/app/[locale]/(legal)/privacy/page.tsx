import { getTranslations, getFormatter } from 'next-intl/server';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacyPolicy' });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });
  const format = await getFormatter({ locale });

  return (
    <LegalPageTemplate
      title={t('title')}
      lastUpdated={tLegal('lastUpdated', {
        date: format.dateTime(new Date(), { dateStyle: 'long' }),
      })}
      content={t('content')}
    />
  );
}
