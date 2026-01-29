import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';
import { ContactInfo } from '@/components/contact/contact-info';
import { SUPPORTED_LOCALES } from '@/lib/config/site';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/contact`])
      ),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="vibe-section-py">
      <div className="vibe-layout-container vibe-container-max-4xl">
        <h1 className="vibe-page-header-center">{t('title')}</h1>

        <div className="vibe-container vibe-p-8">
          <div className="vibe-grid-2-cols">
            <ContactInfo locale={locale} />

            <div className="vibe-form-card">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
