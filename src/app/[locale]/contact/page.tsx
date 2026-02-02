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
    <div className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vibe-container-max-4xl">
        <h1 className="vibe-page-header text-center">{t('title')}</h1>

        <div className="vibe-container p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <ContactInfo locale={locale} />

            <div className="bg-background/50 p-6 rounded-xl border border-border/50">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
