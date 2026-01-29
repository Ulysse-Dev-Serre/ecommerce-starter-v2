import { getTranslations, getFormatter } from 'next-intl/server';
import { LegalPageTemplate } from '@/components/legal/legal-page-template';
import { LEGAL_LAST_UPDATED } from '@/lib/config/site';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacyPolicy' });

  return {
    title: t('title'),
  };
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
        date: format.dateTime(LEGAL_LAST_UPDATED, { dateStyle: 'long' }),
      })}
      content={t('content')}
    />
  );
}
